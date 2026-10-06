import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { handler as ics } from './src/handlers/ics';
import { handler as demo } from './src/handlers/demo';
import { handler as explain } from './src/handlers/explain';
import { runDirectAnalysis } from './src/services/analyze';
import { handler as prepare } from './src/handlers/prepare';

process.env.LOCAL_MODE = 'true';
process.env.DEMO_MODE = process.env.DEMO_MODE || 'true';

const app = express();
app.use(cors());
app.use(express.json({ limit: '700kb' }));

const memory = new Map<string, any>();
const event = (req: any) => ({
  body: req.body ? JSON.stringify(req.body) : null,
  queryStringParameters: req.query || null,
  httpMethod: req.method,
  path: req.path,
  headers: req.headers,
} as unknown as APIGatewayProxyEvent);
const send = (res: any, result: any) => res.status(result.statusCode).set(result.headers || {}).send(result.body);

app.get('/api/demo/day', async (_req, res) => send(res, await demo()));
app.post('/api/ics/parse', async (req, res) => send(res, await ics(event(req))));

app.post('/api/day/analyze', async (req, res) => {
  try {
    const prepared = await prepare(req.body);
    const plan = await runDirectAnalysis(prepared);
    memory.set(plan.planId, plan);
    res.json(plan);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Analysis failed' });
  }
});

app.post('/api/plan/accept', (req, res) => {
  const userId = String(req.body?.userId || '');
  const planId = String(req.body?.planId || '');
  const plan = memory.get(planId);
  if (!plan || plan.userId !== userId) return res.status(404).json({ message: 'Plan not found' });

  const accepted = { ...plan, acceptedAt: new Date().toISOString() };
  const key = `history:${userId}`;
  memory.set(key, [accepted, ...(memory.get(key) || [])]);
  return res.json(accepted);
});

app.get('/api/history', (req, res) => {
  const userId = String(req.query.userId || '');
  return res.json({ plans: memory.get(`history:${userId}`) || [] });
});

app.post('/api/map/static', (_req, res) => res.json({ imageDataUrl: null, source: 'Local geometry preview' }));
app.post('/api/explain', async (req, res) => send(res, await explain(event(req))));

app.listen(3001, () => console.log('Local backend on http://localhost:3001'));
