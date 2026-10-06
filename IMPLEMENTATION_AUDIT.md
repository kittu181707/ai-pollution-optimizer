# Implementation audit

## Branch decision

The final code is based on the previously verified whole-day optimizer branch rather than selecting a branch by recency.

- `build/product-completion` contains staged payload fragments only; it is not a runnable superior implementation.
- The later `master` UI-overhaul commit added Leaflet/community-impact work but failed CI and reintroduced community-impact and fixed branding that conflict with the product brief.
- The green whole-day implementation retains the hardened optimizer, AWS decision path, compact Day → Travel → Result UI, route comparison, history/settings, and end-to-end controlled-demo coverage.

## Sanity fixes in this pass

- Root development command now calls the backend's real `dev` script.
- Root lockfile is synchronized to a Node-20-compatible `concurrently` release.
- CI now validates the root workspace as well as backend and frontend.
- Travel-mode/departure edits are preserved when the agenda structure did not change.
- Controlled demo mode is visibly labeled in the UI.
- Local acceptance now enforces the same plan/user ownership invariant as production.
- Community-impact tracking, the extra Impact navigation tab, third-party Leaflet map dependencies, and fixed product branding are excluded.
- Backend end-to-end demo stress coverage and bounded optimizer tests remain enabled.

## Validation gate

A change is mergeable only after root dependency audit, backend dependency audit/typecheck/tests, frontend dependency audit/typecheck, and production frontend build are green in GitHub Actions.
