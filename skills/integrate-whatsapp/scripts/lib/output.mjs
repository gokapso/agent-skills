import security from './security.js';

export function ok(data) {
  return { ok: true, data };
}

export function blocked(reason, details) {
  return { ok: true, blocked: true, ...details, reason };
}

export function err(message, details) {
  return { ok: false, error: { message, details } };
}

export function printResult(result) {
  // Skill runners sometimes only surface stdout. Print errors there too so
  // agents don't see only "exit status 2" with no details.
  security.printJson(result);

  return result.ok ? 0 : 2;
}
