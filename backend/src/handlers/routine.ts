import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'ai-pollution-optimizer-trips';

export const routineHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const method = event.httpMethod;
    const userId = event.queryStringParameters?.userId || (event.body ? JSON.parse(event.body).userId : null);

    if (!userId) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing userId" }) };
    }

    if (method === 'GET') {
      const response = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "userId = :uid and begins_with(tripId, :prefix)",
        ExpressionAttributeValues: {
          ":uid": userId,
          ":prefix": "routine_"
        }
      }));
      return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(response.Items || []) };
    }

    if (method === 'POST') {
      const { title, time, origin, destination, mode } = JSON.parse(event.body || '{}');
      const tripId = `routine_${uuidv4()}`;
      const item = { userId, tripId, title, time, origin, destination, mode, timestamp: new Date().toISOString() };
      
      await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
      return { statusCode: 201, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(item) };
    }

    if (method === 'DELETE') {
      const tripId = event.queryStringParameters?.tripId;
      if (tripId) {
        await docClient.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { userId, tripId } }));
      }
      return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': '*' }, body: '' };
    }

    return { statusCode: 405, body: "Method not allowed" };

  } catch (err: any) {
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ message: err.message }) };
  }
};
