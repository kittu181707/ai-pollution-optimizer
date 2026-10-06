# PROJECT_NAME

Whole-day personal environmental exposure optimizer. The app imports a user's agenda, confirms travel, evaluates route/timing alternatives on AWS, and recommends the smallest realistic changes that reduce modeled pollution, heat, UV and weather exposure without moving fixed appointments.

> Branding is intentionally a placeholder. Set `VITE_PRODUCT_NAME` when the final name is chosen.

## Implemented

- Manual agenda entry and `.ics` calendar import.
- Controlled demo day.
- Multi-journey travel confirmation and maximum-extra-travel preference.
- Amazon Location Routes V2 for live car, pedestrian and transit candidates; deterministic Lambda bike heuristic.
- Backend pollution/weather/UV inputs.
- Deterministic modeled exposure scoring; Bedrock never produces numeric scores.
- Whole-day combinatorial optimization with arrival and time-budget constraints.
- Before/after metrics, exact changes, route comparison, explanation drawer, accepted plan and history.
- API Gateway + Lambda + Express Step Functions + DynamoDB + Bedrock + Amplify deployment setup.

## Local development

```bash
cd backend && npm install && cp .env.example .env && npm run dev
cd frontend && npm install && cp .env.example .env && npm run dev
```

Open `http://localhost:5173`. Demo mode keeps all optimization on the backend while controlling external data.

## AWS deployment

```bash
sam build
sam deploy --guided
```

Deploy `frontend/` to Amplify and set `VITE_API_BASE_URL` to the SAM `ApiEndpoint` output. Optionally set `VITE_PRODUCT_NAME` and `BedrockModelId` later.

The browser never runs the optimizer. In production, `/api/day/analyze` starts the Step Functions workflow; analysis does not silently fall back to client-side optimization.

## Scientific language

Results use **modeled exposure**, **estimated exposure reduction**, **high-UV outdoor time**, and **lower-exposure route**. The product does not claim medical safety, disease avoidance, or exact inhaled dose.

## Validation

```bash
cd backend && npm run typecheck && npm test
cd ../frontend && npm run typecheck && npm run build
```
