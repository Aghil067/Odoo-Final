import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

process.loadEnvFile(resolve('../.runtime/backend.env'));
const target = new URL(process.env.DATABASE_URL);
assert.equal(target.hostname, '127.0.0.1');
assert.equal(target.port, '55432');
assert.equal(target.pathname, '/solar_integration_test');

const { db } = await import('../dist/src/lib/db.js');
const { app } = await import('../dist/src/app.js');

let server, base;
const sessions = {};

async function request(path, { session, method = 'GET', body, csrf = true, origin = 'http://localhost:5173' } = {}) {
  const headers = { Origin: origin };
  if (session) {
    headers.Cookie = session.cookie;
    if (csrf) headers['X-CSRF-Token'] = session.csrfToken;
  }
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const json = await response.json();
  return { status: response.status, json, cookie: response.headers.get('set-cookie') };
}

async function login(email, password) {
  const r = await request('/auth/login', { method: 'POST', body: { email, password } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  return { ...r.json.data, cookie: r.cookie.split(';')[0] };
}

before(async () => {
  const saved = JSON.parse(await readFile(resolve('../.runtime/test-accounts.json'), 'utf8'));
  const password = saved.password;

  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}/api`;

  sessions.ADMIN = await login('admin@helionest.example.test', password);
  sessions.TECHNICIAN = await login('technician@helionest.example.test', password);
  sessions.SALES = await login('sales@helionest.example.test', password);
  sessions.WAREHOUSE = await login('warehouse@helionest.example.test', password);
});

after(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise(r => server.close(r));
  }
  await db.$disconnect();
});

test('GET /installations/map rejects unauthenticated requests with 401', async () => {
  const res = await request('/installations/map');
  assert.equal(res.status, 401);
});

test('GET /installations/map rejects unauthorized roles (e.g. WAREHOUSE) with 403', async () => {
  const res = await request('/installations/map', { session: sessions.WAREHOUSE });
  assert.equal(res.status, 403);
});

test('GET /installations/map returns 200 and valid schema for ADMIN', async () => {
  const res = await request('/installations/map', { session: sessions.ADMIN });
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.json.data.sites), 'data.sites should be an array');
  assert.ok(Array.isArray(res.json.data.unmappedSites), 'data.unmappedSites should be an array');
  assert.ok(res.json.data.metrics, 'data.metrics should exist');
  assert.equal(typeof res.json.data.metrics.totalMappedSites, 'number');
  assert.equal(typeof res.json.data.metrics.totalInstallations, 'number');
});

test('GET /installations/map groups multiple installations at the same site without overlapping', async () => {
  const res = await request('/installations/map', { session: sessions.ADMIN });
  assert.equal(res.status, 200);

  const hitecSite = res.json.data.sites.find(s => s.siteName.includes('Hitec City'));
  assert.ok(hitecSite, 'Hitec City site should exist in mapped sites');
  assert.equal(hitecSite.installationCount, 2, 'Hitec City site should group both installations');
  assert.equal(hitecSite.installations.length, 2);
  const refs = hitecSite.installations.map(i => i.reference);
  assert.ok(refs.includes('INS-2026-HYD-0101'));
  assert.ok(refs.includes('INS-2026-HYD-0102'));
});

test('GET /installations/map filters by statusCategory accurately', async () => {
  const plannedRes = await request('/installations/map?statusCategory=PLANNED', { session: sessions.ADMIN });
  assert.equal(plannedRes.status, 200);
  for (const site of plannedRes.json.data.sites) {
    for (const inst of site.installations) {
      assert.equal(inst.statusCategory, 'PLANNED');
    }
  }

  const inProgRes = await request('/installations/map?statusCategory=IN_PROGRESS', { session: sessions.ADMIN });
  assert.equal(inProgRes.status, 200);
  for (const site of inProgRes.json.data.sites) {
    for (const inst of site.installations) {
      assert.equal(inst.statusCategory, 'IN_PROGRESS');
    }
  }

  const commRes = await request('/installations/map?statusCategory=COMMISSIONED', { session: sessions.ADMIN });
  assert.equal(commRes.status, 200);
  for (const site of commRes.json.data.sites) {
    for (const inst of site.installations) {
      assert.equal(inst.statusCategory, 'COMMISSIONED');
    }
  }
});

test('GET /installations/map filters by geographic bounding box', async () => {
  // Query bounds covering Miyapur (lat: ~17.496, lng: ~78.358)
  const res = await request('/installations/map?minLat=17.48&maxLat=17.51&minLng=78.34&maxLng=78.38', { session: sessions.ADMIN });
  assert.equal(res.status, 200);
  for (const site of res.json.data.sites) {
    assert.ok(site.latitude >= 17.48 && site.latitude <= 17.51);
    assert.ok(site.longitude >= 78.34 && site.longitude <= 78.38);
  }
});

test('GET /installations/map filters by keyword search query', async () => {
  const res = await request('/installations/map?q=Miyapur', { session: sessions.ADMIN });
  assert.equal(res.status, 200);
  assert.ok(res.json.data.sites.length > 0);
  for (const site of res.json.data.sites) {
    const matched = site.siteName.includes('Miyapur') || site.city.includes('Miyapur') || site.addressLine1.includes('Miyapur');
    assert.ok(matched, `Expected site ${site.siteName} to match query Miyapur`);
  }
});

test('GET /installations/map reports unmapped sites with Location Not Set', async () => {
  const res = await request('/installations/map', { session: sessions.ADMIN });
  assert.equal(res.status, 200);
  assert.ok(res.json.data.unmappedSites.length > 0, 'Should have at least 1 unmapped site');
  const banjara = res.json.data.unmappedSites.find(s => s.siteName.includes('Banjara Hills'));
  assert.ok(banjara, 'Banjara Hills site should be listed under unmappedSites');
  assert.equal(banjara.installationCount, 1);
});
