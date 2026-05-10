# ADR-0017: WebSocket Authentication Strategy

**Status:** Accepted  
**Date:** 2026-05-10  
**Deciders:** Engineering

---

## Context

The Discuss module uses WebSockets for real-time messaging, but the current WS server in `api/src/index.ts` does not authenticate the connection. Inbound messages from the socket are also not injected into the Zustand `discussStore` on the frontend, breaking real-time delivery. Additionally, future modules (Planning, Sign status updates) will need authenticated WebSocket connections.

WebSocket connections cannot carry HTTP `Authorization` headers after the initial handshake upgrade, so the standard `requireAuth` Express middleware does not apply.

## Decision

### Server-side: JWT in handshake query parameter

At connection time the client passes the access JWT as a query parameter on the WS URL:

```
wss://api.example.com/ws?token=<jwt>
```

The WS server verifies the token synchronously using the same secret as the HTTP auth middleware (`JWT_SECRET`). If verification fails, the socket is immediately closed with code `4401`.

A server-side session map tracks active sockets:

```typescript
// api/src/core/ws/sessionMap.ts
const sessions = new Map<string, WebSocket>();  // userId → ws
```

This enables server-initiated pushes (e.g. new message notification, SLA breach alert) to a specific user.

### Client-side: inject into store on message

The frontend `discussStore` (and future stores) subscribe to `ws://` messages on mount and dispatch to the relevant Zustand action:

```typescript
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.type === 'new_message') discussStore.getState().receiveMessage(msg.payload);
};
```

### Token refresh

The WS connection uses the same JWT lifetime as the HTTP session. On token refresh, the client closes and reopens the WS connection with the new token. No in-band token refresh is implemented on the socket itself.

## Consequences

- **Positive:** Authentication is consistent with the HTTP layer. Server-initiated pushes are possible. No additional auth infrastructure needed.
- **Negative:** JWT in URL query string appears in server logs. Mitigated by ensuring logs redact the `token` parameter and the JWT has a short expiry (15 minutes).
- **Risk:** If the session map grows unbounded (many long-lived connections), memory usage increases. Mitigated by pruning entries on `ws.close`.
