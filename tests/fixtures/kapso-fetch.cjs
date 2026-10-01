// Offline API double: execute the actual CLI, capture its request, and return
// synthetic API data. Never send a request or load credentials from a user file.
const fs = require('node:fs');
const fixture = JSON.parse(fs.readFileSync(process.env.KAPSO_TEST_FIXTURE, 'utf8'));
const requests = [];
global.fetch = async (url, options = {}) => {
  let body = options.body;
  if (body instanceof FormData) {
    body = Object.fromEntries(await Promise.all([...body.entries()].map(async ([key, value]) => [
      key, typeof value === 'string' ? value : {
        name: value.name, type: value.type, text: await value.text()
      }
    ])));
  } else if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { /* plain request body */ }
  }
  requests.push({
    url: String(url), method: options.method || 'GET',
    headers: Object.fromEntries(new Headers(options.headers)), body: body ?? null
  });
  if (fixture.redirect && options.redirect === 'error') throw new TypeError('fetch failed');
  return new Response(JSON.stringify(fixture.response), {
    status: fixture.status || 200, headers: { 'Content-Type': 'application/json' }
  });
};
process.on('exit', () => fs.writeFileSync(process.env.KAPSO_TEST_REQUESTS, JSON.stringify(requests)));
