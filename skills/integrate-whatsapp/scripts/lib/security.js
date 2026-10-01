const { openSync, writeFileSync, closeSync } = require('node:fs');

function validateApiUrl(raw, { base = false } = {}) {
  let url;
  try { url = new URL(raw); } catch { throw new Error('Invalid Kapso API URL'); }
  if (url.username || url.password || url.hash || (base && url.search)) {
    throw new Error('Kapso API base URLs must not contain credentials, query parameters, or fragments');
  }
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && process.env.KAPSO_ALLOW_INSECURE_HTTP === 'true')) {
    throw new Error('Kapso API requests require HTTPS. For a trusted development endpoint only, set KAPSO_ALLOW_INSECURE_HTTP=true.');
  }
  return url;
}

let secretOutput;
function prepareSecretOutput() {
  const outputPath = process.env.KAPSO_SECRET_OUTPUT_FILE;
  if (!outputPath || secretOutput !== undefined) return;
  // Reserve the file before remote mutations. Exclusive creation also rejects
  // existing files and symlinks; leave an empty private file if the request fails.
  try {
    secretOutput = openSync(outputPath, 'wx', 0o600);
  } catch {
    throw new Error('KAPSO_SECRET_OUTPUT_FILE must name a new file in an existing private directory; it will not overwrite files or follow symlinks.');
  }
  process.once('exit', () => closeSync(secretOutput));
}

function sensitiveKey(key) {
  const normalized = key.toLowerCase().replace(/[-_]/g, '');
  return /secret|password|privatekey|apikey$/.test(normalized) ||
    ['authorization', 'cookie', 'setcookie', 'accesstoken', 'refreshtoken', 'webhookverifytoken', 'token', 'embedurl'].includes(normalized);
}

function redactText(value, secrets = []) {
  // Some API helpers embed a JSON error body in a string. Redact it as an
  // object too, so credentials echoed in another field are removed together.
  if (/^\s*[\[{]/.test(value)) {
    try {
      const parsed = JSON.parse(value);
      const cleaned = redact(parsed, secrets);
      if (JSON.stringify(cleaned) !== JSON.stringify(parsed)) return JSON.stringify(cleaned);
    } catch { /* retain non-JSON diagnostics, with text redaction below */ }
  }
  let text = value;
  for (const secret of [...secrets, process.env.KAPSO_API_KEY, process.env.KAPSO_WEBHOOK_SECRET]) {
    if (secret) text = text.split(secret).join('[REDACTED]');
  }
  return text
    .replace(/("(?:[^"]*(?:secret|password|private[_-]?key|api[_-]?key)[^"]*|authorization|cookie|set-cookie|access[_-]?token|refresh[_-]?token|webhook_verify_token|token|embed_url)"\s*:\s*)"(?:\\.|[^"\\])*"/gi, '$1"[REDACTED]"')
    .replace(/([?&](?:token|api_key|access_token|secret)=)[^&#\s]*/gi, '$1[REDACTED]');
}

function redact(value, knownSecrets = []) {
  const secrets = [...knownSecrets];
  function collect(item, sensitive = false) {
    if (typeof item === 'string') {
      if (sensitive) {
        secrets.push(item);
        // Recognize Bearer credentials only in a sensitive field, while also
        // removing echoes of its token without the authentication scheme.
        const bearer = item.match(/^Bearer\s+([A-Za-z0-9._~+/=-]+)$/i);
        if (bearer) secrets.push(bearer[1]);
      } else if (/^\s*[\[{]/.test(item)) {
        // Discover nested credentials before visiting any sibling echoes.
        try { collect(JSON.parse(item)); } catch { /* non-JSON diagnostic */ }
      }
    } else if (item && typeof item === 'object') {
      for (const [key, child] of Object.entries(item)) collect(child, sensitive || sensitiveKey(key));
    }
  }
  collect(value);
  function visit(item) {
    if (typeof item === 'string') return redactText(item, secrets);
    if (Array.isArray(item)) return item.map(visit);
    if (item !== null && typeof item === 'object') {
      return Object.fromEntries(Object.entries(item).map(([key, child]) => [
        key, sensitiveKey(key) && child != null && typeof child !== 'boolean' ? '[REDACTED]' : visit(child)
      ]));
    }
    return item;
  }
  return visit(value);
}

function printJson(value, { error = false } = {}) {
  // A preflight failure must still produce the usual structured error; do not
  // retry opening an invalid output path while reporting that failure.
  if (value?.ok !== false) prepareSecretOutput();
  if (secretOutput !== undefined) writeFileSync(secretOutput, `${JSON.stringify(value, null, 2)}\n`);
  const text = JSON.stringify(redact(value), null, 2);
  if (error) console.error(text);
  else console.log(text);
}

module.exports = { validateApiUrl, prepareSecretOutput, redact, printJson };
