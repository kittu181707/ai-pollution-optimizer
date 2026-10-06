import "dotenv/config";
import express from "express";
import cors from "cors";
import type { APIGatewayProxyEvent } from "aws-lambda";
import { handler as ics } from "./src/handlers/ics";
import { handler as demo } from "./src/handlers/demo";
import { handler as explain } from "./src/handlers/explain";
import { runDirectAnalysis } from "./src/services/analyze";
import { handler as prepare } from "./src/handlers/prepare";
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
app.get("/api/demo/day", async (req, res) => send(res, await demo()));
app.post("/api/ics/parse", async (req, res) =>
  send(res, await ics(event(req))),
);
app.post("/api/day/analyze", async (req, res) => {
  try {
    const prepared = await prepare(req.body);
    const plan = await runDirectAnalysis(prepared);
    mem.set(plan.planId, plan);
    res.json(plan);
  } catch (e) {
    res
      .status(500)
      .json({ message: e instanceof Error ? e.message : "Analysis failed" });
  }
});
app.post("/api/plan/accept", (req, res) => {
  const plan = mem.get(req.body.planId);
  if (!plan) return res.status(404).json({ message: "Plan not found" });
  const accepted = { ...plan, acceptedAt: new Date().toISOString() },
    key = `history:${req.body.userId}`;
  mem.set(key, [accepted, ...(mem.get(key) || [])]);
  const g = mem.get("GLOBAL_IMPACT") || { totalPlans: 0, totalCo2eSaved: 0 };
  g.totalPlans++;
  const s = plan.metrics?.estimatedCo2eChangeKg
    ? Math.max(0, -plan.metrics.estimatedCo2eChangeKg)
    : 0;
  if (s > 0) g.totalCo2eSaved += s;
  mem.set("GLOBAL_IMPACT", g);
  res.json(accepted);
});
app.get("/api/history", (req, res) =>
  res.json({ plans: mem.get(`history:${req.query.userId}`) || [] }),
);
app.get("/api/impact/community", (req, res) =>
  res.json(mem.get("GLOBAL_IMPACT") || { totalPlans: 0, totalCo2eSaved: 0 }),
);
app.post("/api/explain", async (req, res) =>
  send(res, await explain(event(req))),
);
app.listen(3001, () => console.log("Local backend on http://localhost:3001"));
setInterval(() => {}, 1000 * 60 * 60);
