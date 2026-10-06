import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { handler as optimizeHandler } from './src/handlers/optimize';
import { handler as environmentHandler } from './src/handlers/environment';
import { acceptHandler as tripAcceptHandler } from './src/handlers/trip';
import { dashboardHandler, impactHandler } from './src/handlers/dashboard';
import { routineHandler } from './src/handlers/routine';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Helper to convert Express req/res to APIGateway format
const toApiGatewayEvent = (req: any) => ({
  httpMethod: req.method,
  body: JSON.stringify(req.body),
  queryStringParameters: req.query,
  headers: req.headers,
} as any);

const sendResponse = (res: any, result: any) => {
  res.status(result.statusCode).set(result.headers || {}).send(result.body);
};

app.post('/api/optimize', async (req, res) => {
  const result = await optimizeHandler(toApiGatewayEvent(req));
  sendResponse(res, result);
});

app.get('/api/environment', async (req, res) => {
  const result = await environmentHandler(toApiGatewayEvent(req));
  sendResponse(res, result);
});

app.post('/api/trip/accept', async (req, res) => {
  const result = await tripAcceptHandler(toApiGatewayEvent(req));
  sendResponse(res, result);
});

app.get('/api/dashboard', async (req, res) => {
  const result = await dashboardHandler(toApiGatewayEvent(req));
  sendResponse(res, result);
});

app.get('/api/impact', async (req, res) => {
  const result = await impactHandler(toApiGatewayEvent(req));
  sendResponse(res, result);
});

app.get('/api/routine', async (req, res) => {
  const result = await routineHandler(toApiGatewayEvent(req));
  sendResponse(res, result);
});

app.post('/api/routine', async (req, res) => {
  const result = await routineHandler(toApiGatewayEvent(req));
  sendResponse(res, result);
});

app.delete('/api/routine', async (req, res) => {
  const result = await routineHandler(toApiGatewayEvent(req));
  sendResponse(res, result);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Local mock API Gateway running on http://localhost:${PORT}`);
});
