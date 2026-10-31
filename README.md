# Zahln Till

The mensa till for tablets: ring up an order from the menu, show its QR code, see the payment arrive, and refund a payment in full or in part.

Part of the Zahln Mensa take-home, together with [zahln-student](../zahln-student) and [zahln-dashboard](../zahln-dashboard). The design document is in [DESIGN.md](DESIGN.md).

## Run it

Requirements: Node 22, Android Studio with a tablet or phone emulator (the app runs in landscape), Xcode for iPad.

```bash
npm install
cp .env.example .env   # API base URL and candidate id
npm run android
npm run ios
```

Pick a cashier on the first screen. Each cashier works at one till and sees that mensa's menu.

## Test

```bash
npm test               # Vitest: cart, order and refund intents, menu cache, refund errors, order status
npm run typecheck
npm run e2e            # Maestro against the running dev build and the live mock
```

## What is built

- Menu grid with prices for all three groups, a cart with totals per price group.
- Order creation with an idempotency key that survives a lost response; the QR shows no price, because the price depends on who scans.
- A till restarted while showing a QR opens straight on that order from its last saved state, and the menu opens from the last saved copy while a fresh one loads. Switching cashier forgets the open order; another till's order is never shown.
- The QR screen says when the connection is lost ("do not hand out food yet"), when a payment was declined, and when the order is no longer visible to this till.
- Live status from the server: waiting, customer paying, paid (with the amount and price group that was paid), expired. Only the server ends an order, so a payment made in the last second is never missed.
- `plugins/with-network-recovery.js`: after the till loses its network, polling resumes as soon as it is back.
- Payments at this till with search, and refunds in full or in part. Each refusal from the server has its own message; "Refunded" only appears when the refund is completed.
- English by default, German from the language button.

## Left out, and why

- **One monorepo.** See DESIGN.md §1.
- **Cancelling an order.** The API has no cancel, so the till keeps the cashier on the QR until the server ends the order (paid or expired, at most five minutes). DESIGN.md §6.
- **Crash reporting and CI.** Described in DESIGN.md §3.

## Libraries

Expo SDK 58 with Expo Router, TanStack Query, Zustand, react-native-mmkv for order and refund intents, react-native-qrcode-svg for the QR code, expo-crypto for idempotency keys, Vitest and Maestro.

## Tools

I made the architecture and design decisions. Claude Code was used as a coding assistant during implementation. All flows were tested on an Android emulator against the mock API.

## Test logins

All passwords are `test1234`: `cashier-campus-1`, `cashier-campus-2`, `cashier-campus-3`, `cashier-nord-1`, `cashier-nord-2`, `cashier-bibliothek-1`.
