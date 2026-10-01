const DEFAULT_GRAPH_VERSION = 'v24.0';
const { validateApiUrl } = require('./security');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function normalizeBaseUrl(raw) {
  const trimmed = raw.replace(/\/+$/, '');
  const metaMatch = trimmed.match(/^(.*)\/meta(?:\/whatsapp)?\/v\d+\.\d+$/);
  if (metaMatch) return metaMatch[1];
  if (trimmed.endsWith('/platform/v1')) return trimmed.slice(0, -'/platform/v1'.length);
  return trimmed;
}

function normalizeGraphVersion(version) {
  if (!version) return DEFAULT_GRAPH_VERSION;
  return version.startsWith('v') ? version : `v${version}`;
}

function getConfig() {
  const rawBase = requireEnv('KAPSO_API_BASE_URL');
  validateApiUrl(rawBase, { base: true });
  const baseUrl = normalizeBaseUrl(rawBase);
  return {
    baseUrl,
    apiKey: requireEnv('KAPSO_API_KEY'),
    graphVersion: normalizeGraphVersion(process.env.META_GRAPH_VERSION)
  };
}

module.exports = {
  getConfig
};
