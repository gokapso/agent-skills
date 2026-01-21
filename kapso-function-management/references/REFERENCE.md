# Function Runtime Contract

## Handler signature

Functions must start with:

```
async function handler(request, env) {
```

Do not use `export` or arrow functions. Return a `Response` object.

## Runtime APIs

- `request`: Fetch API Request; use `await request.json()` for JSON.
- `env.DB`: D1 database access (if enabled for the project).
- `env.KV`: KV storage with `.get(key)` and `.put(key, value)`.
- `env.SECRET_NAME`: Secrets configured in the function settings.

## Typical workflow

1. Create function with `code` that follows the contract.
2. Deploy the function (required before use).
3. Use the returned `function_url` for webhook destinations.
