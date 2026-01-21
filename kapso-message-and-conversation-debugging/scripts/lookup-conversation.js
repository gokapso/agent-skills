const { hasHelpFlag, parseFlags } = require('./lib/args');
const { kapsoConfigFromEnv, kapsoRequest } = require('./lib/kapso-api');

function ok(data) {
  return { ok: true, data };
}

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
          usage:
            'node /agent-skills/kapso-message-and-conversation-debugging/scripts/lookup-conversation.js [--phone-number <e164>] [--conversation-id <uuid>] [--status <open|closed>] [--whatsapp-config-id <id>] [--page <n>] [--per-page <n>]',
          env: ['KAPSO_API_BASE_URL', 'KAPSO_API_KEY', 'PROJECT_ID']
        },
        null,
        2
      )
    );
    return 0;
  }

  try {
    const flags = parseFlags(argv);
    const conversationId = flags['conversation-id'];
    const phoneNumber = flags['phone-number'];

    const config = kapsoConfigFromEnv();

    if (conversationId && conversationId !== true) {
      const data = await kapsoRequest(
        config,
        `/whatsapp/conversations/${encodeURIComponent(conversationId)}`
      );
      console.log(JSON.stringify(ok(data), null, 2));
      return 0;
    }

    if (!phoneNumber || phoneNumber === true) {
      throw new Error('Provide --conversation-id or --phone-number');
    }

    const params = new URLSearchParams();
    params.set('phone_number', phoneNumber);
    if (flags.status) params.set('status', flags.status);
    if (flags['whatsapp-config-id']) params.set('whatsapp_config_id', flags['whatsapp-config-id']);
    if (flags.page) params.set('page', flags.page);
    if (flags['per-page']) params.set('per_page', flags['per-page']);

    const data = await kapsoRequest(
      config,
      `/whatsapp/conversations?${params.toString()}`
    );

    console.log(JSON.stringify(ok(data), null, 2));
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify(err('Command failed', { message }), null, 2));
    return 1;
  }
}

main().then((code) => process.exit(code));
