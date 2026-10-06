# Demo runbook

1. Load the controlled Delhi demo.
2. Review four fixed appointments and the supplied journeys.
3. Keep the +10 minute whole-day tolerance.
4. Analyze the day.
5. Show AWS analysis details: routes checked, day plans considered and route environmental samples.
6. Result should preserve every appointment, add exactly +7 minutes total travel, reduce modeled pollution exposure by roughly 30–40%, and reduce high-UV outdoor time by roughly 25–35%.
7. Open What Changed. The DTU → Connaught Place change is small; the evening Connaught Place → Gym journey is the dominant avoidable-exposure reduction.
8. Show the Amazon Location route comparison: current route, recommended route and pollution sample hotspots.
9. Open Why. Bedrock may rewrite only the verified structured values.
10. Use the optimized plan.

The CI suite asserts these demo invariants so a product change cannot silently break the stage story.

With DemoMode=true, route and environmental values are controlled and visibly labeled. In deployed mode, API Gateway, Lambda, Step Functions, Amazon Location, DynamoDB and CloudWatch remain the product path.
