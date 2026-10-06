# Demo runbook

1. Load the controlled Delhi demo.
2. Review four fixed appointments and the supplied journeys.
3. Keep the +10 minute whole-day tolerance.
4. Analyze the day.
5. Show the result dashboard: appointments unchanged, route-weighted environmental snapshot, and AWS optimization proof.
6. The CI-locked story is one useful change: Connaught Place → Gym changes from Metro + walk to Bus, adds exactly +7 minutes, and cuts whole-day modeled pollution exposure by roughly 30–40%.
7. Open What Changed and show the Amazon Location route comparison. The route samples—not a fake origin hotspot—drive the pollution overlay.
8. Open Why. Bedrock may rewrite only persisted deterministic facts; it may not invent or alter numbers.
9. Use the optimized plan. The accepted screen shows the same analyzed route geometry and lets the user copy the exact recommendation.

The CI suite asserts these demo invariants so a product or UI change cannot silently break the stage story.

With demo mode active, route and environmental values are controlled and visibly labeled **DEMO DATA**. In deployed mode, API Gateway, Lambda, Step Functions, Amazon Location, DynamoDB, CloudWatch, Open-Meteo and optional Bedrock remain the product path.
