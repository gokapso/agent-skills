import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHmac } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, statSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import test from 'node:test';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skill = process.env.INTEGRATE_SKILL_ROOT || path.join(repo, 'skills/integrate-whatsapp');
const preload = path.join(repo, 'tests/fixtures/kapso-fetch.cjs');
const snapshots = {};
const apiKey = 'synthetic-api-key';

function cli(script, args = [], options = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), 'kapso-cli-test-'));
  try {
    const fixture = path.join(dir, 'fixture.json');
    const requests = path.join(dir, 'requests.json');
    writeFileSync(fixture, JSON.stringify({ response: { id: 'fixture-id', status: 'APPROVED', data: [] }, ...options.fixture }));
    const env = {
      PATH: process.env.PATH, NODE_NO_WARNINGS: '1', KAPSO_API_BASE_URL: 'https://api.kapso.ai', KAPSO_API_KEY: apiKey,
      KAPSO_TEST_FIXTURE: fixture, KAPSO_TEST_REQUESTS: requests, ...options.env
    };
    const result = spawnSync(process.execPath, ['--require', preload, path.join(skill, 'scripts', script), ...args], {
      env, cwd: skill, encoding: 'utf8', timeout: 10000
    });
    assert.ifError(result.error);
    return { status: result.status, stdout: result.stdout, stderr: result.stderr,
      requests: JSON.parse(readFileSync(requests, 'utf8')) };
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

const cases = [
  ['discover-numbers', 'list-platform-phone-numbers.mjs', ['--page', '2', '--per-page', '10'], 'GET', '/platform/v1/whatsapp/phone_numbers?page=2&per_page=10'],
  ['list-webhooks', 'list.js', ['--scope', 'project', '--kind', 'kapso'], 'GET', '/platform/v1/whatsapp/webhooks?kind=kapso'],
  ['get-webhook', 'get.js', ['--phone-number-id', 'phone-123', '--webhook-id', 'webhook-123'], 'GET', '/platform/v1/whatsapp/phone_numbers/phone-123/webhooks/webhook-123'],
  ['create-project-webhook', 'create.js', ['--scope', 'project', '--url', 'https://example.com/hooks', '--events', 'whatsapp.phone_number.created'], 'POST', '/platform/v1/whatsapp/webhooks'],
  ['create-phone-webhook', 'create.js', ['--phone-number-id', 'phone-123', '--url', 'https://example.com/hooks', '--events', 'whatsapp.message.received', '--payload-version', 'v2', '--buffer-enabled', 'true'], 'POST', '/platform/v1/whatsapp/phone_numbers/phone-123/webhooks'],
  ['update-webhook', 'update.js', ['--scope', 'project', '--webhook-id', 'webhook-123', '--active', 'false'], 'PATCH', '/platform/v1/whatsapp/webhooks/webhook-123'],
  ['delete-webhook', 'delete.js', ['--scope', 'project', '--webhook-id', 'webhook-123'], 'DELETE', '/platform/v1/whatsapp/webhooks/webhook-123'],
  ['test-webhook', 'test.js', ['--webhook-id', 'webhook-123', '--event-type', 'whatsapp.phone_number.created'], 'POST', '/platform/v1/whatsapp/webhooks/webhook-123/test?event_type=whatsapp.phone_number.created'],
  ['list-templates', 'list-templates.mjs', ['--business-account-id', 'waba-123'], 'GET', '/meta/whatsapp/v24.0/waba-123/message_templates'],
  ['create-template', 'create-template.mjs', ['--business-account-id', 'waba-123', '--file', 'assets/template-utility-order-status-update.json'], 'POST', '/meta/whatsapp/v24.0/waba-123/message_templates'],
  ['send-template', 'send-template.mjs', ['--phone-number-id', 'phone-123', '--file', 'assets/send-template-order-status-update.json'], 'POST', '/meta/whatsapp/v24.0/phone-123/messages'],
  ['send-interactive', 'send-interactive.mjs', ['--phone-number-id', 'phone-123', '--file', 'assets/send-interactive-buttons.json'], 'POST', '/meta/whatsapp/v24.0/phone-123/messages'],
  ['upload-media', 'upload-media.mjs', ['--phone-number-id', 'phone-123', '--file', 'assets/sample-flow.json', '--mime-type', 'application/json'], 'POST', '/meta/whatsapp/v24.0/phone-123/media'],
  ['list-flows', 'list-flows.js', ['--phone-number-id', 'phone-123'], 'GET', '/platform/v1/whatsapp/flows?phone_number_id=phone-123'],
  ['create-flow', 'create-flow.js', ['--phone-number-id', 'phone-123', '--name', 'Order form', '--flow-json-file', 'assets/sample-flow.json'], 'POST', '/platform/v1/whatsapp/flows'],
  ['get-flow', 'get-flow.js', ['--flow-id', 'flow-123'], 'GET', '/platform/v1/whatsapp/flows/flow-123'],
  ['update-flow', 'update-flow-json.js', ['--flow-id', 'flow-123', '--json-file', 'assets/dynamic-flow.json'], 'POST', '/platform/v1/whatsapp/flows/flow-123/versions'],
  ['publish-flow', 'publish-flow.js', ['--flow-id', 'flow-123'], 'POST', '/platform/v1/whatsapp/flows/flow-123/publish'],
  ['encryption', 'setup-encryption.js', ['--flow-id', 'flow-123', '--phone-number-id', 'phone-123'], 'POST', '/platform/v1/whatsapp/flows/flow-123/setup_encryption'],
  ['deploy-endpoint', 'deploy-data-endpoint.js', ['--flow-id', 'flow-123'], 'POST', '/platform/v1/whatsapp/flows/flow-123/data_endpoint/deploy'],
  ['register-endpoint', 'register-data-endpoint.js', ['--flow-id', 'flow-123'], 'POST', '/platform/v1/whatsapp/flows/flow-123/data_endpoint/register'],
  ['send-flow-preview', 'send-test-flow.js', ['--phone-number-id', 'phone-123', '--flow-id', 'flow-123', '--to', '+15551234567', '--body-text', 'Choose a slot', '--draft', 'true'], 'POST', '/meta/whatsapp/v24.0/phone-123/messages']
];

for (const [name, script, args, method, endpoint] of cases) {
  test(`supported command: ${name}`, () => {
    const result = cli(script, args);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).ok, true, result.stdout);
    assert.equal(result.requests.length, 1);
    assert.equal(result.requests[0].method, method);
    assert.equal(result.requests[0].url, `https://api.kapso.ai${endpoint}`);
    assert.equal(result.requests[0].headers['x-api-key'], apiKey);
    snapshots[name] = result;
  });
}

test('custom HTTPS endpoint and graph version remain supported', () => {
  const result = cli('send-interactive.mjs', ['--phone-number-id', 'phone-123', '--file', 'assets/send-interactive-buttons.json'], {
    env: { KAPSO_API_BASE_URL: 'https://staging.example.com/platform/v1', META_GRAPH_VERSION: '23.0' }
  });
  assert.equal(result.requests[0].url, 'https://staging.example.com/meta/whatsapp/v23.0/phone-123/messages');
  snapshots['custom-https'] = result;
});

test('invalid message payload does not call the API', () => {
  const result = cli('send-template.mjs', ['--phone-number-id', 'phone-123', '--json', '{"type":"text","to":"+15551234567"}']);
  assert.equal(result.status, 2);
  assert.equal(result.requests.length, 0);
  snapshots['invalid-payload'] = result;
});

test('HTTP API error retains status and structured output', () => {
  const result = cli('create-template.mjs', ['--business-account-id', 'waba-123', '--json', '{"name":"test"}'], {
    fixture: { status: 400, response: { error: { message: 'Invalid template', code: 100 } } }
  });
  assert.equal(result.status, 2);
  assert.equal(JSON.parse(result.stdout).error.details.response.status, 400);
  snapshots['api-error'] = result;
});

test('baseline supported behavior is unchanged', () => {
  if (process.env.KAPSO_BASELINE_WRITE) {
    writeFileSync(process.env.KAPSO_BASELINE_WRITE, JSON.stringify(snapshots, null, 2));
  }
  if (process.env.KAPSO_BASELINE_COMPARE) {
    assert.deepEqual(snapshots, JSON.parse(readFileSync(process.env.KAPSO_BASELINE_COMPARE, 'utf8')));
  } else if (!process.env.KAPSO_BASELINE_WRITE) {
    assert.deepEqual(snapshots, JSON.parse(readFileSync(path.join(repo, 'tests/fixtures/integrate-command-baseline.json'), 'utf8')));
  }
});

const security = process.env.KAPSO_SECURITY_TESTS !== '0';
test('reject insecure API destinations before sending credentials; allow explicit local development', { skip: !security }, () => {
  for (const [script, args] of [
    ['list-platform-phone-numbers.mjs', []], ['list.js', ['--scope', 'project']],
    ['list-flows.js', ['--phone-number-id', 'phone-123']], ['list-templates.mjs', ['--business-account-id', 'waba-123']]
  ]) {
    for (const base of ['http://api.kapso.ai', 'https://user:password@example.com', 'https://example.com?token=secret']) {
      const result = cli(script, args, { env: { KAPSO_API_BASE_URL: base } });
      assert.equal(result.requests.length, 0, `${script} accepted ${base}`);
      assert.equal(JSON.parse(result.stdout || result.stderr).ok, false);
    }
    const local = cli(script, args, { env: { KAPSO_API_BASE_URL: 'http://127.0.0.1:3000', KAPSO_ALLOW_INSECURE_HTTP: 'true' } });
    assert.equal(local.requests.length, 1, script);
    assert.equal(JSON.parse(local.stdout).ok, true);
  }
});

test('authenticated requests reject redirects', { skip: !security }, () => {
  for (const [script, args] of [
    ['list-platform-phone-numbers.mjs', []], ['list.js', ['--scope', 'project']],
    ['list-flows.js', ['--phone-number-id', 'phone-123']], ['list-templates.mjs', ['--business-account-id', 'waba-123']]
  ]) {
    const result = cli(script, args, { fixture: { redirect: true } });
    assert.equal(JSON.parse(result.stdout || result.stderr).ok, false, script);
  }
});

test('secrets are redacted from success and error output; one-time secrets can be saved privately', { skip: !security }, () => {
  const response = { id: 'webhook-123', secret_key: 'one-time-secret', notice: 'Store one-time-secret securely', webhook_verify_token: 'verify-secret', headers: { Authorization: 'Bearer synthetic-token', 'X-Trace': 'trace-123' }, flow_token: 'correlation-123' };
  for (const [script, args] of [
    ['create.js', ['--scope', 'project', '--url', 'https://example.com/hooks', '--events', 'whatsapp.phone_number.created']],
    ['create-flow.js', ['--phone-number-id', 'phone-123']],
    ['create-template.mjs', ['--business-account-id', 'waba-123', '--json', '{}']]
  ]) {
    for (const status of [200, 400]) {
      const result = cli(script, args, { fixture: { response, status } });
      assert.ok(!`${result.stdout}${result.stderr}`.includes('one-time-secret'));
      assert.ok(!`${result.stdout}${result.stderr}`.includes('synthetic-token'));
      assert.ok(!`${result.stdout}${result.stderr}`.includes('verify-secret'));
      if (status === 200) {
        assert.ok(result.stdout.includes('webhook-123'));
        assert.ok(result.stdout.includes('correlation-123'));
        assert.ok(result.stdout.includes('trace-123'));
      }
    }
  }
  const dir = mkdtempSync(path.join(tmpdir(), 'kapso-secret-test-'));
  try {
    const file = path.join(dir, 'response.json');
    const args = ['--scope', 'project', '--url', 'https://example.com/hooks', '--events', 'whatsapp.phone_number.created'];
    const result = cli('create.js', args, { fixture: { response }, env: { KAPSO_SECRET_OUTPUT_FILE: file } });
    assert.equal(result.status, 0);
    assert.equal(JSON.parse(readFileSync(file, 'utf8')).data.secret_key, 'one-time-secret');
    assert.equal(statSync(file).mode & 0o777, 0o600);
    const existing = cli('create.js', args, { fixture: { response }, env: { KAPSO_SECRET_OUTPUT_FILE: file } });
    assert.equal(existing.requests.length, 0, 'refuse an existing output file before mutation');
    const link = path.join(dir, 'link.json');
    symlinkSync(file, link);
    const linked = cli('create.js', args, { fixture: { response }, env: { KAPSO_SECRET_OUTPUT_FILE: link } });
    assert.equal(linked.requests.length, 0);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('connection webhook example authenticates raw bytes before mutating records', { skip: !security }, async () => {
  const doc = readFileSync(path.join(skill, 'references/detecting-whatsapp-connection.md'), 'utf8');
  const snippet = doc.split('### Handle the webhook')[1].match(/```javascript\n([\s\S]*?)\n```/)[1];
  const routes = new Map();
  const updates = [];
  const messages = [];
  const secret = 'synthetic-webhook-secret';
  vm.runInNewContext(snippet, {
    require: await import('node:module').then(m => m.createRequire(import.meta.url)), Buffer,
    process: { env: { KAPSO_WEBHOOK_SECRET: secret, KAPSO_PROJECT_ID: 'project-123' } },
    express: { raw: () => 'raw-body-middleware' },
    app: { post: (route, ...handlers) => routes.set(route, handlers.at(-1)) },
    db: { customers: { update: async (...args) => updates.push(args) } },
    sendWelcomeMessage: async (...args) => messages.push(args)
  });
  const handler = routes.get('/webhooks/project');
  const body = Buffer.from(JSON.stringify({ event: 'whatsapp.phone_number.created', data: { project: { id: 'project-123' }, phone_number_id: 'phone-123', customer: { id: 'customer-123' } } }));
  const signature = createHmac('sha256', secret).update(body).digest('hex');
  async function invoke(raw, header) {
    const res = { code: 200, status(code) { this.code = code; return this; }, send() { return this; } };
    await handler({ body: raw, get: name => name === 'X-Webhook-Signature' ? header : 'whatsapp.phone_number.created' }, res);
    return res.code;
  }
  assert.equal(await invoke(body, signature), 200);
  assert.equal(updates.length, 1);
  assert.equal(messages.length, 1);
  for (const header of [undefined, 'bad', '0'.repeat(64)]) assert.equal(await invoke(body, header), 401);
  const forged = Buffer.from(body.toString().replace('customer-123', 'customer-forged'));
  assert.equal(await invoke(forged, signature), 401);
  const wrongProject = Buffer.from(body.toString().replace('project-123', 'project-other'));
  assert.equal(await invoke(wrongProject, createHmac('sha256', secret).update(wrongProject).digest('hex')), 403);
  assert.equal(updates.length, 1);
  assert.equal(messages.length, 1);
  const rootBody = Buffer.from(JSON.stringify(JSON.parse(body).data));
  assert.equal(await invoke(rootBody, createHmac('sha256', secret).update(rootBody).digest('hex')), 200);
  assert.equal(updates.length, 2);
  assert.equal(messages.length, 2);
});

test('redirect example stores only API-confirmed data for the authenticated customer', { skip: !security }, async () => {
  const doc = readFileSync(path.join(skill, 'references/detecting-whatsapp-connection.md'), 'utf8');
  const snippet = doc.split('### Handle the redirect')[1].match(/```javascript\n([\s\S]*?)\n```/)[1];
  let handler;
  const updates = [];
  const requests = [];
  const customer = { id: 'local-123', kapso_customer_id: 'customer-123', kapso_setup_link_id: 'setup-123' };
  let apiNumbers = [{ phone_number_id: 'phone-123', customer_id: 'customer-123', business_account_id: 'waba-123', display_phone_number: '+15551234567' }];
  vm.runInNewContext(snippet, {
    URLSearchParams, process: { env: { KAPSO_API_KEY: apiKey } },
    requireCustomerSession: () => {},
    app: { get: (route, ...handlers) => { assert.equal(route, '/whatsapp/success'); handler = handlers.at(-1); } },
    db: { customers: {
      findById: async id => { assert.equal(id, 'local-123'); return customer; },
      update: async (...args) => updates.push(args)
    } },
    fetch: async (url, options) => {
      requests.push({ url, options });
      return { ok: true, json: async () => ({ data: apiNumbers }) };
    }
  });
  async function invoke(query) {
    const res = { code: 200, status(code) { this.code = code; return this; }, send() { return this; }, render(page, data) { this.page = page; this.data = data; return this; } };
    await handler({ user: { customerId: 'local-123' }, query }, res);
    return res;
  }
  const query = { setup_link_id: 'setup-123', phone_number_id: 'phone-123', status: 'completed', customer_id: 'attacker-123', business_account_id: 'fake-waba', display_phone_number: 'fake-display' };
  const success = await invoke(query);
  assert.equal(success.page, 'whatsapp-connected');
  assert.equal(updates[0][0], 'local-123');
  assert.equal(updates[0][1].business_account_id, 'waba-123');
  assert.equal(updates[0][1].display_phone_number, '+15551234567');
  assert.equal(requests[0].url, 'https://api.kapso.ai/platform/v1/whatsapp/phone_numbers?customer_id=customer-123&phone_number_id=phone-123');
  assert.equal(requests[0].options.redirect, 'error');
  assert.equal((await invoke({ ...query, setup_link_id: 'forged-setup' })).code, 403);
  assert.equal(requests.length, 1);
  apiNumbers = [{ ...apiNumbers[0], customer_id: 'someone-else' }];
  assert.equal((await invoke(query)).code, 409);
  apiNumbers = [];
  assert.equal((await invoke(query)).code, 409);
  assert.equal(updates.length, 1);
});
