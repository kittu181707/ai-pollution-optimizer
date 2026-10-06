import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'ai-pollution-optimizer-trips';

export const acceptHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing request body" }) };
    }

    const request = JSON.parse(event.body);
    const { userId, originalTrip, recommendation, estimatedSavings } = request;

    if (!userId || !originalTrip || !recommendation) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing required fields" }) };
    }

    const tripId = uuidv4();
    
    // Eco Points formula: 10 base + 20 per kg CO2e avoided + 1 point per % exposure reduced
    let ecoPoints = 10;
    if (estimatedSavings?.co2eAvoidedKg > 0) ecoPoints += Math.round(estimatedSavings.co2eAvoidedKg * 20);
    if (estimatedSavings?.exposureReductionPercent > 0) ecoPoints += estimatedSavings.exposureReductionPercent;

    const item = {
      userId,
      tripId,
      timestamp: new Date().toISOString(),
      originalMode: originalTrip.mode,
      recommendedMode: recommendation.mode,
      distanceKm: originalTrip.distanceKm,
      co2eAvoidedKg: estimatedSavings?.co2eAvoidedKg || 0,
      exposureReductionPercent: estimatedSavings?.exposureReductionPercent || 0,
      ecoPoints
    };

    // If local dev or DEMO_MODE, just mock success unless we have actual local Dynamo running
    const DEMO_MODE = process.env.DEMO_MODE === 'true';
    if (!DEMO_MODE) {
      try {
        await docClient.send(new PutCommand({
          TableName: TABLE_NAME,
          Item: item
        }));
      } catch (dbError) {
        console.error("DynamoDB Write Error:", dbError);
        // Continue even if DB write fails in hackathon context, or return 500
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ success: true, tripId, ecoPoints, item }),
    };

  } catch (err: any) {
    console.error('Trip Accept API Error:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: "Internal server error", error: err?.message })
    };
  }
};
