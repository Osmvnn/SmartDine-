# Critical security changes

Implemented: 2026-10-10. This document describes the first security implementation batch from `DEVELOPMENT_ROADMAP.md`.

## Authentication and roles

- Public registration always creates a customer, regardless of a submitted `role`.
- Staff creation remains behind the existing administrator-only user endpoint.
- Every authenticated HTTP request verifies the JWT and loads the current user from the database. Deleted/disabled accounts and tokens whose role no longer matches the account are rejected.
- Optional authentication permits an absent token, but rejects an invalid supplied token instead of silently treating it as anonymous.
- Existing security-event logging is retained for authentication and role failures.

## Resource access

| Resource/action | Access policy |
|---|---|
| Public menu, QR table overview, reservation availability | Public; QR responses no longer expose session tokens. |
| Create order | Signed-in customer with matching table QR header, or staff with table access; waiters must be assigned to the table. |
| Read order | Owning customer; admin, manager, kitchen, cashier; assigned waiter. |
| Table/session order history | Staff only; waiters restricted to assigned tables. |
| Cancel order | Owning customer, admin, manager, assigned waiter; only pending/confirmed orders, with no currently paid payment. |
| Rate order | Owning customer only; existing served/completed checks also apply. |
| Read/arrange payment and download receipt | Owning customer, admin, manager, cashier, assigned waiter. Kitchen has no access through these payment/receipt endpoints. |
| Confirm physical collection | Assigned waiter records collection; cashier/admin verifies it. Only pending pay-later payments qualify. |
| Record refund | Cashier, admin, manager. Only collected pay-later funds, explicit demo transactions, or zero-value payments qualify. |
| Reservation list | Admin/manager; customers retain their own reservation endpoint. Public reservation creation remains available. |
| Loyalty | Account identity comes from authentication; supplied user/session IDs are ignored. |
| Push subscriptions | Signed-in account only; supplied user/session ownership is ignored. Existing subscriptions owned by another account cannot be overwritten or removed. |
| Table status, closure, waiter request handling | Authorized staff; waiter assignment is checked. Customer “done” requires an order in the active session. |
| Favorites | Existing table-scoped behavior is retained, with authenticated table/QR access checks. The legacy API parameter named `session_id` currently represents a table ID here. |

Customer ordering follows the existing sign-in UI. Anonymous ordering is no longer accepted by the API. Accountless guest sessions require a separate design and are not introduced in this batch.

`X-Table-Token` supplies table context for customer order creation, service requests, and favorites. The frontend sends the saved cart QR token. A static QR code is not proof of physical presence and never grants access to another customer's orders, receipts, payments, or loyalty. Random, expiring guest credentials remain future work.

## Payment verification boundary

No real online payment provider is integrated.

- Pay-later is the default supported checkout flow. Choosing card/mobile for pay-later records a collection method; it does not charge that method.
- Online/prepaid requests for a positive amount fail with HTTP 409 unless development-only demo mode is explicitly enabled.
- A client cannot supply `status`, `transaction_id`, or `cashier_confirmed` as verification evidence. This also applies to split entries.
- No-charge orders are confirmed without a provider based on the server-calculated total.
- Payment arrangement locks the order and payment rows, validates totals, and commits all shares together. Submitted arrangements cannot overwrite collected funds or be silently submitted again.
- Waiter collection and cashier verification are distinct. One paid share does not complete an order with an outstanding balance.
- Generic status updates cannot confirm unpaid orders instead of going through payment arrangement, or complete orders with an outstanding balance.
- Cancellation is transactional. Pending payments become failed; cancellation does not assert that money was refunded. Paid orders must have their collected payments refunded by staff first.
- Refund recording does not move funds. Staff must return funds separately before using the action. Existing online payment records cannot be treated as verified provider refunds.
- Loyalty is awarded only after full settlement, inside the payment transaction. Refunds remove earned points for that order; cancellation removes its loyalty entries, including restoring redeemed points. Historical loyalty data requires separate review.

### Configuration

Normal operation:

```dotenv
ALLOW_DEMO_PAYMENTS=false
ALLOWED_ORIGINS=http://localhost:5173
```

For isolated local payment demonstrations only, both settings are required:

```dotenv
NODE_ENV=development
ALLOW_DEMO_PAYMENTS=true
```

Production mode never accepts demo payments, even if the demo flag is accidentally enabled. Use a separate demo database. Demo transactions have a `DEMO_` prefix and the frontend labels the option as a simulation. `/api/payments/capabilities` supplies the UI capability flags; the server enforces the boundary independently of the UI.

HTTP and Socket.IO use the same comma-separated `ALLOWED_ORIGINS` configuration. Configure deployed frontend origins explicitly. No wildcard credentialed HTTP CORS policy remains.

## Socket authorization

- The handshake requires `auth.token` and verifies the current active account.
- The server assigns `user-<id>` and the account's staff-role room, when applicable.
- Client join requests can only select those authorized rooms. A customer cannot join a staff room or another user's room.
- Order status, item status, payment confirmation, and refund updates target the owning customer and relevant staff instead of all connected clients.
- Staff-role operational announcements remain role-wide. Detailed waiter HTTP actions still enforce table assignment.
- Active connections are revalidated on joins and every 15 seconds, and disconnected at token expiry. Account changes can therefore take up to 15 seconds to disconnect an idle socket.
- The frontend provides its current JWT on reconnect and reconnects when account credentials change.
- Push order readiness is sent to the owning account rather than anyone who supplied a table-session ID.

## Frontend compatibility

- Customer routes require sign-in; QR navigation preserves the table through the customer login route.
- Receipt buttons fetch authenticated PDF blobs instead of navigating to public receipt URLs. Old direct receipt links now require authentication headers.
- Checkout and waiter ordering no longer submit payment status claims.
- Pay-now simulation is shown only when the server permits demo payments. Real pay-later remains available by default.
- No-charge success messages and manual-refund labels describe what actually occurred.

## Verification

Install backend and frontend dependencies before running the tests; socket integration tests reuse the existing frontend Socket.IO client dependency.

```powershell
npm.cmd test --prefix backend
npm.cmd run build --prefix frontend
```

The test suite exercises actual Express routes and actual local Socket.IO connections with a deterministic in-memory database adapter. It does not connect to, seed, or modify a restaurant database. It covers authentication, ownership, waiter assignment, payment boundaries, split settlement, rollback on injected failure, loyalty identity, push identity, and socket isolation.

These tests do not validate MySQL SQL execution, lock contention across real connections, or browser interactions. Before deployment, verify against an isolated MySQL database and walk through customer ordering, waiter collection, cashier settlement, receipts, refunds, and reconnect behavior in a browser.

## Existing installation rollout

No schema migration or automatic database cleanup is included. Existing `.env` secrets and restaurant data have not been modified.

1. Configure the frontend origin list and leave demo payments disabled for real operation.
2. Review existing staff/admin accounts: the old public registration endpoint could create them. Do not assume existing privileged accounts are legitimate.
3. Rotate the deployment JWT secret and require users to sign in again when rolling out the security fix. Review/change any demo staff credentials still in use.
4. Reconcile historical simulated online payments, loyalty points earned before settlement, and anonymous orders. Old unowned orders are staff-accessible only; do not assign them to customers by guessing ownership.
5. Existing accountless push subscriptions cannot be claimed automatically by a different account. Re-enroll notifications where needed after reviewing/removing obsolete subscriptions through an administrative maintenance process.
6. Build and deploy the backend and frontend together because authentication and payment contracts changed.

## Remaining work

- Integrate a real payment provider with verified webhooks, provider-side refunds, and reconciliation before enabling actual online payments.
- Add persistent idempotency keys and customer-friendly recovery for a lost response after a committed order/payment operation. Current repeat arrangements are rejected, not replayed.
- Test real MySQL concurrency and complete the wider stock, session, loyalty-redemption, and order-transition consistency work from the roadmap.
- Introduce an explicit guest-session model if accountless ordering is required.
- Complete the full browser and deployment validation described above.
