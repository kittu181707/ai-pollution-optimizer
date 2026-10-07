import { createHash, createHmac } from 'node:crypto';
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { json } from '../http';

const KEY_NAME_RE = /^[-._\w]{1,100}$/;

export const handler = async (_event: APIGatewayProxyEvent) => {
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-south-1';
  const mapStyle = process.env.AMAZON_LOCATION_MAP_STYLE || 'Standard';

  if (process.env.LOCAL_MODE === 'true') {
    return json(200, {
      region,
      mapStyle,
      mapApiKey: process.env.AMAZON_LOCATION_API_KEY || null,
      source: process.env.AMAZON_LOCATION_API_KEY ? 'local environment' : 'local fallback',
    });
  }

  const keyName = process.env.MAP_API_KEY_NAME || '';
  if (!KEY_NAME_RE.test(keyName)) {
    return json(503, { message: 'Live map configuration is unavailable' });
  }

  try {
    const key = await describeMapKey(region, keyName);
    if (!key) throw new Error('Amazon Location returned an empty key');

    return json(200, {
      region,
      mapStyle,
      mapApiKey: key,
      source: 'Amazon Location API key',
    });
  } catch (error) {
    console.error('Runtime config error:', error);
    return json(503, { message: 'Live map configuration is temporarily unavailable' });
  }
};

async function describeMapKey(region: string, keyName: string) {
  const hostname = `cp.metadata.geo.${region}.amazonaws.com`;
  const path = `/metadata/v0/keys/${encodeURIComponent(keyName)}`;
  const { SignatureV4 } = require('@smithy/signature-v4') as { SignatureV4: any };
  const { defaultProvider } = require('@aws-sdk/credential-provider-node') as { defaultProvider: () => any };

  const signer = new SignatureV4({
    credentials: defaultProvider(),
    region,
    service: 'geo',
    sha256: NodeSha256,
  });

  const signed = await signer.sign({
    protocol: 'https:',
    hostname,
    method: 'GET',
    path,
    headers: { host: hostname },
  });

  const response = await fetch(`https://${hostname}${path}`, {
    headers: signed.headers as Record<string, string>,
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`Amazon Location DescribeKey failed (${response.status})`);

  const payload = await response.json() as { Key?: string };
  return payload.Key?.trim() || '';
}

class NodeSha256 {
  private hash: ReturnType<typeof createHash> | ReturnType<typeof createHmac>;

  constructor(secret?: string | Uint8Array) {
    this.hash = secret === undefined
      ? createHash('sha256')
      : createHmac('sha256', secret);
  }

  update(data: string | Uint8Array) {
    this.hash.update(data);
  }

  async digest() {
    return Uint8Array.from(this.hash.digest());
  }
}
