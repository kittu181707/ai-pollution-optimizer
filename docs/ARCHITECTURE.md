# Architecture

The browser only collects agenda/travel preferences and renders backend results. Route generation, environmental scoring and whole-day ranking stay on AWS.

## Analysis workflow
1. API Gateway calls the analysis Lambda.
2. A synchronous Express Step Functions workflow runs Prepare, Optimize and Persist.
3. Optimize uses Amazon Location Routes V2, backend environmental inputs and the deterministic exposure model.
4. Persist stores the analyzed plan in DynamoDB.
5. Bedrock is optional and only explains structured optimizer facts.

## Hard constraints
- Fixed event times do not move.
- Candidates must arrive by the next fixed event.
- Total extra travel stays within the user's tolerance.
- Impossible candidates are excluded.

Modeled exposure combines PM2.5 × minutes × mode factor with outdoor heat/UV/weather penalties. The original day is normalized to an index of 100; this is a relative decision-support model, not a medical dose.
