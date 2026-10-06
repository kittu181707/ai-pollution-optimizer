# Architecture

The browser collects agenda/travel preferences and renders verified backend results. Route generation, environmental sampling, scoring and whole-day ranking stay on AWS.

## Analysis workflow
1. API Gateway starts a synchronous Express Step Functions workflow.
2. Prepare Lambda validates the fixed agenda, journey chain and whole-day extra-time budget.
3. Optimize Lambda fans independent journeys out concurrently, geocodes with Amazon Location Places, and creates timed route candidates with Amazon Location Routes.
4. Each candidate route is sampled at three geographic points; hourly PM2.5/PM10/AQI, temperature, humidity, wind, rain and UV are loaded for those route positions.
5. Segment exposure is summed as PM2.5 × segment minutes × transport factor.
6. Candidate generation includes ±5/±10 minute departure shifts and all route-provider-verifiable modes. Changes with extra travel and less than 2% pollution improvement are suppressed as not materially useful.
7. The whole-day dynamic-programming optimizer ranks pollution first, heat/UV/weather second, and inconvenience third while respecting the user's total extra-time budget.
8. Persist Lambda stores the analyzed plan in DynamoDB.
9. Amazon Location Maps V2 renders current/recommended route geometry and environmental sample hotspots on demand.
10. Bedrock optionally rewrites persisted deterministic facts. It never produces or changes numeric scores.

## Hard constraints
- Appointment times do not move.
- Candidates must arrive before the matching appointment.
- Total extra travel stays within the user's tolerance.
- Unroutable modes are excluded rather than estimated.
- Live bicycle selection is disabled when the configured route provider cannot verify bicycle routing.
- Demo inputs are explicitly marked as controlled demo data and never labeled live.

## Deployment
Every Lambda function is built from TypeScript with SAM's esbuild build method. CI runs backend tests, a local HTTP demo→analyze→accept→history→map smoke path, `sam validate`, `sam build --parallel`, the frontend product contract, TypeScript checks and the production Vite build.

## Observability
The Step Functions workflow emits execution data to CloudWatch Logs. Lambda logs preserve route/environment failures and map-rendering failures. The result payload also records analysis runtime, route count, plan count, sample count and data mode for judge-facing proof.

The original pollution exposure is normalized to an index of 100. This is transparent decision support, not a medical dose or health outcome prediction.
