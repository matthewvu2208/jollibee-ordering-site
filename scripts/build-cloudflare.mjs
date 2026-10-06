import './sites-env.mjs';
import {spawnSync} from 'node:child_process';
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import path from 'node:path';

const deploymentFile = '.sites-runtime/cloudflare-deployment.json';
if (!existsSync(deploymentFile)) throw new Error('Connect your Cloudflare account and D1 database before building for deployment.');
const deployment = JSON.parse(readFileSync(deploymentFile, 'utf8'));
if (!/^[a-f0-9]{32}$/.test(deployment.account_id) || !/^[a-f0-9-]{36}$/.test(deployment.database_id)) throw new Error('Invalid Cloudflare deployment configuration.');
const result = spawnSync(process.execPath, ['--import', './scripts/sites-env.mjs', './scripts/run-framework.mjs', 'build'], {
  stdio: 'inherit', env: {...process.env, JOLLIBEE_CLOUDFLARE: '1'},
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
const output = 'dist/server/wrangler.json';
const config = JSON.parse(readFileSync(output, 'utf8'));
config.account_id = deployment.account_id;
config.workers_dev = true;
config.preview_urls = false;
config.observability = {enabled: false};
config.d1_databases[0].migrations_dir = path.resolve('drizzle');
config.assets.run_worker_first = ['/api/*', '/signin-with-chatgpt'];
writeFileSync(output, JSON.stringify(config, null, 2) + '\n');
console.log('Cloudflare deployment build ready.');
