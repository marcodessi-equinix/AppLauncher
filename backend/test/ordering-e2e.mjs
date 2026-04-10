/**
 * E2E ordering verification script.
 * Runs against a live backend at localhost:3000 with a fresh DB.
 * Verifies every group ordering flow with real HTTP + SQLite persistence.
 */

const BASE = 'http://localhost:3000/api';
let TOKEN = '';
let pass = 0;
let fail = 0;

// ── HTTP helpers ──────────────────────────────────────────────────────

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(TOKEN ? { Cookie: `token=${TOKEN}` } : {}) },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

async function put(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(TOKEN ? { Cookie: `token=${TOKEN}` } : {}) },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

async function del(path) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'DELETE',
    headers: { ...(TOKEN ? { Cookie: `token=${TOKEN}` } : {}) },
  });
  return { status: res.status, data: await res.json() };
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { ...(TOKEN ? { Cookie: `token=${TOKEN}` } : {}) },
  });
  return { status: res.status, data: await res.json() };
}

// ── Assertion helpers ─────────────────────────────────────────────────

function assert(condition, label) {
  if (condition) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.error(`  ✗ ${label}`);
  }
}

function assertOrder(groups, expectedIds, label) {
  const actualIds = groups.map(g => g.id);
  const actualOrders = groups.map(g => g.order);
  const expectedOrders = expectedIds.map((_, i) => i);
  
  assert(
    JSON.stringify(actualIds) === JSON.stringify(expectedIds),
    `${label} — id sequence: [${actualIds}] === [${expectedIds}]`
  );
  assert(
    JSON.stringify(actualOrders) === JSON.stringify(expectedOrders),
    `${label} — orders contiguous 0..${expectedOrders.length - 1}: [${actualOrders}]`
  );
}

async function fetchGroups() {
  const { data } = await get('/groups');
  return data;
}

async function fetchDashboard() {
  const { data } = await get('/dashboard/data');
  return data;
}

// ── Login ─────────────────────────────────────────────────────────────

async function login() {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'testpassword123' }),
  });
  const setCookie = res.headers.get('set-cookie') || '';
  const match = setCookie.match(/token=([^;]+)/);
  TOKEN = match ? match[1] : '';
  assert(TOKEN.length > 0, 'Login successful, got token');
}

// ══════════════════════════════════════════════════════════════════════
// TEST FLOWS
// ══════════════════════════════════════════════════════════════════════

async function testCreateGroups() {
  console.log('\n── 1. CREATE GROUPS ──');

  // Create 5 groups with default order (should go to end: 0,1,2,3,4)
  const ids = [];
  for (let i = 0; i < 5; i++) {
    const { data } = await post('/groups', { title: `Group ${i + 1}` });
    ids.push(data.id);
  }
  
  const groups = await fetchGroups();
  assertOrder(groups, ids, 'After creating 5 groups sequentially');
}

async function testCreateAtPosition() {
  console.log('\n── 2. CREATE GROUP AT SPECIFIC POSITION ──');

  // Create at position 0 (should go to front)
  const { data: front } = await post('/groups', { title: 'Front Group', order: 0 });
  let groups = await fetchGroups();
  assert(groups[0].id === front.id, `Create at position 0 → group is first (id=${front.id})`);
  assert(groups[0].order === 0, 'First group has order=0');

  // Create at position 3 (middle)
  const { data: mid } = await post('/groups', { title: 'Mid Group', order: 3 });
  groups = await fetchGroups();
  assert(groups[3].id === mid.id, `Create at position 3 → group is 4th (id=${mid.id})`);

  // Create at position 999 (beyond end, should clamp to last)
  const { data: last } = await post('/groups', { title: 'Last Group', order: 999 });
  groups = await fetchGroups();
  assert(groups[groups.length - 1].id === last.id, `Create at position 999 → clamped to last`);

  // Verify all orders are contiguous
  const orders = groups.map(g => g.order);
  const expected = groups.map((_, i) => i);
  assert(JSON.stringify(orders) === JSON.stringify(expected), `All orders contiguous: [${orders}]`);
}

async function testEditNameOnly() {
  console.log('\n── 3. EDIT GROUP NAME ONLY ──');
  
  let groups = await fetchGroups();
  const target = groups[2]; // pick 3rd group
  const originalOrder = target.order;
  const idsBefore = groups.map(g => g.id);
  
  await put(`/groups/${target.id}`, { title: 'Renamed Group', order: originalOrder, icon: target.icon || '' });
  
  groups = await fetchGroups();
  const idsAfter = groups.map(g => g.id);
  assert(JSON.stringify(idsBefore) === JSON.stringify(idsAfter), 'Edit name only → order unchanged');
  assert(groups[2].title === 'Renamed Group', 'Title updated correctly');
}

async function testEditPosition() {
  console.log('\n── 4. EDIT MANUAL POSITION ──');
  
  let groups = await fetchGroups();
  const target = groups[0]; // first group
  const totalGroups = groups.length;
  
  // Move first → last
  await put(`/groups/${target.id}`, { title: target.title, order: totalGroups - 1, icon: target.icon || '' });
  groups = await fetchGroups();
  assert(groups[groups.length - 1].id === target.id, 'Move first → last');
  
  // Move last → first
  await put(`/groups/${target.id}`, { title: target.title, order: 0, icon: target.icon || '' });
  groups = await fetchGroups();
  assert(groups[0].id === target.id, 'Move last → first');
  
  // Move first → middle
  const midPos = Math.floor(groups.length / 2);
  await put(`/groups/${target.id}`, { title: target.title, order: midPos, icon: target.icon || '' });
  groups = await fetchGroups();
  assert(groups[midPos].id === target.id, `Move to middle (position ${midPos})`);
  
  // Verify orders after all moves
  const orders = groups.map(g => g.order);
  const expected = groups.map((_, i) => i);
  assert(JSON.stringify(orders) === JSON.stringify(expected), `Orders still contiguous: [${orders}]`);
}

async function testReorderGroups() {
  console.log('\n── 5. DRAG REORDER (via /reorder/groups) ──');
  
  let groups = await fetchGroups();
  const idsBefore = groups.map(g => g.id);
  
  // Simulate drag: move first to last
  const reordered = [...idsBefore];
  const [moved] = reordered.splice(0, 1);
  reordered.push(moved);
  
  await put('/reorder/groups', reordered.map((id, i) => ({ id, order: i })));
  groups = await fetchGroups();
  assertOrder(groups, reordered, 'Drag first → last');
  
  // Simulate drag: move last to first
  const reordered2 = groups.map(g => g.id);
  const [moved2] = reordered2.splice(reordered2.length - 1, 1);
  reordered2.unshift(moved2);
  
  await put('/reorder/groups', reordered2.map((id, i) => ({ id, order: i })));
  groups = await fetchGroups();
  assertOrder(groups, reordered2, 'Drag last → first');

  // Simulate drag: swap middle positions
  const reordered3 = groups.map(g => g.id);
  const tmp = reordered3[2];
  reordered3[2] = reordered3[3];
  reordered3[3] = tmp;
  
  await put('/reorder/groups', reordered3.map((id, i) => ({ id, order: i })));
  groups = await fetchGroups();
  assertOrder(groups, reordered3, 'Swap middle positions');
}

async function testRapidReorders() {
  console.log('\n── 6. RAPID CONSECUTIVE REORDERS ──');
  
  let groups = await fetchGroups();
  const startIds = groups.map(g => g.id);
  
  // Fire 10 rapid reorders without waiting between them
  const promises = [];
  let current = [...startIds];
  for (let i = 0; i < 10; i++) {
    // Rotate left by 1
    const [first, ...rest] = current;
    current = [...rest, first];
    promises.push(put('/reorder/groups', current.map((id, idx) => ({ id, order: idx }))));
  }
  await Promise.all(promises);

  // The final state should be deterministic (last-write-wins in SQLite transactions)
  groups = await fetchGroups();
  const orders = groups.map(g => g.order);
  const expected = groups.map((_, i) => i);
  assert(JSON.stringify(orders) === JSON.stringify(expected), `After 10 rapid reorders, orders are still contiguous: [${orders}]`);
  assert(new Set(orders).size === orders.length, 'No duplicate orders after rapid reorders');
}

async function testDeleteFirstMiddleLast() {
  console.log('\n── 7. DELETE FIRST / MIDDLE / LAST ──');
  
  let groups = await fetchGroups();
  const originalCount = groups.length;
  
  // Delete first
  const firstId = groups[0].id;
  await del(`/groups/${firstId}`);
  groups = await fetchGroups();
  assert(groups.length === originalCount - 1, `Delete first: ${originalCount} → ${groups.length}`);
  assert(!groups.some(g => g.id === firstId), 'First group removed');
  let orders = groups.map(g => g.order);
  assert(JSON.stringify(orders) === JSON.stringify(groups.map((_, i) => i)), 'Orders normalized after deleting first');
  
  // Delete middle
  const midIdx = Math.floor(groups.length / 2);
  const midId = groups[midIdx].id;
  await del(`/groups/${midId}`);
  groups = await fetchGroups();
  assert(!groups.some(g => g.id === midId), 'Middle group removed');
  orders = groups.map(g => g.order);
  assert(JSON.stringify(orders) === JSON.stringify(groups.map((_, i) => i)), 'Orders normalized after deleting middle');
  
  // Delete last
  const lastId = groups[groups.length - 1].id;
  await del(`/groups/${lastId}`);
  groups = await fetchGroups();
  assert(!groups.some(g => g.id === lastId), 'Last group removed');
  orders = groups.map(g => g.order);
  assert(JSON.stringify(orders) === JSON.stringify(groups.map((_, i) => i)), 'Orders normalized after deleting last');
}

async function testDashboardEndpointConsistency() {
  console.log('\n── 8. DASHBOARD /data MATCHES /groups ORDER ──');
  
  const groups = await fetchGroups();
  const dashboard = await fetchDashboard();
  
  const groupIds = groups.map(g => g.id);
  const dashIds = dashboard.map(g => g.id);
  assert(JSON.stringify(groupIds) === JSON.stringify(dashIds), '/dashboard/data returns same order as /groups');
  
  const dashOrders = dashboard.map(g => g.order);
  const expected = dashboard.map((_, i) => i);
  assert(JSON.stringify(dashOrders) === JSON.stringify(expected), '/dashboard/data orders are contiguous');
}

async function testReorderWithGaps() {
  console.log('\n── 9. REORDER WITH NON-CONTIGUOUS INPUT ──');
  
  let groups = await fetchGroups();
  // Send gap-filled orders (e.g., 0, 5, 10, 15...) — backend should normalize
  const gapPayload = groups.map((g, i) => ({ id: g.id, order: i * 5 }));
  await put('/reorder/groups', gapPayload);
  
  groups = await fetchGroups();
  const orders = groups.map(g => g.order);
  const expected = groups.map((_, i) => i);
  assert(JSON.stringify(orders) === JSON.stringify(expected), `Gap-filled input normalized to [${orders}]`);
}

async function testEdgeEmptyThenCreate() {
  console.log('\n── 10. DELETE ALL THEN RE-CREATE ──');
  
  // Delete all remaining groups
  let groups = await fetchGroups();
  for (const g of groups) {
    await del(`/groups/${g.id}`);
  }
  groups = await fetchGroups();
  assert(groups.length === 0, 'All groups deleted');
  
  // Re-create 3 groups
  const { data: g1 } = await post('/groups', { title: 'Fresh A' });
  const { data: g2 } = await post('/groups', { title: 'Fresh B' });
  const { data: g3 } = await post('/groups', { title: 'Fresh C' });
  
  groups = await fetchGroups();
  assertOrder(groups, [g1.id, g2.id, g3.id], 'Re-created groups from empty');
}

async function testCreateAtPositionFromEmpty() {
  console.log('\n── 11. CREATE AT POSITION 0 FROM SCRATCH ──');
  
  // Delete all
  let groups = await fetchGroups();
  for (const g of groups) await del(`/groups/${g.id}`);
  
  // Create first group at position 0
  const { data: g1 } = await post('/groups', { title: 'Only Group', order: 0 });
  groups = await fetchGroups();
  assert(groups.length === 1, 'Single group created');
  assert(groups[0].id === g1.id && groups[0].order === 0, 'Single group has order=0');
}

async function testManyGroups() {
  console.log('\n── 12. MANY GROUPS (20) ──');
  
  // Delete all
  let groups = await fetchGroups();
  for (const g of groups) await del(`/groups/${g.id}`);
  
  // Create 20 groups
  const createdIds = [];
  for (let i = 0; i < 20; i++) {
    const { data } = await post('/groups', { title: `Batch ${i + 1}` });
    createdIds.push(data.id);
  }
  
  groups = await fetchGroups();
  assertOrder(groups, createdIds, '20 groups created in order');
  
  // Reverse the entire order
  const reversed = [...createdIds].reverse();
  await put('/reorder/groups', reversed.map((id, i) => ({ id, order: i })));
  groups = await fetchGroups();
  assertOrder(groups, reversed, '20 groups reversed');
  
  // Verify orders after heavy operation
  const orders = groups.map(g => g.order);
  assert(new Set(orders).size === 20, 'No duplicate orders in 20 groups');
  assert(Math.max(...orders) === 19, 'Max order = 19');
  assert(Math.min(...orders) === 0, 'Min order = 0');
}

// ══════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  E2E GROUP ORDERING VERIFICATION                ║');
  console.log('║  Against live backend at localhost:3000          ║');
  console.log('╚══════════════════════════════════════════════════╝');
  
  try {
    await login();
    await testCreateGroups();
    await testCreateAtPosition();
    await testEditNameOnly();
    await testEditPosition();
    await testReorderGroups();
    await testRapidReorders();
    await testDeleteFirstMiddleLast();
    await testDashboardEndpointConsistency();
    await testReorderWithGaps();
    await testEdgeEmptyThenCreate();
    await testCreateAtPositionFromEmpty();
    await testManyGroups();
  } catch (err) {
    console.error('\nFATAL ERROR:', err.message);
    fail++;
  }
  
  console.log('\n══════════════════════════════════════════════════');
  console.log(`  RESULTS: ${pass} passed, ${fail} failed`);
  console.log('══════════════════════════════════════════════════\n');
  
  process.exit(fail > 0 ? 1 : 0);
}

main();
