# Native artifacts and pricing

Kapso saves Meta completion metadata and retrieves media on demand. It does not automatically opt calls in, permanently archive audio/text, or run extra STT. The [merged implementation contract](https://github.com/gokapso/cientos-rails/blob/b5d48101c4f822fb1188abcf5ff27639177e7523/docs/whatsapp-calling-artifacts.md) is the source for the endpoints below; confirm deployment and number eligibility before relying on them.

## Opt in on the call action

Add either or both independent objects to the normal outbound `connect` or inbound `accept` JSON body, **never `pre_accept`**. Keep the usual recipient/call ID and real SDP fields. Each enabled feature requires `status`, `purpose`, and `announcement_language`. This example matches the implementation's authorized test checklist; use the user's actual purpose and a supported language:

```json
{
  "recording": {"status":"ENABLED","purpose":"prueba de calidad autorizada","announcement_language":"es"},
  "transcription": {"status":"ENABLED","purpose":"prueba de calidad autorizada","announcement_language":"es"}
}
```

Recording alone does not produce a transcript; transcription alone does not produce an audio recording. Meta plays an announcement to both participants before capture. With both enabled it plays a combined announcement, using the recording object's purpose/language. Preserve the normal accept/`ACCEPTED` and actual media-readiness gates; an HTTP success or announcement is not proof of complete captured audio. Verify the application's `calls` subscription as well as the active Kapso Meta receiver.

## Process completion metadata

Use the entrypoint's raw-byte HMAC verification, every entry/change/item, phone scope, and per-event deduplication. Notifications arrive in `value.calls[]` on the `calls` field:

| Event | Media object |
| --- | --- |
| `call_recording_available` | `call_recording.audio` |
| `call_transcription_available` | `call_transcript.document` |

Correlate each event's `id` (Meta call ID), `value.metadata.phone_number_id`, and owning project with saved state; preserve BSUID identities when there is no caller phone. Keep metadata handling independent of the media worker: late events after termination/cleanup must not be discarded or launch an agent. Kapso can save an artifact-only placeholder before lifecycle events arrive without establishing pickup, billing, or a conversation. Replays of the same media ID do not extend expiry; older events do not replace newer metadata.

**Logs → Meta → Calls** shows asynchronous event payloads/metadata, not full audio or transcript text. Use the saved call detail/sidebar or protected endpoints for content. Keep signed URLs, tokens, audio, and transcript content out of diagnostic logs.

## Retrieve saved artifacts

Use `https://app.kapso.ai` for the `/api/v1` artifact routes below with the project `X-API-Key`. The WhatsApp proxy uses `https://api.kapso.ai/meta/whatsapp`; it does not serve these artifact routes. **`:id` below is the saved local call UUID, not Meta's `call_id`.** Resolve it from the exact proxy history lookup in [Calling API](calling-api.md#permissions-and-logs), or list saved calls:

```text
GET /api/v1/whatsapp_calls?whatsapp_config_id={KAPSO_CONFIG_UUID}&period=week&per_page=20&page=1
GET /api/v1/whatsapp_calls/:id
GET /api/v1/whatsapp_calls/:id/artifacts/recording
GET /api/v1/whatsapp_calls/:id/artifacts/transcription
```

The external list is paginated (`page`/`per_page`, cap 100; follow response `Link` pagination) and uses the Kapso configuration UUID filter, not a Meta phone ID. Match returned `call_id` to your target and use its `id` for detail. It does not accept the proxy's `call_id`/`since` filters. Neither this list nor proxy list/exact lookup exposes artifacts; do not fetch media while rendering a growing list. No SDK artifact wrapper is promised.

Detail adds `data.artifacts.recording` and `.transcription`. Each has `state`; notified artifacts also have `media_id`, `mime_type`, `sha256`, `received_at`, and `expires_at`. Only `available` includes a protected relative `fetch_path`.

- `absent` means no notification received, not disabled or processing.
- `available` means metadata received within the estimated retention window; download can still fail.
- `expired` retains metadata but has no fetch path or retained media content.

Recording fetch returns native audio, inline by default; append `?download=true` for an attachment. Maximum size is **32 MiB**; HTTP Range is not supported. Transcription fetch returns a readable JSON **`data` envelope** with `state: "available" | "empty"`, `text`, `language`, `duration`, `segments`, and `truncated`. Seconds are used for duration/segment times. Render text as plain text. The preview caps text at **100,000 characters**, segments at **500**, and aggregate segment text at **100,000 characters**, omitting word arrays/extra provider fields. `truncated` identifies shortened previews; valid empty text does not trigger retranscription.

Transcription `?download=true` exports the **original provider JSON bytes**, including metadata/word detail, rather than the shortened preview. Both preview input and original export are capped at **2 MiB**. Authorization is checked on every request; caller media IDs, credentials, or URLs cannot override the saved owner.

Meta documents **seven-day media retention and five-minute URLs**. Kapso estimates expiry conservatively from the earlier positive event timestamp or first receipt time, plus seven days; invalid timestamps use receipt time. Media can disappear earlier. Do not persist the webhook URL or follow its redirects. Kapso resolves the stored media ID to a current URL with the owning phone credential, checks the official HTTPS attachment host/path, rejects redirects, and validates MIME, size, and SHA-256. Artifact responses are private/no-store. A durable archive requires a separately scoped storage integration.

Fetch failures are per request, not new saved metadata states: 404 `artifact_unavailable`, 410 `artifact_expired`, 502 `artifact_download_failed`, 413 `artifact_too_large`, and 422 `artifact_invalid_transcript`. Check HTTP status and the `error.code`/`artifact.state` response; do not treat an availability notification as successful retrieval or log upstream URLs/bodies.

For an authorized live artifact test, confirm audible announcement, actual two-way audio and termination, signed completion events, saved detail, recording download/playback, transcript preview, and original JSON export. Native handset artifact download/playback has not been established by the merged source or prior ordinary Calling tests. Settings/routing changes and live calls need the user's authorization for that scope.

## Price layers — evidence dated 2026-10-06

Meta facts here come from primary documentation captured on 2026-10-06, not a new successful fetch. Recheck current terms before quoting a customer price:

- [Meta Calling pricing](https://developers.facebook.com/documentation/business-messaging/whatsapp/calling/pricing/): user-initiated calls are free; business-initiated calls depend on destination country and monthly volume, billed in six-second pulses. Permission-request messaging is a separate message cost.
- [Native recording](https://developers.facebook.com/documentation/business-messaging/whatsapp/calling/call-recording/) and [transcription](https://developers.facebook.com/documentation/business-messaging/whatsapp/calling/call-transcription/) are currently free on top of ordinary call rates. Meta plans separate future pricing; date/rates are unspecified.
- Kapso's existing managed Calling passes Meta cost through with **no markup**, settled as aggregate USD usage, conditional on eligible USD WABAs and configured billing/subscription readiness. Hosted outbound calls check billing health/balance; customer-paid WABAs use the customer's Meta payment method. External infrastructure has a different control boundary. See [managed Calling billing](https://docs.kapso.ai/docs/platform/tech-providers/billing#whatsapp-calling). Custom contract terms have not been verified; do not infer them from a plan label or the messaging fee table.
- Third-party hosting, voice-agent/LLM services, storage, and extra transcription are separate costs. Use current [Pipecat Cloud pricing](https://www.daily.co/pricing/pipecat-cloud/) and [ElevenLabs Agents pricing](https://elevenlabs.io/pricing/agents) for the chosen provider/plan rather than hardcoded rates. Viewing existing native artifacts introduces no new Kapso pricing policy.
