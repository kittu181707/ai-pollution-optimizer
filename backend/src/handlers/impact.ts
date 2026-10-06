import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { communityImpact } from '../services/persistence';
import { json } from '../http';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const stats = await communityImpact();
    return json(200, stats);
  } catch (error) {
    console.error('Impact error:', error);
    return json(500, { message: 'Failed to retrieve impact stats' });
  }
};
