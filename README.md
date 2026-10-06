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

## Architecture
- **Frontend:** React, Vite, TypeScript, TailwindCSS v4
- **Backend (AWS):** API Gateway, AWS Lambda (NodeJS 20), DynamoDB
- **Hosting:** AWS Amplify

## AWS Deployment
1. Set up your AWS credentials locally.
2. Ensure you have the AWS SAM CLI installed.
3. Deploy the backend:
   ```bash
   cd backend
   sam build
   sam deploy --guided
   ```
4. Deploy the frontend to AWS Amplify:
   - Connect the repository to AWS Amplify Console.
   - Run `npm install && npm run build` as build commands.

## How the Optimization Works (Deterministically)
The optimization engine scores trips based on three normalized pillars:
- `Exposure`
- `Emissions`
- `Travel Time`
A deterministic algorithm weights these inputs based on user preference ("Lowest Pollution Exposure", "Lowest Emission", "Fastest", or "Balanced"). 
*No LLM is used to fabricate numeric calculation. Numerical values remain rigorous and reproducible.*

## Demo Mode
In absence of real live Google Maps Routes and real-time CPCB API tokens (as this is a Hackathon MVP), a **Demo Mode** robustly mocks the environmental inputs for specific locations to demonstrate the full application lifecycle.

## Cost Considerations
This MVP is designed to stay 100% within AWS Free Tier credits:
- Serverless Lambda runs only on invocation.
- DynamoDB is configured to `PAY_PER_REQUEST`.
- No always-on GPU / SageMaker endpoints.

## Future Improvements
- Integrate live CPCB pollution APIs.
- Integrate Google Maps Routes API for precise live traffic and distance.
- Add an optional AWS SageMaker prediction model for route planning an hour ahead.
