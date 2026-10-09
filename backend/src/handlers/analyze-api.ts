import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SFNClient, StartSyncExecutionCommand } from '@aws-sdk/client-sfn';
import type { AnalyzeDayRequest } from '../types';
import { body, json } from '../http';
import { sessionUserId } from '../auth';
import { handler as prepare } from './prepare';
import { runDirectAnalysis } from '../services/analyze';
import { persistDraft } from '../services/persistence';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const userId = sessionUserId(event);
  if (!userId) return json(401, { message: 'Private session required' });
  try {
    const input = body<AnalyzeDayRequest>(event.body);
    if (!input || input.userId !== userId) return json(403, { message: 'Session does not match user' });
    const prepared = await prepare(input);
    if (process.env.LOCAL_MODE === 'true' || !process.env.WORKFLOW_ARN) {
      const plan = await runDirectAnalysis(prepared);
      await persistDraft(plan);
      return json(200, plan);
    }
    const sfn = new SFNClient({});
    const result = await sfn.send(new StartSyncExecutionCommand({
      stateMachineArn: process.env.WORKFLOW_ARN,
      input: JSON.stringify(prepared),
      name: `analysis-${Date.now()}`,
    }));
    if (result.status !== 'SUCCEEDED') throw new Error(result.error || result.cause || 'Optimization workflow failed');
    return json(200, JSON.parse(result.output || '{}'));
  } catch (error) {
    console.error(error);
    return json(400, { message: error instanceof Error ? error.message : 'Analysis failed' });
  }
};
