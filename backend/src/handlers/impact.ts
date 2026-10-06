import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { communityImpact } from '../services/persistence';
import { sendError, sendJson } from '../http';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const stats = await communityImpact();
    return sendJson(stats);
  } catch (error) {
    console.error('Impact error:', error);
    return sendError(500, 'Failed to retrieve impact stats');
  }
};
