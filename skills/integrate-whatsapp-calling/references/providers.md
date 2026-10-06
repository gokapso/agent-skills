# Provider integration

## Choose the path

| Runtime | Connection through Kapso |
| --- | --- |
| Self-hosted Pipecat | A signed Meta receiver plus call-action client and a WebRTC transport. Your application owns sessions and audio. |
| Pipecat Cloud | Deploy the bot, then use Kapso's dashboard Pipecat provider or your own bridge that launches sessions. A stock self-hosted server does not automatically implement the Cloud launcher contract. |
| ElevenLabs Agents | Your WebRTC bridge streams caller audio into an ElevenLabs agent conversation and returns its output to WhatsApp. ElevenLabs TTS alone is not the hosted agent runtime. |

Do not assume a provider's direct-Meta WhatsApp tutorial can be used unchanged through Kapso. Direct-Meta access tokens, webhook verification, signature headers, and API URLs differ. Keep the provider's WebRTC transport and voice pipeline; adapt its API client, API base URL, authentication, and webhook verifier to Kapso. Use Kapso's project key and webhook HMAC for the Kapso side; keep provider credentials and authentication separate.

Official provider guidance:
- [Pipecat WhatsApp Calling](https://docs.pipecat.ai/pipecat/features/whatsapp)
- [Pipecat Cloud WhatsApp guide](https://docs.pipecat.ai/pipecat-cloud/guides/whatsapp)
- [ElevenLabs Agent WebSockets](https://elevenlabs.io/docs/eleven-agents/api-reference/eleven-agents/websocket)
- [ElevenLabs end-call tool](https://elevenlabs.io/docs/eleven-agents/customization/tools/system-tools/end-call)

## Keep signaling and media separate

HTTPS carries webhooks and SDP; it does not transport the WebRTC audio. A tunnel such as Tailscale Funnel can expose a receiver without making UDP media reachable. Configure reachable ICE candidates and a TURN relay when needed.

Use the media transport and provider's actual input/output audio formats and sample rates. Resample at the bridge boundary as needed. For ElevenLabs WebSockets, read the conversation's negotiated audio metadata rather than assuming a universal PCM rate. Handle audio, interruptions, keepalive, tools, errors, and conversation completion. Tie provider conversation/session IDs to the Meta call ID.

Prepare inbound media without playing the greeting. Start speech after successful `accept` and media readiness. For outbound calls, wait for `ACCEPTED` before starting the speaking conversation: SDP may arrive while the phone is still ringing.

Wire provider completion and any agent end-call tool to WhatsApp `terminate`, followed by session cleanup. Let farewell playback finish when ending normally; do not depend on a particular client tool callback to observe a native provider end-call tool. A provider socket closing alone does not prove Meta ended the call.

## Provider-owned recordings and transcripts

Choose [Meta native artifacts](native-artifacts.md) when the requested output is Meta's call recording or transcript. For capture in your own bridge, Pipecat's [AudioBufferProcessor](https://docs.pipecat.ai/api-reference/server/utilities/audio/audio-buffer-processor) can emit separate user/bot tracks. ElevenLabs Agents offers a [conversation audio API](https://elevenlabs.io/docs/eleven-agents/api-reference/conversations/get-audio) and [post-call audio/transcription webhooks](https://elevenlabs.io/docs/eleven-agents/workflows/post-call-webhooks) that your application can copy to its storage; verify their own signatures and retention/settings.

These are possible custom integrations, not outputs currently wired into Kapso's native artifact sidebar or independently proven for capture quality. Correlate provider conversation IDs with the Meta call ID and saved local UUID. An agent's turn transcript is distinct from running extra offline STT on captured audio; extra transcription has its own cost and quality checks. Keep capture/retention within the requested scope and use the official provider examples rather than an incomplete copied pipeline.

## Debug the failing layer

| Evidence | Next check |
| --- | --- |
| No call webhook | Number eligibility, active Meta receiver, delivery logs, correct project key and phone ID. |
| Signaling succeeds, no audio | ICE state, firewall/TURN, received audio frames, outgoing audio format. |
| Greeting then silence | Committed caller transcript, turn detection, provider errors, pipeline idle/silence timeouts. PCM bypassing an STT pipeline may not count as activity for its default idle timer. |
| Room noise interrupts constantly | Provider voice-activity and turn detection settings; prompt changes do not fix audio thresholds. |
| Agent finishes, WhatsApp stays connected | Provider completion mapped to `terminate` and all cleanup paths. |

For tools such as booking, identify the caller, read actual availability, and report changes only after the tool succeeds. Keep voice/prompt tuning in the provider configuration; prove the Calling transport separately from how natural the voice sounds.
