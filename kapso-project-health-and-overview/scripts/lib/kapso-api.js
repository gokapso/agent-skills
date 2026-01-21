function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function normalizePlatformBase(raw) {
  const trimmed = raw.replace(/\/+$/, '');
  if (trimmed.endsWith('/platform/v1')) return trimmed;
  if (trimmed.endsWith('/api')) return `${trimmed}/platform/v1`;
  return `${trimmed}/platform/v1`;
}

function kapsoConfigFromEnv() {
  return {
    baseUrl: normalizePlatformBase(requireEnv('KAPSO_API_BASE_URL')),
    apiKey: requireEnv('KAPSO_API_KEY'),
    projectId: requireEnv('PROJECT_ID')
  };
}

async function kapsoRequest(config, path, init = {}) {
  const url = `${config.baseUrl}${path}`;
  if (process.env.KAPSO_DEBUG_URLS === 'true') {
    console.error(`[kapso-debug] ${init.method || 'GET'} ${url}`);
  }
  const headers = new Headers(init.headers || undefined);
  headers.set('X-API-Key', config.apiKey);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...init, headers });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Kapso API request failed (status=${response.status}) body=${text}`);
  }

  return text ? JSON.parse(text) : {};
}

module.exports = {
  kapsoConfigFromEnv,
  kapsoRequest
};
