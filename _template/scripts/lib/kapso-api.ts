type KapsoConfig = {
  baseUrl: string;
  apiKey: string;
  projectId: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function normalizePlatformBase(raw: string): string {
  const trimmed = raw.replace(/\/+$/, '');
  if (trimmed.endsWith('/platform/v1')) return trimmed;
  if (trimmed.endsWith('/api')) return `${trimmed}/platform/v1`;
  return `${trimmed}/platform/v1`;
}

export function kapsoConfigFromEnv(): KapsoConfig {
  return {
    baseUrl: normalizePlatformBase(requireEnv('KAPSO_API_BASE_URL')),
    apiKey: requireEnv('KAPSO_API_KEY'),
    projectId: requireEnv('PROJECT_ID')
  };
}

export async function kapsoRequest<T>(
  config: KapsoConfig,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const url = `${config.baseUrl}${path}`;
  const headers = new Headers(init.headers);
  headers.set('X-API-Key', config.apiKey);
  headers.set('Content-Type', headers.get('Content-Type') || 'application/json');

  const resp = await fetch(url, { ...init, headers });
  const text = await resp.text();

  if (!resp.ok) {
    throw new Error(`Kapso API request failed (status=${resp.status}) body=${text}`);
  }

  return text ? (JSON.parse(text) as T) : ({} as T);
}
