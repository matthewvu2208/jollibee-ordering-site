import assert from 'node:assert/strict';
import {prepareDemoRequest} from '../.sites-runtime/demo-session-test.mjs';

const secret = 'test-only-secret-for-cookie-authentication-123456';
const base = 'https://jollibee-test.example';
const get = cookie => new Request(base + '/api/state', {headers: cookie ? {cookie} : {}});
const first = await prepareDemoRequest(get(), secret);
assert.ok('request' in first && first.cookie);
assert.match(first.cookie, /HttpOnly; Secure; SameSite=Lax$/);
const cookie = first.cookie.split(';')[0];
const id = first.request.headers.get('oai-authenticated-user-id');
const second = await prepareDemoRequest(get(cookie), secret);
assert.equal(second.request.headers.get('oai-authenticated-user-id'), id);
assert.equal(second.cookie, undefined);
const other = await prepareDemoRequest(get(), secret);
assert.notEqual(other.request.headers.get('oai-authenticated-user-id'), id);

const post = (suppliedCookie, origin = base, forged = 'victim') => new Request(base + '/api/state', {
  method: 'POST', headers: {cookie: suppliedCookie, origin, 'oai-authenticated-user-id': forged}, body: '{}',
});
const forged = await prepareDemoRequest(post(cookie), secret);
assert.equal(forged.request.headers.get('oai-authenticated-user-id'), id);
const tampered = cookie.slice(0, -1) + (cookie.endsWith('0') ? '1' : '0');
assert.equal((await prepareDemoRequest(post(tampered), secret)).response.status, 401);
assert.equal((await prepareDemoRequest(post(cookie, 'https://attacker.example'), secret)).response.status, 403);
assert.equal((await prepareDemoRequest(post('', base), secret)).response.status, 401);
assert.equal((await prepareDemoRequest(post(cookie + '; ' + cookie), secret)).response.status, 401);
assert.equal((await prepareDemoRequest(post(cookie), secret + 'changed')).response.status, 401);
assert.equal((await prepareDemoRequest(get(), undefined)).response.status, 503);
const expired = cookie.replace(/\.\d{10}\./, '.1000000000.');
assert.equal((await prepareDemoRequest(post(expired), secret)).response.status, 401);
console.log('PASS: separate visitors, signed cookie, identity spoofing, tampering, CSRF, expiry, missing secret.');
