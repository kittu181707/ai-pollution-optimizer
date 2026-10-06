import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (relative) => readFileSync(join(root, relative), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error('UI contract failed: ' + message);
};

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const app = read('src/App.tsx');
const landing = read('src/screens/LandingScreen.tsx');
const nav = read('src/components/BottomNav.tsx');
const routePreview = read('src/components/RoutePreview.tsx');
const styles = read('src/styles.css');
const packageJson = read('package.json');
const sourceText = walk(join(root, 'src')).filter((path) => /\.(ts|tsx|css)$/.test(path)).map((path) => readFileSync(path, 'utf8')).join('\n');

for (const required of ['ImportScreen', 'TravelScreen', 'loadDemo', 'DayRoutePanel']) {
  assert(app.includes(required), 'App must preserve whole-day flow and contributor split-route UI: ' + required);
}
for (const required of ['Import calendar', 'Enter my day', '30-second demo']) {
  assert(landing.includes(required), 'Landing must preserve MVP entry path: ' + required);
}

const navItems = ['Today', 'Plan', 'History', 'Settings'];
for (const item of navItems) assert(nav.includes("'" + item + "'"), 'Bottom nav missing ' + item);
assert(!nav.includes("'impact'"), 'Impact/community navigation must not return');
assert(!sourceText.includes('ImpactScreen'), 'Impact/community screen must not return');
assert(!sourceText.includes('react-leaflet'), 'Leaflet must not coexist with Amazon Location map path');
assert(!sourceText.includes('cartocdn'), 'CARTO tiles must not coexist with Amazon Location map path');
assert(!packageJson.includes('leaflet'), 'Leaflet dependencies must not return');
assert(!existsSync(join(root, 'src/components/Map.tsx')), 'legacy contributor Leaflet Map.tsx must remain removed');

assert(styles.includes('.split-layout'), 'contributor desktop split layout must remain');
assert(styles.includes('.exposure-hero'), 'contributor result hero hierarchy must remain');
assert(styles.includes('background: #ffffff'), 'clean white contributor visual direction must remain');
assert(routePreview.includes('api.routeMap'), 'route comparison must use hardened Amazon Location map endpoint');
assert(routePreview.includes('environmentSamples'), 'route hotspots must use route samples, not a fake origin circle');
assert(app.includes("['07:45', '12:15', '17:45', '19:20']"), 'controlled demo journey schedule changed unexpectedly');

console.log('frontend UI/product contract passed');
