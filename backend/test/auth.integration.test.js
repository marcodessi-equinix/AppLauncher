const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'applauncher-auth-test-'));
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.ADMIN_PASSWORD = 'super-secure-admin-password';
process.env.DATABASE_PATH = path.join(tempRoot, 'applauncher.db');
process.env.UPLOAD_PATH = path.join(tempRoot, 'uploads', 'icons');

const { runMigrations } = require('../dist/db/index.js');
const { createApp } = require('../dist/app.js');

let server;
let baseUrl;

const parseCookie = (response) => {
  const rawCookie = response.headers.get('set-cookie');
  assert.ok(rawCookie, 'expected auth cookie to be set');
  return rawCookie.split(';')[0];
};

const loginAsAdmin = async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: baseUrl,
    },
    body: JSON.stringify({ password: process.env.ADMIN_PASSWORD, overrideLock: true }),
  });

  assert.equal(response.status, 200);
  return {
    cookie: parseCookie(response),
    response,
  };
};

test.before(async () => {
  await runMigrations();
  const app = createApp();
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

});

test('login sets a hardened auth cookie', async () => {
  const { response } = await loginAsAdmin();
  const cookieHeader = response.headers.get('set-cookie');

  assert.match(cookieHeader, /HttpOnly/i);
  assert.match(cookieHeader, /SameSite=Lax/i);
});

test('admin writes are blocked without a trusted origin', async () => {
  const { cookie } = await loginAsAdmin();

  const response = await fetch(`${baseUrl}/api/groups`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie,
    },
    body: JSON.stringify({ title: 'Blocked Group', order: 0 }),
  });

  assert.equal(response.status, 403);
  const payload = await response.json();
  assert.equal(payload.error, 'Cross-site request blocked');
});

test('trusted-origin admin writes succeed', async () => {
  const { cookie } = await loginAsAdmin();

  const response = await fetch(`${baseUrl}/api/groups`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie,
      origin: baseUrl,
    },
    body: JSON.stringify({ title: 'Operations', order: 0, icon: 'lucide:briefcase' }),
  });

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.title, 'Operations');
  assert.equal(payload.icon, 'lucide:briefcase');
});

test('remote icon URLs are rejected for links', async () => {
  const { cookie } = await loginAsAdmin();

  const groupResponse = await fetch(`${baseUrl}/api/groups`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie,
      origin: baseUrl,
    },
    body: JSON.stringify({ title: 'Security', order: 1 }),
  });
  assert.equal(groupResponse.status, 200);
  const group = await groupResponse.json();

  const linkResponse = await fetch(`${baseUrl}/api/links`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie,
      origin: baseUrl,
    },
    body: JSON.stringify({
      group_id: group.id,
      title: 'Blocked Remote Icon',
      url: 'https://example.com',
      icon: 'https://evil.example/icon.svg',
      order: 0,
    }),
  });

  assert.equal(linkResponse.status, 400);
  const payload = await linkResponse.json();
  assert.ok(payload.error);
});

test('link requests can be submitted by clients and completed by admins', async () => {
  const registerResponse = await fetch(`${baseUrl}/api/clients/register`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: baseUrl,
    },
    body: JSON.stringify({ fingerprint: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }),
  });

  assert.equal(registerResponse.status, 200);
  const registeredClient = await registerResponse.json();
  assert.ok(registeredClient.id);

  const submitResponse = await fetch(`${baseUrl}/api/link-requests`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: baseUrl,
    },
    body: JSON.stringify({
      clientId: registeredClient.id,
      message: 'Bitte noch https://intranet.example.local aufnehmen',
      requesterLabel: 'IT Service Desk',
    }),
  });

  assert.equal(submitResponse.status, 201);
  const submitted = await submitResponse.json();
  assert.equal(submitted.request.status, 'open');
  assert.equal(submitted.request.requesterLabel, 'IT Service Desk');
  assert.match(submitted.request.createdAt, /T\d{2}:\d{2}:\d{2}Z$/);

  const { cookie } = await loginAsAdmin();
  const listResponse = await fetch(`${baseUrl}/api/link-requests/admin`, {
    headers: {
      cookie,
      origin: baseUrl,
    },
  });

  assert.equal(listResponse.status, 200);
  const listed = await listResponse.json();
  assert.ok(Array.isArray(listed.requests));
  assert.equal(listed.requests.length, 1);
  assert.equal(listed.requests[0].message, 'Bitte noch https://intranet.example.local aufnehmen');

  const patchResponse = await fetch(`${baseUrl}/api/link-requests/admin/${submitted.request.id}`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      cookie,
      origin: baseUrl,
    },
    body: JSON.stringify({
      status: 'implemented',
    }),
  });

  assert.equal(patchResponse.status, 200);
  const updated = await patchResponse.json();
  assert.equal(updated.request.status, 'implemented');
  assert.match(updated.request.updatedAt, /T\d{2}:\d{2}:\d{2}Z$/);
});
