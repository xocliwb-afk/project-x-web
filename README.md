# Project X – White Label Real Estate Search

## API base URLs in local development
- Default local dev: leave `NEXT_PUBLIC_API_BASE_URL` unset so the web app calls `/api` through the Next.js proxy to the API on `http://localhost:3002`.
- LAN testing: set `NEXT_PUBLIC_API_BASE_URL=http://<LAN_IP>:3002` intentionally in `apps/web/.env.local` when you need devices on the same network to hit your machine.
