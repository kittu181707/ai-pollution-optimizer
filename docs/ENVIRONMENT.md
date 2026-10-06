# Configuration

Frontend: `VITE_API_BASE_URL` and optional `VITE_PRODUCT_NAME` (defaults to `AI Personal Pollution Optimizer`).

Backend: `DEMO_MODE`, `TABLE_NAME`, `WORKFLOW_ARN`, optional `BEDROCK_MODEL_ID`, `GEOCODER_USER_AGENT`, and AWS region.

Live car, pedestrian and transit candidates use Amazon Location Routes V2. Bike uses a deterministic Lambda-side heuristic. Live route failures return a clear error rather than silently switching to a different routing engine.
