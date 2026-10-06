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
const shell = read('src/components/AppShell.tsx');
const landing = read('src/screens/LandingScreen.tsx');
const nav = read('src/components/BottomNav.tsx');
const overview = read('src/screens/OverviewScreen.tsx');
const routePreview = read('src/components/RoutePreview.tsx');
const accepted = read('src/screens/AcceptedScreen.tsx');
const snapshot = read('src/components/EnvironmentalSnapshot.tsx');
const travel = read('src/screens/TravelScreen.tsx');
const utils = read('src/utils.ts');
const styles = read('src/styles.css');
const packageJson = read('package.json');
const sourceText = walk(join(root, 'src'))
  .filter((path) => /.(ts|tsx|css)$/.test(path))
  .map((path) => readFileSync(path, 'utf8'))
  .join('\n');

for (const required of ['ImportScreen', 'TravelScreen', 'loadDemo', 'AppShell']) {
  assert(app.includes(required), 'App must preserve whole-day flow and production shell: ' + required);
}
for (const required of ['Import calendar', 'Enter my day', '30-second demo']) {
  assert(landing.includes(required), 'Landing must preserve MVP entry path: ' + required);
}

const navItems = ['Today', 'Plan', 'History', 'Settings'];
for (const item of navItems) assert(nav.includes("'" + item + "'"), 'Primary nav missing ' + item);
assert(shell.includes('BottomNav'), 'app shell must own responsive primary navigation');
assert(!nav.includes("'impact'"), 'Impact/community navigation must not return');
assert(!sourceText.includes('ImpactScreen'), 'Impact/community screen must not return');
assert(!sourceText.includes('react-leaflet'), 'Leaflet must not coexist with Amazon Location route proof');
assert(!sourceText.includes('cartocdn'), 'CARTO tiles must not return');
assert(!packageJson.includes('leaflet'), 'Leaflet dependencies must not return');
assert(!existsSync(join(root, 'src/components/Map.tsx')), 'legacy contributor Leaflet Map.tsx must remain removed');

for (const required of ['decision-summary', "Today's journeys", 'Best change', 'RoutePreview', 'Review plan']) {
  assert(overview.includes(required), 'simple judge dashboard missing ' + required);
}
assert(snapshot.includes('DEMO DATA') && snapshot.includes('LIVE DATA'), 'environment provenance must remain explicit');
assert(styles.includes('.app-shell') && styles.includes('.dashboard-grid'), 'responsive app shell/dashboard styling missing');
assert(styles.includes('grid-template-columns: 218px'), 'desktop navigation shell missing');
assert(routePreview.includes('api.routeMap'), 'route comparison must use hardened Amazon Location map endpoint');
assert(routePreview.includes('environmentSamples'), 'route hotspots must use route samples, not a fake origin circle');
assert(app.includes("['07:45', '12:15', '17:45', '19:20']"), 'controlled demo schedule changed unexpectedly');
assert(accepted.includes('RoutePreview'), 'accepted plan must show analyzed route geometry');
assert(!accepted.includes('google.com/maps/dir'), 'generic directions must not masquerade as analyzed route');
assert(utils.includes('samePlace') && utils.includes('continue'), 'same-location appointments must not generate invalid journeys');
assert(app.includes('isDemo={isDemo}'), 'travel mode availability must know demo state');
assert(travel.includes("mode.value === 'bike' && !isDemo"), 'unverified live bicycle routing must remain disabled');

console.log('frontend UI/product contract passed');
