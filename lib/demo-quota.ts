export async function reserveDemoReply(db: D1Database | undefined, owner: string, configuredLimit?: string) {
  if (!db) return false;
  const day = new Date().toISOString().slice(0, 10);
  const parsed = Number(configuredLimit || 100);
  const limit = Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 500) : 100;
  const reserve = (scope: string, maximum: number) => db.prepare(
    'INSERT INTO demo_ai_usage(day,scope,requests) VALUES(?,?,1) ON CONFLICT(day,scope) DO UPDATE SET requests=requests+1 WHERE requests<? RETURNING requests'
  ).bind(day, scope, maximum).first();
  if (!await reserve('global', limit)) return false;
  return !!await reserve(owner, 30);
}
