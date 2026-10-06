# PROJECT_NAME

Whole-day personal environmental exposure optimizer. Import a fixed day, confirm travel, and let AWS find the smallest realistic route/mode/timing changes that reduce modeled pollution exposure without moving appointments.

> Branding is intentionally a placeholder. Set `VITE_PRODUCT_NAME` when the final name is chosen.

## Implemented

- Manual agenda entry and `.ics` calendar import.
- Controlled, CI-locked Delhi demo.
- Multi-journey travel confirmation and whole-day maximum-extra-travel preference.
- Amazon Location Places + Routes V2 for live geocoding and verified car/pedestrian/transit routing.
- Route-segment environmental sampling for PM2.5, PM10, AQI, temperature, humidity, wind, rain and UV.
- Pollution-first deterministic optimization; heat/UV/weather are secondary and inconvenience is third.
- Candidate generation includes ±5/±10 minute shifts, alternate routes, and every realistically routable mode.
- Bounded whole-day dynamic programming rather than exponential enumeration.
- Before/after pollution metrics, exact changes, Amazon Location static map comparison, hotspot samples, explanation drawer, accepted plan and history.
- Bedrock explanations are grounded in persisted deterministic facts and cannot invent numeric scores.
- API Gateway + Lambda + Express Step Functions + DynamoDB + Amazon Location + Bedrock + Amplify deployment setup.
- Step Functions execution logging to CloudWatch.

## Local development

```bash
cd backend && npm install && cp .env.example .env && npm run dev
cd frontend && npm install && cp .env.example .env && npm run dev
```

Open `http://localhost:5173`. Local route comparison falls back to the geometry preview; deployed AWS uses Maps V2.

## AWS deployment

```bash
sam build
sam deploy --guided
```

Deploy `frontend/` to Amplify and set `VITE_API_BASE_URL` to the SAM `ApiEndpoint` output.

## Scientific language

Results use **modeled pollution exposure**, **estimated exposure reduction**, **high-UV outdoor time**, and **lower-exposure route**. The product does not claim medical safety, disease avoidance, or exact inhaled dose.

## Validation

```bash
cd backend && npm run typecheck && npm test
cd ../frontend && npm run typecheck && npm run build
```
