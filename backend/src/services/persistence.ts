import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { DayAnalysis } from '../types';

const table = () => process.env.TABLE_NAME || 'ai-pollution-optimizer-plans';
let documentClient: DynamoDBDocumentClient | undefined;

function doc() {
  if (!documentClient) documentClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
  return documentClient;
}

export async function persistDraft(plan: DayAnalysis) {
  if (process.env.LOCAL_MODE === 'true') return plan;
  const expiresAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
  await doc().send(new PutCommand({
    TableName: table(),
    Item: {
      pk: `PLAN#${plan.planId}`,
      sk: 'PLAN',
      userId: plan.userId,
      status: 'analyzed',
      createdAt: plan.createdAt,
      expiresAt,
      plan,
    },
  }));
  return plan;
}

export async function getPlan(planId: string) {
  const result = await doc().send(new GetCommand({
    TableName: table(),
    Key: { pk: `PLAN#${planId}`, sk: 'PLAN' },
  }));
  return result.Item as { userId?: string; plan?: DayAnalysis } | undefined;
}

export async function acceptPlan(userId: string, planId: string) {
  if (process.env.LOCAL_MODE === 'true') throw new Error('LOCAL_ACCEPT');
  const draft = await getPlan(planId);
  if (!draft?.plan) throw new Error('Plan not found');
  if (draft.userId !== userId || draft.plan.userId !== userId) throw new Error('Plan does not belong to this user');

  const acceptedAt = new Date().toISOString();
  const plan = { ...draft.plan, acceptedAt };
  
  await doc().send(new PutCommand({
    TableName: table(),
    Item: {
      pk: `USER#${userId}`,
      sk: `PLAN#${acceptedAt}#${planId}`,
      planId,
      acceptedAt,
      plan,
    },
  }));

  // Update global impact stats
  const co2eSaved = plan.metrics?.estimatedCo2eChangeKg
    ? Math.max(0, -plan.metrics.estimatedCo2eChangeKg) // Negative change is savings
    : 0;

  try {
    await doc().send(new UpdateCommand({
      TableName: table(),
      Key: { pk: 'GLOBAL', sk: 'IMPACT' },
      UpdateExpression: 'ADD totalPlans :one, totalCo2eSaved :co2e',
      ExpressionAttributeValues: {
        ':one': 1,
        ':co2e': co2eSaved
      }
    }));
  } catch (err) {
    console.error('Failed to update global impact', err);
  }

  return plan;
}

export async function history(userId: string) {
  if (process.env.LOCAL_MODE === 'true') return [];
  const result = await doc().send(new QueryCommand({
    TableName: table(),
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: { ':pk': `USER#${userId}` },
    ScanIndexForward: false,
    Limit: 20,
  }));
  return (result.Items || []).map((item) => item.plan);
}

export async function communityImpact() {
  if (process.env.LOCAL_MODE === 'true') return { totalPlans: 0, totalCo2eSaved: 0 };
  const result = await doc().send(new GetCommand({
    TableName: table(),
    Key: { pk: 'GLOBAL', sk: 'IMPACT' },
  }));
  return {
    totalPlans: result.Item?.totalPlans || 0,
    totalCo2eSaved: result.Item?.totalCo2eSaved || 0,
  };
}
