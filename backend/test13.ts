import "dotenv/config";
import express from "express";
import cors from "cors";
import type { APIGatewayProxyEvent } from "aws-lambda";

process.env.LOCAL_MODE = "true";
process.env.DEMO_MODE = process.env.DEMO_MODE || "true";
const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
const mem = new Map<string, any>();
const event = (req: any) =>
  ({
    body: req.body ? JSON.stringify(req.body) : null,
    queryStringParameters: req.query || null,
    httpMethod: req.method,
    path: req.path,
    headers: req.headers,
  }) as unknown as APIGatewayProxyEvent;
const send = (res: any, r: any) =>
  res
    .status(r.statusCode)
    .set(r.headers || {})
    .send(r.body);
app.get("/api/demo/day", async (req, res) => res.json({}));
app.post("/api/ics/parse", async (req, res) => res.json({}));
app.post("/api/day/analyze", async (req, res) => res.json({}));
app.post("/api/plan/accept", (req, res) => res.json({}));
app.get("/api/history", (req, res) => res.json({ plans: [] }));
app.get("/api/impact/community", (req, res) => res.json({}));
app.post("/api/explain", async (req, res) => res.json({}));
app.listen(3001, () => console.log("Local backend on http://localhost:3001"));
setInterval(() => console.log('alive'), 1000);
