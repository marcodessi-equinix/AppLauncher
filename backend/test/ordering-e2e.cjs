/**
 * E2E ordering verification script.
 * Runs against a live backend at localhost:3000 with a fresh DB.
 * Uses http module for proper cookie handling.
 */

const http = require('http');

const BASE = 'http://localhost:3099';
let COOKIE = '';
let pass = 0;
let fail = 0;

// -- HTTP helpers using raw http module for cookie control --

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const postData = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:5001',
    };
    if (COOKIE) headers['Cookie'] = COOKIE;
    if (body) headers['Content-Length'] = Buffer.byteLength(postData);

    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers,
    }, (res) => {
      // Capture set-cookie
      const sc = res.headers['set-cookie'];
      if (sc) {
        for (const c of sc) {
          const match = c.match(/auth_token=([^;]+)/);
          if (match) COOKIE = `auth_token=${match[1]}`;
        }
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data || '{}') });
        } catch {
          resolve({ status: res.statusCode, data: {} });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

const post = (p, b) => request('POST', `/api${p}`, b);
const put = (p, b) => request('PUT', `/api${p}`, b);
const del = (p) => request('DELETE', `/api${p}`);
const get = (p) => request('GET', `/api${p}`);

function ok(condition, label) {
  if (condition) {
    pass++;
    console.log(`  OK: ${label}`);
  } else {
    fail++;
    console.log(`  FAIL: ${label}`);
  }
}

async function fetchGroups() {
  const { data } = await get('/groups');
  return Array.isArray(data) ? data : [];
}

async function fetchDashboard() {
  const { data } = await get('/dashboard/data');
  return Array.isArray(data) ? data : [];
}

function isContiguous(groups) {
  return groups.every((g, i) => g.order === i);
}

// == LOGIN ==
async function login() {
  const { status } = await post('/auth/login', { password: 'testpassword123' });
  ok(status === 200 && COOKIE.length > 0, `Login (status=${status}, cookie=${COOKIE.length > 0})`);
}

// == TESTS ==

async function test1_CreateGroups() {
  console.log('\n-- 1. CREATE GROUPS (default order = end) --');
  const ids = [];
  for (let i = 1; i <= 5; i++) {
    const { data, status } = await post('/groups', { title: `Group ${i}` });
    ok(status === 200, `Create Group ${i} (status=${status}, id=${data.id})`);
    ids.push(data.id);
  }
  const groups = await fetchGroups();
  ok(groups.length === 5, `5 groups exist (got ${groups.length})`);
  ok(isContiguous(groups), `Orders contiguous: [${groups.map(g=>g.order)}]`);
  ok(JSON.stringify(groups.map(g=>g.id)) === JSON.stringify(ids), `IDs in creation order: [${groups.map(g=>g.id)}] === [${ids}]`);
}

async function test2_CreateAtPosition() {
  console.log('\n-- 2. CREATE GROUP AT SPECIFIC POSITION --');

  // Create at position 0 (front)
  const { data: front } = await post('/groups', { title: 'Front', order: 0 });
  let groups = await fetchGroups();
  ok(groups[0].id === front.id, `Create at pos 0: first id=${groups[0].id} === ${front.id}`);
  ok(isContiguous(groups), `Contiguous after front insert: [${groups.map(g=>g.order)}]`);

  // Create at position 3 (middle)
  const { data: mid } = await post('/groups', { title: 'Mid', order: 3 });
  groups = await fetchGroups();
  ok(groups[3].id === mid.id, `Create at pos 3: groups[3].id=${groups[3].id} === ${mid.id}`);
  ok(isContiguous(groups), `Contiguous after mid insert: [${groups.map(g=>g.order)}]`);

  // Create at position 999 (clamped to last)
  const { data: last } = await post('/groups', { title: 'Last', order: 999 });
  groups = await fetchGroups();
  ok(groups[groups.length - 1].id === last.id, `Create at pos 999 -> clamped to last`);
  ok(isContiguous(groups), `Contiguous after clamped insert: [${groups.map(g=>g.order)}]`);
}

async function test3_EditNameOnly() {
  console.log('\n-- 3. EDIT GROUP NAME (order unchanged) --');
  let groups = await fetchGroups();
  const target = groups[2];
  const idsBefore = groups.map(g => g.id);

  await put(`/groups/${target.id}`, { title: 'Renamed', order: target.order });
  groups = await fetchGroups();
  ok(JSON.stringify(groups.map(g=>g.id)) === JSON.stringify(idsBefore), 'ID order unchanged after rename');
  ok(groups[2].title === 'Renamed', 'Title updated');
}

async function test4_EditPosition() {
  console.log('\n-- 4. EDIT MANUAL POSITION --');
  let groups = await fetchGroups();
  const target = groups[0];
  const n = groups.length;

  // Move first -> last
  await put(`/groups/${target.id}`, { title: target.title, order: n - 1 });
  groups = await fetchGroups();
  ok(groups[n - 1].id === target.id, `Move first->last: last id=${groups[n-1].id} === ${target.id}`);
  ok(isContiguous(groups), `Contiguous: [${groups.map(g=>g.order)}]`);

  // Move last -> first
  await put(`/groups/${target.id}`, { title: target.title, order: 0 });
  groups = await fetchGroups();
  ok(groups[0].id === target.id, `Move last->first: first id=${groups[0].id} === ${target.id}`);
  ok(isContiguous(groups), `Contiguous: [${groups.map(g=>g.order)}]`);

  // Move first -> middle
  const mid = Math.floor(n / 2);
  await put(`/groups/${target.id}`, { title: target.title, order: mid });
  groups = await fetchGroups();
  ok(groups[mid].id === target.id, `Move to mid(${mid}): groups[${mid}].id=${groups[mid].id} === ${target.id}`);
  ok(isContiguous(groups), `Contiguous: [${groups.map(g=>g.order)}]`);
}

async function test5_DragReorder() {
  console.log('\n-- 5. DRAG REORDER (via /reorder/groups) --');
  let groups = await fetchGroups();
  const ids = groups.map(g => g.id);

  // Drag first -> last
  const r1 = [...ids];
  r1.push(r1.shift());
  await put('/reorder/groups', r1.map((id, i) => ({ id, order: i })));
  groups = await fetchGroups();
  ok(JSON.stringify(groups.map(g=>g.id)) === JSON.stringify(r1), `Drag first->last: [${groups.map(g=>g.id)}]`);
  ok(isContiguous(groups), `Contiguous: [${groups.map(g=>g.order)}]`);

  // Drag last -> first
  const r2 = groups.map(g => g.id);
  r2.unshift(r2.pop());
  await put('/reorder/groups', r2.map((id, i) => ({ id, order: i })));
  groups = await fetchGroups();
  ok(JSON.stringify(groups.map(g=>g.id)) === JSON.stringify(r2), `Drag last->first: [${groups.map(g=>g.id)}]`);
  ok(isContiguous(groups), `Contiguous: [${groups.map(g=>g.order)}]`);

  // Swap middle positions
  const r3 = groups.map(g => g.id);
  if (r3.length >= 4) { [r3[2], r3[3]] = [r3[3], r3[2]]; }
  await put('/reorder/groups', r3.map((id, i) => ({ id, order: i })));
  groups = await fetchGroups();
  ok(JSON.stringify(groups.map(g=>g.id)) === JSON.stringify(r3), `Swap middle: [${groups.map(g=>g.id)}]`);
  ok(isContiguous(groups), `Contiguous: [${groups.map(g=>g.order)}]`);
}

async function test6_RapidReorders() {
  console.log('\n-- 6. RAPID CONSECUTIVE REORDERS (10x) --');
  let groups = await fetchGroups();
  let current = groups.map(g => g.id);

  // Fire 10 sequential rapid reorders (rotate left)
  for (let i = 0; i < 10; i++) {
    current.push(current.shift());
    await put('/reorder/groups', current.map((id, idx) => ({ id, order: idx })));
  }

  groups = await fetchGroups();
  ok(isContiguous(groups), `After 10 rapid reorders, contiguous: [${groups.map(g=>g.order)}]`);
  ok(new Set(groups.map(g=>g.order)).size === groups.length, 'No duplicate orders');
}

async function test7_Deletes() {
  console.log('\n-- 7. DELETE FIRST / MIDDLE / LAST --');
  let groups = await fetchGroups();

  // Delete first
  const firstId = groups[0].id;
  await del(`/groups/${firstId}`);
  groups = await fetchGroups();
  ok(!groups.some(g => g.id === firstId), `First group (id=${firstId}) removed`);
  ok(isContiguous(groups), `Contiguous after first delete: [${groups.map(g=>g.order)}]`);

  // Delete middle
  const midIdx = Math.floor(groups.length / 2);
  const midId = groups[midIdx].id;
  await del(`/groups/${midId}`);
  groups = await fetchGroups();
  ok(!groups.some(g => g.id === midId), `Middle group (id=${midId}) removed`);
  ok(isContiguous(groups), `Contiguous after middle delete: [${groups.map(g=>g.order)}]`);

  // Delete last
  const lastId = groups[groups.length - 1].id;
  await del(`/groups/${lastId}`);
  groups = await fetchGroups();
  ok(!groups.some(g => g.id === lastId), `Last group (id=${lastId}) removed`);
  ok(isContiguous(groups), `Contiguous after last delete: [${groups.map(g=>g.order)}]`);
}

async function test8_DashboardConsistency() {
  console.log('\n-- 8. /dashboard/data MATCHES /groups ORDER --');
  const groups = await fetchGroups();
  const dashboard = await fetchDashboard();
  ok(
    JSON.stringify(groups.map(g=>g.id)) === JSON.stringify(dashboard.map(g=>g.id)),
    `/dashboard/data same order as /groups: [${dashboard.map(g=>g.id)}]`
  );
  ok(isContiguous(dashboard), `Dashboard orders contiguous: [${dashboard.map(g=>g.order)}]`);
}

async function test9_GapNormalization() {
  console.log('\n-- 9. REORDER WITH GAP-FILLED INPUT --');
  let groups = await fetchGroups();
  const payload = groups.map((g, i) => ({ id: g.id, order: i * 10 }));
  await put('/reorder/groups', payload);
  groups = await fetchGroups();
  ok(isContiguous(groups), `Gap-filled input normalized: [${groups.map(g=>g.order)}]`);
}

async function test10_DeleteAllReCreate() {
  console.log('\n-- 10. DELETE ALL + RE-CREATE --');
  let groups = await fetchGroups();
  for (const g of groups) await del(`/groups/${g.id}`);
  groups = await fetchGroups();
  ok(groups.length === 0, 'All groups deleted');

  const { data: g1 } = await post('/groups', { title: 'Fresh A' });
  const { data: g2 } = await post('/groups', { title: 'Fresh B' });
  const { data: g3 } = await post('/groups', { title: 'Fresh C' });
  groups = await fetchGroups();
  ok(groups.length === 3, `Re-created 3 groups (got ${groups.length})`);
  ok(JSON.stringify(groups.map(g=>g.id)) === JSON.stringify([g1.id, g2.id, g3.id]), `Correct creation order`);
  ok(isContiguous(groups), `Contiguous: [${groups.map(g=>g.order)}]`);
}

async function test11_CreateFromEmpty() {
  console.log('\n-- 11. CREATE AT POSITION 0 FROM EMPTY --');
  let groups = await fetchGroups();
  for (const g of groups) await del(`/groups/${g.id}`);

  const { data: g1 } = await post('/groups', { title: 'Only', order: 0 });
  groups = await fetchGroups();
  ok(groups.length === 1, 'Single group exists');
  ok(groups[0].id === g1.id && groups[0].order === 0, `order=0, id=${g1.id}`);
}

async function test12_ManyGroups() {
  console.log('\n-- 12. MANY GROUPS (20) --');
  let groups = await fetchGroups();
  for (const g of groups) await del(`/groups/${g.id}`);

  const created = [];
  for (let i = 0; i < 20; i++) {
    const { data } = await post('/groups', { title: `Batch ${i+1}` });
    created.push(data.id);
  }
  groups = await fetchGroups();
  ok(groups.length === 20, `20 groups exist (got ${groups.length})`);
  ok(JSON.stringify(groups.map(g=>g.id)) === JSON.stringify(created), 'Creation order preserved');
  ok(isContiguous(groups), `Contiguous: [${groups.map(g=>g.order)}]`);

  // Reverse all
  const reversed = [...created].reverse();
  await put('/reorder/groups', reversed.map((id, i) => ({ id, order: i })));
  groups = await fetchGroups();
  ok(JSON.stringify(groups.map(g=>g.id)) === JSON.stringify(reversed), '20 groups reversed');
  ok(isContiguous(groups), `Contiguous after reverse: [${groups.map(g=>g.order)}]`);
  ok(new Set(groups.map(g=>g.order)).size === 20, 'No duplicate orders in 20 groups');
  ok(Math.max(...groups.map(g=>g.order)) === 19, 'Max order = 19');
  ok(Math.min(...groups.map(g=>g.order)) === 0, 'Min order = 0');
}

// == MAIN ==

async function main() {
  console.log('========================================');
  console.log('  E2E GROUP ORDERING VERIFICATION');
  console.log('  Backend: localhost:3000');
  console.log('========================================');

  try {
    await login();
    await test1_CreateGroups();
    await test2_CreateAtPosition();
    await test3_EditNameOnly();
    await test4_EditPosition();
    await test5_DragReorder();
    await test6_RapidReorders();
    await test7_Deletes();
    await test8_DashboardConsistency();
    await test9_GapNormalization();
    await test10_DeleteAllReCreate();
    await test11_CreateFromEmpty();
    await test12_ManyGroups();
  } catch (err) {
    console.log('FATAL:', err.message);
    fail++;
  }

  console.log('\n========================================');
  console.log(`  RESULTS: ${pass} passed, ${fail} failed`);
  console.log('========================================');
  process.exit(fail > 0 ? 1 : 0);
}

main();
