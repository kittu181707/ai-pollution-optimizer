import { createHash, timingSafeEqual } from 'node:crypto';
import type { APIGatewayProxyEvent } from 'aws-lambda';

// Anonymous, possession-based session; not verified account authentication.
export function sessionUserId(event: Pick<APIGatewayProxyEvent, 'headers'>): string | null {
  const authorization = event.headers?.authorization || event.headers?.Authorization || '';
  const match = /^Bearer ([a-f0-9]{64})$/.exec(authorization);
  if (!match) return null;
  return 'user-' + createHash('sha256').update(match[1]).digest('hex').slice(0, 32);
}

export function matchesSession(event: Pick<APIGatewayProxyEvent, 'headers'>, userId: string): boolean {
  const actual = sessionUserId(event);
  if (!actual || typeof userId !== 'string' || actual.length !== userId.length) return false;
  return timingSafeEqual(Buffer.from(actual), Buffer.from(userId));
}
