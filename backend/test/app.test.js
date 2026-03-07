const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../dist/app.js');

test('createApp registers the health route', () => {
  const app = createApp();
  const routes = app.router.stack
    .filter((layer) => layer.route)
    .map((layer) => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods || {}),
    }));

  assert.ok(routes.some((route) => route.path === '/api/health' && route.methods.includes('get')));
});
