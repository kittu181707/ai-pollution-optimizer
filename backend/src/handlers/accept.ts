import type { APIGatewayProxyEvent } from 'aws-lambda';
import { body, json } from '../http';
import { acceptPlan } from '../services/persistence';
import { sessionUserId, matchesSession } from '../auth';

const ID_RE = /^[a-zA-Z0-9_-]{2,160}$/;

export const handler = async (event: APIGatewayProxyEvent) => {
  if (!sessionUserId(event)) return json(401, { message: 'Private session required' });
  try {
    const input = body<{ userId: string; planId: string }>(event.body);
    if (!ID_RE.test(input.userId || '') || !ID_RE.test(input.planId || '')) {
      return json(400, { message: 'Invalid userId or planId' });
    }
    if (!matchesSession(event, input.userId)) return json(403, { message: 'Session does not match user' });
    return json(200, await acceptPlan(input.userId, input.planId));
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Could not accept plan';
    return json(message.includes('belong') || message.includes('not found') ? 404 : 500, { message });
  }
};
