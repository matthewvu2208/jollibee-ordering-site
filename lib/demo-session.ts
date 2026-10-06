const cookieName = '__Host-jollibee-demo';
const lifetime = 7 * 24 * 60 * 60;
const encoder = new TextEncoder();

async function signingKey(secret: string) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign', 'verify']);
}

async function issue(secret: string, now: number) {
  const id = crypto.randomUUID();
  const payload = `${id}.${now + lifetime}`;
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', await signingKey(secret), encoder.encode(payload)));
  const hex = Array.from(signature, byte => byte.toString(16).padStart(2, '0')).join('');
  return {id, cookie: `${cookieName}=${payload}.${hex}; Path=/; Max-Age=${lifetime}; HttpOnly; Secure; SameSite=Lax`};
}

async function verify(cookie: string | null, secret: string, now: number) {
  const values = (cookie || '').split(';').map(value => value.trim()).filter(value => value.startsWith(cookieName + '='));
  if (values.length !== 1) return null;
  const match = values[0].slice(cookieName.length + 1).match(/^([a-f0-9-]{36})\.(\d{10})\.([a-f0-9]{64})$/);
  if (!match || Number(match[2]) <= now || Number(match[2]) > now + lifetime) return null;
  const signature = Uint8Array.from(match[3].match(/../g)!, byte => parseInt(byte, 16));
  const valid = await crypto.subtle.verify('HMAC', await signingKey(secret), signature, encoder.encode(`${match[1]}.${match[2]}`));
  return valid ? match[1] : null;
}

type SessionResult = {request: Request; cookie?: string} | {response: Response};
export async function prepareDemoRequest(request: Request, secret: string | undefined): Promise<SessionResult> {
  const fail = (error: string, status: number): SessionResult => ({response: Response.json({error}, {status, headers: {'Cache-Control': 'private, no-store'}})});
  if (!secret || secret.length < 32) return fail('Phiên trải nghiệm chưa sẵn sàng. Vui lòng thử lại sau.', 503);
  const url = new URL(request.url);
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    if (request.headers.get('origin') !== url.origin || request.headers.get('sec-fetch-site') === 'cross-site') return fail('Yêu cầu không hợp lệ.', 403);
  }
  const now = Math.floor(Date.now() / 1000);
  let id = await verify(request.headers.get('cookie'), secret, now);
  let cookie: string | undefined;
  if (!id) {
    if (request.method !== 'GET' && request.method !== 'HEAD') return fail('Phiên trải nghiệm đã hết hạn. Hãy tải lại trang.', 401);
    const session = await issue(secret, now);
    id = session.id;
    cookie = session.cookie;
  }
  const headers = new Headers(request.headers);
  for (const name of Array.from(headers.keys())) if (name.startsWith('oai-authenticated-user-')) headers.delete(name);
  headers.set('oai-authenticated-user-id', 'demo_' + id);
  return {request: new Request(request, {headers}), cookie};
}
