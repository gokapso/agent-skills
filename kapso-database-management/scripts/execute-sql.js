const { hasHelpFlag } = require('./lib/args');

function err(message, details) {
  return { ok: false, error: { message, details } };
}

async function main() {
  const argv = process.argv.slice(2);
  if (hasHelpFlag(argv)) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          usage: 'node /agent-skills/kapso-database-management/scripts/execute-sql.js --sql <query>',
          env: ['KAPSO_API_BASE_URL', 'KAPSO_API_KEY', 'PROJECT_ID']
        },
        null,
        2
      )
    );
    return 0;
  }

  console.error(
    JSON.stringify(
      err('Raw SQL execution is not supported via the Platform API.', {
        notes: ['Use the table CRUD endpoints instead of SQL.']
      }),
      null,
      2
    )
  );
  return 2;
}

main().then((code) => process.exit(code));
