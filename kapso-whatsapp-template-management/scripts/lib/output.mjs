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
  if (result.ok) {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(result, null, 2));
    return 0;
  }

  // eslint-disable-next-line no-console
  console.error(JSON.stringify(result, null, 2));
  return 2;
}
