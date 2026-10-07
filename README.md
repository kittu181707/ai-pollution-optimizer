# AI Personal Pollution Optimizer

A whole-day environmental exposure optimizer that keeps fixed appointments intact while finding practical route, mode, and timing changes with lower modeled pollution exposure.

## Production stack

- **Maps:** Amazon Location Maps V2, rendered with MapLibre, with live traffic, pan/zoom, automatic route fitting, route overlays, and a verified-geometry fallback.
- **Routes:** Amazon Location Routes V2 for live car, pedestrian, and transit routing. The app does not fabricate bicycle routes when live Amazon routing cannot verify them.
- **Geocoding:** Amazon Location Places.
- **Weather + UV + air quality:** Tomorrow.io when a server-side key is supplied; Open-Meteo automatically remains a live fallback.
- **Optimization:** AWS Lambda + Express Step Functions.
- **Explanations:** Amazon Bedrock, grounded in deterministic optimizer results.
- **Persistence:** DynamoDB.
- **Frontend:** AWS Amplify compatible.

## Live behavior

The production map key is created by the SAM stack and is restricted to Amazon Location map rendering. The browser does **not** need a manually copied Amazon map key: it calls `/api/runtime-config`, whose Lambda is allowed only to describe that single public map key.

Current environmental conditions refresh every five minutes. If the user has entered a real home location, Amazon Places geocodes it. Otherwise the browser may request location permission. The UI never substitutes hardcoded AQI/weather values for a failed live request.

Tomorrow.io is optional. Without a Tomorrow.io key, the backend still returns live weather, UV, PM2.5, PM10, AQI, humidity, wind, and rain probability through the Open-Meteo fallback.

## Local development

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

In another terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`.

For local interactive Amazon maps, `AMAZON_LOCATION_API_KEY` may be placed in `backend/.env`. Without it, local development uses the verified route-geometry fallback.

## AWS deployment

Install the SAM TypeScript builder and deploy:

```bash
npm install --global esbuild@0.24.2
sam validate
sam build --parallel
sam deploy --guided
```

Recommended SAM parameter values:

```text
DemoMode=false
AppTimezoneOffset=+05:30
TomorrowIoApiKey=<optional server-side Tomorrow.io key>
MapAllowedReferer=*
```

For a production domain, replace `MapAllowedReferer=*` with the Amplify/site referer pattern after the first deployment.

Deploy `frontend/` to Amplify and set:

```text
VITE_API_BASE_URL=<ApiEndpoint output from the SAM stack>
```

That is the only required frontend deployment variable. `VITE_AMAZON_LOCATION_API_KEY` is an optional local/debug override; production discovers the SAM-created key automatically.

## Validation

The CI pipeline blocks merges unless all of these pass:

```bash
cd backend
npm install
npm run typecheck
npm test

cd ../frontend
npm install
npm run test:ui
npm run typecheck
npm run build

cd ..
sam validate
sam build --parallel
```

The product uses **modeled exposure** and **estimated exposure reduction** language. It does not claim medical safety, disease avoidance, or exact inhaled dose.
