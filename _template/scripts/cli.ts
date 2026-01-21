type Result =
  | { ok: true; data: unknown }
  | { ok: false; error: { message: string; details?: unknown } };

function parseArgs(argv: string[]) {
  const [command, ...rest] = argv;

  if (!command || command === '--help' || command === '-h') {
    return { ok: false as const, help: true as const };
  }

  return { ok: true as const, command, rest };
}

function ok(data: unknown): Result {
  return { ok: true, data };
}

function err(message: string, details?: unknown): Result {
  return { ok: false, error: { message, details } };
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));

  if (!args.ok) {
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify(
        {
          ok: true,
          usage: 'npx tsx scripts/cli.ts <command> [args...]',
          commands: ['example'],
          env: ['KAPSO_API_BASE_URL', 'KAPSO_API_KEY', 'PROJECT_ID']
        },
        null,
        2
      )
    );
    return 0;
  }

  if (args.command === 'example') {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(ok({ message: 'replace this with real logic' }), null, 2));
    return 0;
  }

  // eslint-disable-next-line no-console
  console.error(JSON.stringify(err(`Unknown command: ${args.command}`), null, 2));
  return 2;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(JSON.stringify(err('Unhandled error', { message: String(error?.message || error) }), null, 2));
    process.exit(1);
  });

