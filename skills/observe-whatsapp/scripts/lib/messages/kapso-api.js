function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function normalizeBaseUrl(raw) {
  return raw.replace(/\/+$/, '');
}

function requireHttps(baseUrl) {
  const parsed = new URL(baseUrl);
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && process.env.KAPSO_ALLOW_INSECURE_HTTP === 'true')) {
    throw new Error('Kapso API requests require HTTPS. For a trusted development endpoint only, set KAPSO_ALLOW_INSECURE_HTTP=true.');
  }
  return baseUrl;
}

function kapsoConfigFromEnv() {
  return {
    baseUrl: requireHttps(normalizeBaseUrl(requireEnv('KAPSO_API_BASE_URL'))),
    apiKey: requireEnv('KAPSO_API_KEY')
  };
}

async function kapsoRequest(config, path, init = {}) {
  const url = `${config.baseUrl}${path}`;
  const headers = new Headers(init.headers || undefined);
  headers.set('X-API-Key', config.apiKey);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...init, headers, redirect: 'error' });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Kapso API request failed (status=${response.status}) body=${text.split(config.apiKey).join('[REDACTED]')}`);
  }

  return text ? JSON.parse(text) : {};
}

module.exports = {
  kapsoConfigFromEnv,
  kapsoRequest
};
