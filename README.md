# AI Personal Pollution Optimizer

## Problem
Delhi residents can see pollution data (AQI), but pollution dashboards don't tell them how to change everyday decisions. Most users just check the AQI and go about their day, absorbing the pollution anyway.

## Solution
Our system turns environmental data into personalized travel decisions.
Instead of simply showing users the current AQI, our application analyzes a user's planned trip and recommends a better travel option based on:
1. Estimated pollution exposure
2. Estimated transport emissions (CO2e)
3. Travel time
4. User preferences

## Features
- **Personalized Optimizer:** Compares routes across Metro, Bus, Car, Cycle, and Walk.
- **Exposure Model:** Transparent estimation of personal pollution exposure based on travel mode, time, and ambient pollution.
- **Emissions Model:** Configurable estimation of Transport CO2e footprints per route.
- **Eco Dashboard:** Personal tracker showing trips optimized, Eco points, and estimated CO2e avoided.
- **Collective Impact:** Real-time (simulated for demo) view of Delhi's collective pollution savings.

## Real External APIs Used
- **Geocoding:** Nominatim (OpenStreetMap) API.
- **Routing:** OSRM Public API (for Car, Walk, Cycle). Transit options are currently extrapolated/estimated based on road distance due to MVP constraints.
- **Environmental Data:** Open-Meteo Air Quality & Weather API.
- **Mapping:** React-Leaflet overlaying OpenStreetMap tiles.

## Architecture
- **Frontend:** React, Vite, TypeScript, TailwindCSS v4, Leaflet Map
- **Backend (AWS):** API Gateway, AWS Lambda (NodeJS 20), DynamoDB
- **Database:** DynamoDB (`userId`, `tripId`, `timestamp`, etc.)
- **Infrastructure:** AWS SAM (`template.yaml` provided)

## Environment Variables
- `VITE_API_BASE_URL` (Frontend): URL to your deployed API Gateway (or `http://localhost:3001` for local Express testing)
- `DEMO_MODE` (Backend): Set to `'true'` to use simulated endpoints if APIs are down.
- `TABLE_NAME` (Backend): Name of the DynamoDB table (default: `ai-pollution-optimizer-trips`)

## AWS Deployment
1. Set up your AWS credentials locally.
2. Ensure you have the AWS SAM CLI installed.
3. Deploy the backend:
   ```bash
   sam build
   sam deploy --guided
   ```
4. Deploy the frontend to AWS Amplify, providing the `VITE_API_BASE_URL` as an environment variable in the Amplify Console.

## Local Testing
To test the backend without AWS credentials, a local Express wrapper is provided.
```bash
cd backend
npm install
npm run start
```
Then run the frontend in a separate terminal:
```bash
cd frontend
npm install
npm run dev
```

## How the Optimization Works (Deterministically)
The optimization engine scores trips based on three normalized pillars:
- `Exposure`
- `Emissions`
- `Travel Time`
A deterministic algorithm in the AWS Lambda weights these inputs based on user preference ("Lowest Pollution Exposure", "Lowest Emission", "Fastest", or "Balanced"). 

## Important Scientific Distinction
- **Estimated Exposure:** Calculated as `Live PM2.5 × Travel Time × Transport Exposure Factor`. It represents the pollution absorbed by the user.
- **Estimated CO2e Emissions:** Calculated as `Distance × Transport CO2e Factor`. It represents the climate impact of the chosen transport mode.

## Cost Considerations
This MVP is designed to stay 100% within AWS Free Tier credits:
- Serverless Lambda runs only on invocation.
- DynamoDB is configured to `PAY_PER_REQUEST`.
- Open-Meteo and OSRM APIs are free for moderate use.

## Limitations & Future Improvements
- OSRM does not support public transit routes natively, so transit distances are estimated.
- Pollution interpolation is simplified to the origin node. A future improvement would sample PM2.5 at 1km intervals along the OSRM route geometry.
