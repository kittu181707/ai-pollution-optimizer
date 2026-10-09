import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (relative) => readFileSync(join(root, relative), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error('UI contract failed: ' + message);
};

const app = read('src/App.tsx');
const map = read('src/components/Map.tsx');
const today = read('src/screens/TodayScreen.tsx');
const liveSnapshot = read('src/components/LiveEnvironmentSnapshot.tsx');
const travel = read('src/screens/TravelScreen.tsx');
const accepted = read('src/screens/AcceptedScreen.tsx');
const india = read('src/screens/IndiaScreen.tsx');
const api = read('src/api.ts');
const pkg = read('package.json');
const utils = read('src/utils.ts');
const backendAuth = read('../backend/src/auth.ts');

assert(map.includes('maps.geo.') && map.includes('/v2/styles/'), 'primary map must use Amazon Location Maps V2');
assert(map.includes("traffic: 'All'"), 'Amazon map must render live traffic');
assert(map.includes('NavigationControl') && map.includes('fitBounds'), 'live map must remain interactive');
assert(map.includes('api.runtimeConfig'), 'map key must be auto-discovered at runtime');
assert(map.includes('MapFallback'), 'map must preserve a no-blank fallback');
assert(!map.includes('cartocdn') && !map.includes('react-leaflet') && !map.includes('TileLayer'), 'third-party map tiles must not return');
assert(pkg.includes('maplibre-gl') && !pkg.includes('"leaflet"') && !pkg.includes('"react-leaflet"'), 'AWS-recommended renderer dependency contract changed');
assert(india.includes('maps.geo.') && india.includes("traffic: 'All'"), 'India map must also use Amazon Location Maps V2');
assert(!india.includes('react-leaflet') && !india.includes('cartocdn'), 'India view must not reintroduce third-party map tiles');

assert(today.includes('LiveEnvironmentSnapshot'), 'today screen must use real environmental data instead of hardcoded values');
assert(!today.includes('<strong>86</strong>') && !today.includes('Source: CPCB • Updated 4 min ago'), 'fake environmental snapshot must not return');
assert(liveSnapshot.includes('api.currentEnvironment'), 'live snapshot must call backend environmental feed');
assert(liveSnapshot.includes('5 * 60_000'), 'live snapshot must refresh every five minutes');
assert(liveSnapshot.includes('navigator.geolocation'), 'live snapshot must support browser location when home is unknown');
assert(api.includes('/api/runtime-config') && api.includes('/api/environment/current'), 'live frontend APIs missing');

assert(app.includes("else if (step === 'travel') content = <TravelScreen"), 'travel confirmation screen must be reachable');
assert(app.includes('isDemo={isDemo}'), 'demo/live provenance must flow into screens and map');
assert(travel.includes("mode.value === 'bike' && !isDemo"), 'unverified bicycle routing must stay disabled in live mode');
assert(!accepted.includes('google.com/maps'), 'accepted plan must not substitute an unanalyzed Google route');

assert(utils.includes("raw === null"), 'missing extra-travel preference must use default');
assert(utils.includes("crypto.subtle.digest"), 'private user ID must derive from bearer secret');
assert(api.includes("Authorization:"), 'private API requests must include bearer secret');
assert(backendAuth.includes("timingSafeEqual"), 'server must compare user identity safely');
assert(liveSnapshot.includes("setEnvironment(null)"), 'stale live conditions must be discarded');
console.log('live AWS product and private-session contract passed');
