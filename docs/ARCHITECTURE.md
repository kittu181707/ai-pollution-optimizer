# Architecture

The browser only collects agenda/travel preferences and renders backend results. Route generation, environmental sampling, scoring and whole-day ranking stay on AWS.

## Analysis workflow
1. API Gateway starts a synchronous Express Step Functions workflow.
2. Prepare Lambda validates the fixed agenda, journey chain and whole-day extra-time budget.
3. Optimize Lambda geocodes with Amazon Location Places and creates timed route candidates with Amazon Location Routes.
4. Each candidate route is sampled at three geographic points; hourly PM2.5/PM10/AQI, temperature, humidity, wind, rain and UV are loaded for those route positions.
5. Segment exposure is summed as PM2.5 × segment minutes × transport factor.
6. The optimizer ranks plans lexicographically: pollution first, heat/UV/weather second, inconvenience third.
7. Persist Lambda stores the analyzed plan in DynamoDB.
8. Amazon Location Maps V2 renders the current/recommended route comparison and environmental sample hotspots on demand.
9. Bedrock optionally explains verified optimizer facts. It never produces or changes numeric scores.

## Hard constraints
- Appointment times do not move.
- Candidates must arrive before the matching appointment.
- Total extra travel stays within the user's tolerance.
- Unroutable modes are excluded rather than estimated.
- Live bicycle recommendations are disabled when the configured route provider cannot verify bicycle routing.

## Observability
The Step Functions workflow emits execution data to CloudWatch Logs. Lambda logs preserve route/environment failures and map-rendering failures for the demo.

The original pollution exposure is normalized to an index of 100. This is a transparent decision-support model, not a medical dose.
