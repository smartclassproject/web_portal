# Login Failure Fix (Web -> Backend Connectivity)

## Issue

Users could not log in because frontend login requests were not reaching backend due to protocol mismatch.

## Root Cause

`web/.env` was configured with:

- `VITE_BACKEND_URL=https://41.186.188.119:5000`

The backend endpoint on `:5000` is served over HTTP, not HTTPS.  
Using `https://` caused browser SSL failure (`ERR_SSL_PROTOCOL_ERROR`) before credentials reached backend.

## Solution Applied

Updated `web/.env` to use server HTTP endpoint:

- `VITE_BACKEND_URL=http://41.186.188.119:5000`

and kept localhost as commented fallback.

## Verification

- Reproduced failure using Playwright before fix (`ERR_SSL_PROTOCOL_ERROR` on `/api/auth/login`).
- Re-tested after fix with Playwright: request reached backend at `http://41.186.188.119:5000/api/auth/login`.
- Playwright network trace showed backend response (`401`) with no network failure, proving connectivity was restored.

## Notes

- A `401` can still occur if email/password is incorrect or account does not exist; this is separate from connectivity.
- If server does not expose a valid TLS cert on `:5000`, do not use `https://` for that endpoint.
