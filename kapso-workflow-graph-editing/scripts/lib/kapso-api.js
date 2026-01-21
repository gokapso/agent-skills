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

export function loadConfig(options = {}) {
  const requireApi = options.requireApi !== false;
  const requireProjectId = options.requireProjectId !== false;

  const rawBaseUrl = requireApi ? requireEnv('KAPSO_API_BASE_URL') : (process.env.KAPSO_API_BASE_URL || '');
  const baseUrl = rawBaseUrl ? normalizePlatformBase(rawBaseUrl) : '';
  const apiKey = requireApi ? requireEnv('KAPSO_API_KEY') : (process.env.KAPSO_API_KEY || '');
  const projectId = requireProjectId ? requireEnv('PROJECT_ID') : (process.env.PROJECT_ID || '');

  return { baseUrl, apiKey, projectId };
}

function buildUrl(baseUrl, path) {
  const trimmed = baseUrl.replace(/\/+$/, '');
  const safePath = path.startsWith('/') ? path.slice(1) : path;
  return `${trimmed}/${safePath}`;
}

export async function requestJson(config, options) {
  const url = new URL(buildUrl(config.baseUrl, options.path));

  if (options.query) {
    Object.entries(options.query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      url.searchParams.set(key, String(value));
    });
  }

  const headers = {
    Accept: 'application/json'
  };

  if (config.apiKey) {
    headers['X-API-Key'] = config.apiKey;
  }

  let body;
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const response = await fetch(url.toString(), {
    method: options.method,
    headers,
    body
  });

  const text = await response.text();
  let parsed = text;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (response.ok) {
    const data = (parsed && typeof parsed === 'object' && 'data' in parsed)
      ? parsed.data
      : parsed;

    return {
      ok: true,
      status: response.status,
      data,
      raw: parsed
    };
  }

  const message = (parsed && typeof parsed === 'object' && 'error' in parsed)
    ? String(parsed.error)
    : `HTTP ${response.status}`;

  return {
    ok: false,
    status: response.status,
    error: message,
    raw: parsed
  };
}
