# Architecture

The browser only collects agenda/travel preferences and renders backend results. Route generation, environmental scoring and whole-day ranking stay on AWS.

## Analysis workflow
1. API Gateway calls the analysis Lambda.
2. A synchronous Express Step Functions workflow runs Prepare, Optimize and Persist.
3. Optimize uses Amazon Location Routes V2, backend environmental inputs and the deterministic exposure model.
4. Persist stores the analyzed plan in DynamoDB.
5. Bedrock is optional and only explains structured optimizer facts.

## Data and guest-session boundaries

Private API endpoints derive an anonymous guest user ID from a random 256-bit bearer secret. The client sends the credential in an authorization header; saved plans, history and explanation requests enforce the derived ID. Guest credentials are not verified user accounts and have no recovery mechanism.

Accepted plans use deterministic DynamoDB sort keys and transactional writes so concurrent retries do not increment global impact more than once. Demo plans never add to production impact. Environmental exposure uses forecasts, time/route approximations, and route-mode factors, not measured individual dose.

## Hard constraints
- Fixed event times do not move.
- Candidates must arrive by the next fixed event.
- Total extra travel stays within the user's tolerance.
- Impossible candidates are excluded.

Modeled exposure combines PM2.5 × minutes × mode factor with outdoor heat/UV/weather penalties. The original day is normalized to an index of 100; this is a relative decision-support model, not a medical dose.
