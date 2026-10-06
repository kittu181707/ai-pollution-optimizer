# ClearRoute

Whole-day personal environmental exposure optimizer. Import a fixed day, confirm travel, and let AWS find the smallest realistic route/mode/timing change that reduces modeled pollution exposure without moving appointments.

> The product ships as **ClearRoute** by default; set `VITE_PRODUCT_NAME` to override the display name for a deployment.

## Product focus

AQI dashboards tell users that air is bad. This product answers the harder question: **which part of the day is actually worth changing?**

The judge-facing story is deliberately narrow: fixed appointments → AWS evaluates route/mode/timing options → one useful change is surfaced → the user sees the same analyzed route geometry and accepts the plan.

## Implemented

- Manual agenda entry and `.ics` calendar import with UTC and IANA `TZID` handling for timed events.
- Controlled, CI-locked four-leg Delhi demo with explicit **DEMO DATA** provenance.
- Multi-journey travel confirmation and a whole-day maximum-extra-travel preference.
- Amazon Location Places + Routes V2 for live geocoding and verified car/pedestrian/transit routing.
- Route-segment environmental sampling for PM2.5, PM10, AQI, temperature, humidity, wind, rain and UV. Tomorrow.io is the primary live/forecast provider when configured; Open-Meteo remains a live fallback.
- Pollution-first deterministic optimization; heat/UV/weather are secondary and inconvenience is third.
- Candidate generation includes ±5/±10 minute shifts and materially useful alternatives; negligible changes with added inconvenience are suppressed.
- Bounded whole-day dynamic programming with randomized brute-force equivalence tests.
- Judge dashboard with before/after pollution index, a single best-action callout, route-weighted environmental snapshot, AWS proof metrics and a split route view.
- Interactive Amazon Location Maps V2 route comparison with live traffic, current/recommended geometry, sample-based pollution hotspots, pan/zoom controls, and static-map/SVG fallbacks.
- Accepted plan shows the exact analyzed route geometry; it does not substitute generic directions.
- Bedrock explanations are grounded in persisted deterministic facts and cannot invent numeric scores.
- API Gateway + Lambda + Express Step Functions + DynamoDB + Amazon Location + Bedrock + Amplify deployment setup.
- Step Functions execution logging to CloudWatch.

## Deliberate exclusions

- No community/Impact dashboard or eco gamification.
- No Leaflet/CARTO dependency in the competition path.
- No live bicycle recommendation where the configured AWS route provider cannot verify bicycle routing.
- No medical safety, disease-avoidance or exact-dose claims.
- Recurring-calendar expansion is not implemented; the `.ics` importer handles timed events for the selected day.

## Local development

```bash
npm install
npm run dev
```

The root dev command runs backend and frontend together. Open `http://localhost:5173`. Local route comparison falls back to verified geometry unless a browser Amazon Location API key is configured.

For live environmental data, set `TOMORROW_IO_API_KEY` in `backend/.env`. The backend keeps this key server-side, refreshes cached environmental results every five minutes, and falls back to Open-Meteo if Tomorrow.io is unavailable.

## AWS deployment

AWS SAM builds the TypeScript handlers with esbuild.

```bash
npm install --global esbuild@0.24.2
sam validate
sam build --parallel
sam deploy --guided
```

Deploy `frontend/` to Amplify and set `VITE_API_BASE_URL` to the SAM `ApiEndpoint` output.


### Live map configuration

The deployed UI uses **Amazon Location Maps V2** as the map data source, with the AWS-recommended MapLibre renderer. The map requests the Amazon Standard style with live traffic enabled and overlays the exact route geometries already evaluated by the optimizer.

The SAM stack creates a public **map-only** Amazon Location API key and exposes it through the backend's `/api/config` endpoint. The frontend discovers that configuration automatically at runtime, so there is no manual map-key copy step and no rebuild is required when the key changes.

MapLibre is bundled into the frontend build rather than loaded from a third-party CDN. This removes a runtime dependency and makes map rendering more reliable.

For Amplify, the only required frontend connection setting is:

```bash
VITE_API_BASE_URL=<SAM ApiEndpoint output>
```

`VITE_AWS_REGION`, `VITE_AMAZON_LOCATION_MAP_STYLE`, and `VITE_AMAZON_LOCATION_API_KEY` remain optional development/override settings.

For production, deploy the stack with `MapAllowedReferer` set to the actual Amplify/site URL instead of `*`. The browser key is restricted to Amazon Location map rendering and cannot call the optimizer or routing APIs.

### Live weather and air data

Set the SAM parameter `TomorrowIoApiKey` during deployment. The optimizer requests fresh hourly environmental conditions for route samples, while the dashboard refreshes current conditions every five minutes for today's active plan. If Tomorrow.io fails, the backend automatically falls back to Open-Meteo rather than rendering stale data.


## Scientific language

Results use **modeled pollution exposure**, **estimated exposure reduction**, **high-UV outdoor time**, and **lower-exposure route**. These are decision-support estimates, not medical measurements.

## Validation

```bash
cd backend
npm ci
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
