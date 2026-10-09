import type { APIGatewayProxyEvent } from 'aws-lambda';
import { json } from '../http';
import { history } from '../services/persistence';
import { sessionUserId, matchesSession } from '../auth';

const USER_ID_RE = /^[a-zA-Z0-9_-]{2,160}$/;

export const handler = async (event: APIGatewayProxyEvent) => {
  if (!sessionUserId(event)) return json(401, { message: 'Private session required' });
  try {
    const userId = event.queryStringParameters?.userId || '';
    if (!USER_ID_RE.test(userId)) return json(400, { message: 'Invalid userId' });
    if (!matchesSession(event, userId)) return json(403, { message: 'Session does not match user' });
    return json(200, { plans: await history(userId) });
  } catch (error) {
    return json(500, { message: error instanceof Error ? error.message : 'Could not load history' });
  }
};
