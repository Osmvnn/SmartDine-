# SmartDine: Project Organization and Development Roadmap

Updated: 2026-11-10
Status: Implementation in progress; see the progress notes for delivered work.

## Implementation progress

2026-11-10: Supabase PostgreSQL is active through Express. The hosted schema has a verified migration baseline and a one-active-session constraint. PostgreSQL checks cover stock contention, payments, refunds, receipts, push subscriptions, rewards, staff writes, and table departure. Order creation locks stock and aggregates repeated lines and reward demand. Ordering and session closure serialize on the table row. A complete interactive browser pass, persistent idempotency, and real online payments remain open.

2026-10-10: The first critical-security batch adds customer-only registration, current-account authentication, resource ownership checks, payment verification boundaries, authorized socket rooms, and related frontend updates. See [security changes and rollout notes](docs/SECURITY_CHANGES.md) for the exact scope and remaining validation. The phase checklists below remain the broader roadmap; this batch does not complete all foundation work.

## Purpose

Prepare the existing restaurant system for substantial improvements by securing its core workflows, organizing the code, and establishing a reliable development process. Refactor incrementally while preserving working behavior, then build new features on the improved foundation.

Keep Vue 3, Pinia, Vite, Bootstrap, Express, PostgreSQL, and Socket.IO. MySQL remains a legacy local option. A framework rewrite or microservice architecture is not required for this plan.

## Current system

- Customers access tables through QR codes, browse the menu, customize items, place orders, arrange payments, track preparation, and use reservations and loyalty rewards.
- Kitchen staff prepare orders; waiters manage tables and service requests; cashiers verify collected payments.
- Administrators and managers maintain menus, users, tables, inventory, promotions, shifts, and reports.
- The backend uses routes, controllers, middleware, and a small services layer. Much business logic and SQL currently live inside controllers.
- The frontend uses role-specific pages, a shared layout, Pinia stores, and a shared Axios client. Several pages combine substantial UI and workflow logic.
- The database is initialized through SQL scripts rather than a versioned migration process.

Review baseline: the frontend production build and syntax checks for 45 backend JavaScript files passed. No automated test suite was found. Findings came from source inspection; live database and browser workflows still need validation.

## Working principles

1. Fix critical access-control and data-integrity issues alongside foundation work.
2. Add focused behavior tests before changing sensitive workflows.
3. Make small, reviewable changes with explicit completion criteria.
4. Preserve existing API contracts during structural refactoring where practical. Document intentional behavior changes separately.
5. Keep business rules on the server. Frontend checks improve usability but do not provide authorization or guarantee correctness.
6. Avoid reorganizing every file at once. Move code as its workflow is improved.
7. Keep demo payment behavior explicitly separated from real payment processing.

## Target project organization

The following is a proposed structure, not a description of directories already present. Existing role-based page folders can remain.

```text
smart_resturant/
  README.md
  DEVELOPMENT_ROADMAP.md
  docs/
    architecture.md           # System boundaries and module responsibilities
    workflows.md              # Orders, payments, tables, reservations, loyalty
    api.md                    # Endpoint contracts and access requirements
    development.md            # Setup, commands, tests, demo environment
    operations.md             # Deployment, migrations, backup and recovery
    decisions/                # Short records of significant design decisions
  backend/
    database/
      migrations/             # Ordered, tracked schema changes
      seeds/                  # Explicit development/demo data
      schema.sql              # Fresh-install reference; not an upgrade mechanism
    src/
      config/                 # Validated environment and shared configuration
      routes/                 # URLs, middleware, and controller wiring
      controllers/            # HTTP input/output and service orchestration
      validators/             # Request schemas and reusable validation rules
      services/               # Business rules and transaction boundaries
      repositories/           # SQL access where extraction improves clarity
      middleware/             # Authentication, authorization, errors, auditing
      realtime/               # Socket authentication, rooms, event publication
      integrations/           # Payment provider and other external adapters
    tests/
      unit/
      integration/
  frontend/
    src/
      pages/                  # Route-level views, grouped by role
      components/
        ui/                   # Shared buttons, dialogs, fields, status badges
        orders/
        payments/
        tables/
      composables/            # Reusable Vue state and workflow behavior
      services/               # Shared HTTP client and domain API methods
      store/                  # Cross-page application state
      router/                 # Lazy-loaded routes and navigation guards
      utils/                  # Pure formatting and calculation helpers
      assets/                 # Shared styles and assets
    tests/
      unit/
  tests/
    e2e/                      # Customer and staff journeys across the system
```

Do not create empty layers simply to match the diagram. Introduce repositories, composables, and domain components when real code needs them. Keep existing `store/` naming unless there is a concrete reason to change it.

## Phase 1: Baseline and essential protection

### 1.1 Record expected behavior

- [ ] Document the current order lifecycle: pending, confirmed, preparing, ready, served, completed, and cancelled.
- [ ] Record who can perform each action, including customer ownership and waiter table assignments.
- [ ] Document prepayment, payment after eating, split payments, cancellations, refunds, and loyalty timing.
- [ ] Identify intended behavior separately from existing defects.
- [ ] Prepare an isolated test database and deterministic test fixtures. Never run destructive setup against an existing restaurant database.

### 1.2 Correct authorization

- [ ] Force public registration to create customer accounts. Ignore or reject supplied staff roles.
- [ ] Restrict staff account creation and role changes to authorized administrative actions.
- [ ] Require customer ownership, an authorized guest session, or appropriate staff access for orders, receipts, payments, and cancellation.
- [ ] Define a guest-session credential with sufficient randomness, expiry, and table/session scope. A numeric table ID or public QR identifier alone must not authorize sensitive actions.
- [ ] Authenticate socket connections and authorize rooms on the server; remove arbitrary client-selected role-room membership.
- [ ] Publish customer events only to authorized customer/session rooms instead of broadcasting all order updates globally.
- [ ] Define how account deactivation and role changes invalidate existing access.
- [ ] Use an explicit allowed-origin configuration for HTTP and sockets.

### 1.3 Establish regression coverage

- [ ] Test public registration with a requested administrative role.
- [ ] Test cross-customer order access and cancellation, staff permissions, and unauthorized socket room access.
- [ ] Test valid and invalid order quantities and unavailable items.
- [ ] Capture payment and cancellation defects as failing regression tests before fixing them.

Completion criteria: documented access rules, passing tests for the protected boundaries, and an isolated repeatable test setup. Structural cleanup must not delay the critical authorization fixes.

## Phase 2: Backend and database foundation

### 2.1 Validation and error handling

- [ ] Centralize validation for positive integer quantities, IDs, allowed statuses, payment methods, dates, and bounded text fields.
- [ ] Validate modifiers against the selected item and reject invalid combinations explicitly.
- [ ] Return consistent API error codes and messages, distinguishing validation, authorization, conflict, and internal failures.
- [ ] Add centralized error middleware and structured logging with request identifiers.
- [ ] Keep database errors and internal implementation details out of public responses.
- [ ] Validate required environment configuration at startup and document variables without committing secrets.
- [ ] Use safe integer minor units or a consistent decimal strategy for money calculations and deterministic rounding.

### 2.2 Extract business services

- [ ] Extract order creation, cancellation, and transitions into order services.
- [ ] Extract payment collection, allocation, confirmation, and refunds into payment services.
- [ ] Extract loyalty earning/redemption and stock reservation/release into services rather than importing controller functions.
- [ ] Keep controllers responsible for validated requests and HTTP responses.
- [ ] Pass a single database connection through all operations belonging to a transaction.
- [ ] Release connections reliably, including on validation failures and exceptions.
- [ ] Remove duplicated authentication helpers once behavior is covered by tests.

### 2.3 Enforce workflow consistency

- [ ] Use row locking or conditional atomic updates to prevent overselling under simultaneous requests.
- [ ] Aggregate stock demand across repeated lines for the same item, including different modifiers and rewards.
- [ ] Prevent concurrent requests from opening multiple active sessions for the same table.
- [ ] Make order transitions concurrency-safe and record history within the same transaction.
- [ ] Make cancellation atomic across status, stock, discounts, and loyalty adjustments.
- [ ] Add idempotency to order submission and payment operations so retries do not create duplicates.
- [ ] Calculate outstanding balances before marking an order financially settled or allowing session closure.
- [ ] Keep food preparation status separate from payment state; explicitly define when an order becomes completed.
- [ ] Award loyalty at the agreed settlement milestone, with defined reversal rules for cancellations and refunds.
- [ ] Publish events only after a successful commit. Add durable event delivery if operational requirements justify it.

### 2.4 Introduce safe database changes

- [ ] Add a migration runner and migration-history tracking.
- [ ] Establish a baseline process for existing databases without recreating or erasing their tables.
- [ ] Separate fresh-install setup, migrations, and demo seed commands.
- [ ] Add constraints and indexes based on the access patterns and invariants established above.
- [ ] Review historical menu-item snapshots so old orders and receipts remain accurate after menu edits.
- [ ] Document backup, restore, deployment sequencing, and recovery for failed migrations.
- [ ] Reconcile the schema script and SQL dump into one documented schema source of truth; inspect the dump before deciding its retention or removal.

Completion criteria: focused services own the core business rules; concurrent stock and payment tests pass; migrations work for both a fresh test database and an existing baseline; failures leave no partial transaction state.

## Phase 3: Frontend organization and development tooling

### 3.1 Break down large views

- [ ] Refactor checkout into order summary, payment selection, tip controls, loyalty controls, split configuration, and result components.
- [ ] Extract reusable order cards, item rows, status indicators, and table summaries from staff pages.
- [ ] Move reusable data loading, socket subscriptions, and submission handling into focused composables.
- [ ] Keep shared state in Pinia and local presentation state inside components/composables.
- [ ] Define cart behavior when switching tables, closing a session, logging out, or restoring old local storage.

### 3.2 Standardize frontend behavior

- [ ] Introduce domain API methods around the shared Axios client.
- [ ] Standardize loading, empty, error, retry, and expired-login states.
- [ ] Preserve recoverable customer input when requests fail.
- [ ] Prevent accidental repeated submissions, while relying on backend idempotency for correctness.
- [ ] Resynchronize server state after socket reconnection and clean up listeners when views unmount.
- [ ] Lazy-load route pages by role and feature.
- [ ] Consolidate shared spacing, colors, typography, form controls, and status styles.
- [ ] Use keyboard-accessible controls, labels, focus management, and readable contrast.
- [ ] Centralize currency and date presentation; document the difference between display conversion and settlement currency.

### 3.3 Make checks repeatable

- [ ] Provide clear root commands for development, build, lint, tests, and migrations.
- [ ] Make the root build command build the application; it currently installs backend dependencies only.
- [ ] Add formatting and linting with limited, reviewable initial changes.
- [ ] Run build, lint, and relevant tests in continuous integration.
- [ ] Keep documentation aligned with actual setup commands and supported runtime versions.

Completion criteria: the main customer and staff journeys retain expected behavior, the largest touched views are decomposed, routes load on demand, and repeatable checks run locally and in CI.

## Phase 4: Table sessions and billing development

This is the recommended first major product phase because kitchen, waiter, cashier, and customer experiences all depend on it.

- [ ] Model a dining session containing multiple guests, orders, and payments.
- [ ] Support both individual orders and an aggregated table bill with explicit access rules.
- [ ] Track subtotal, discounts, applicable configured charges, tips, refunds, collected funds, and outstanding balance separately.
- [ ] Define equal, custom-amount, and item-based splits, including deterministic rounding and ownership rules.
- [ ] Support settling only a guest's share without completing unpaid portions of the session.
- [ ] Define transfer, merge, cancellation, and correction behavior before implementing those actions.
- [ ] Introduce a table lifecycle that includes cleaning before availability.
- [ ] Produce receipts from stored transaction facts, with clear partial-payment and refund information.
- [ ] Replace simulated online payment success with a selected provider integration when real payments are required. Verify provider events, handle duplicate/out-of-order events, and reconcile failures.

Completion criteria: multiple guests can order and pay independently; totals reconcile; partial payments remain visible; repeated requests are safe; a table cannot close with an unresolved balance unless an explicitly authorized exception is recorded.

## Phase 5: Customer and staff experience

### Customer

- [ ] Simplify mobile checkout with a clear total and primary action; progressively reveal optional controls.
- [ ] Make table identity, cart ownership, payment state, and order progress clear.
- [ ] Improve item customization and explicit dietary/allergen information where restaurant data supports it.
- [ ] Add useful recovery for interrupted connections without implying an unconfirmed order was submitted.

### Waiter and cashier

- [ ] Add a visual floor view showing table status, service requests, ready dishes, and outstanding balances.
- [ ] Prioritize urgent actions and show request age.
- [ ] Make collection, cashier verification, payment corrections, and refunds distinct actions.
- [ ] Provide a shift reconciliation view for collected payments and discrepancies.

### Kitchen

- [ ] Add station-based queues if the restaurant needs separate preparation areas.
- [ ] Highlight overdue tickets and item-specific notes.
- [ ] Preserve independent item progress; starting one item should not unintentionally start all other items.
- [ ] Confirm behavior for partial readiness, handoff, and correction of accidental actions.

### Reservations

- [ ] Validate party size, opening hours, reservation duration, and table capacity on the server.
- [ ] Prevent concurrent overlapping bookings and define walk-in, cancellation, and no-show behavior.

Completion criteria: agreed customer and staff journeys pass browser tests, and the revised screens are checked at phone, tablet, and desktop sizes.

## Phase 6: Inventory, reporting, and operations

### Inventory

- [ ] Connect menu items to ingredient recipes and units.
- [ ] Record stock movements for receiving, usage, waste, returns, and manual adjustments.
- [ ] Define when ingredients are reserved versus consumed, and how cancellation affects stock.
- [ ] Calculate dish cost and stock alerts from the linked inventory model.

### Reporting

- [ ] Separate ordered sales value from actual payment collections and outstanding balances.
- [ ] Account for split payments, discounts, modifiers, tips, cancellations, and refunds consistently.
- [ ] Attribute staff activity historically rather than relying only on current table assignments.
- [ ] Use explicit restaurant timezone and reporting-period boundaries.
- [ ] Test displayed reports and exports against known transaction fixtures.

### Operations and settings

- [ ] Centralize restaurant identity, currency, timezone, opening hours, branding, and receipt settings.
- [ ] Add health/readiness checks, operational error monitoring, and useful audit records.
- [ ] Validate backup restoration and document deployment/recovery steps.
- [ ] Define persistent storage for uploaded assets and a retention policy for logs and historical data.

Completion criteria: inventory movements are explainable, reports reconcile to payment records, and deployment and recovery procedures are documented and tested in a safe environment.

## Minimum verification matrix

| Area | Required scenarios |
|---|---|
| Authentication | Customer registration cannot grant staff access; disabled accounts lose access according to the defined policy. |
| Authorization | Cross-customer access fails; guest scope is enforced; staff actions respect role and assignment rules. |
| Orders | Invalid quantities are rejected; duplicate submission is safe; simultaneous requests cannot oversell. |
| Sessions | Concurrent ordering opens one active session; changing tables cannot silently reuse the wrong cart/session. |
| Payments | Partial splits remain outstanding; duplicate confirmation is safe; payment failure does not become success. |
| Cancellation | Stock and loyalty are adjusted once; partial failures roll back. |
| Realtime | Unauthorized rooms are rejected; reconnect restores accurate state; events follow committed changes. |
| Database | Fresh setup and baseline upgrade succeed; existing data survives; restore procedure works. |
| Reporting | Collections, refunds, tips, and outstanding balances match known fixtures. |
| User journeys | QR ordering through serving and settlement; waiter requests; reservations; staff collection and refund flows. |

## Suggested implementation batches

1. Baseline documentation, isolated test setup, and public registration fix.
2. Resource authorization, guest-session scope, and socket security.
3. Shared validation, consistent errors, and core regression coverage.
4. Migration baseline and safe database upgrade workflow.
5. Order/payment service extraction with concurrency and idempotency fixes.
6. Checkout and staff component extraction, API handling, and lazy routes.
7. Unified session billing and table lifecycle.
8. Customer, waiter, cashier, kitchen, and reservation improvements.
9. Recipe inventory, reconciled reports, and operational readiness.

These batches are ordered by dependency, not estimated calendar duration. Estimate each batch after its acceptance criteria and product decisions are settled. Foundation work can proceed without waiting for every later feature decision.

## Product decisions to settle before dependent development

| Decision | Why it matters |
|---|---|
| Demo system or real restaurant operation? | Determines payment integration, reconciliation, and operational requirements. |
| Single location or multiple locations? | Affects data ownership, staff permissions, configuration, and reporting. |
| Guest ordering, account-required ordering, or both? | Determines session credentials and customer ownership rules. |
| When may preparation start and when is an order completed? | Defines the relationship between food status, payment, and table closure. |
| Individual bills, shared table bills, and supported split modes? | Determines allocation rules and customer/staff interfaces. |
| Settlement currency and restaurant timezone? | Determines stored amounts, display rules, receipts, and report boundaries. |
| Loyalty earning and refund policy? | Determines ledger updates and reversals. |
| Ingredient tracking or simple item stock? | Determines the inventory model and migration scope. |

## Definition of done for each batch

- The intended behavior and access rules are documented.
- Relevant regression tests and the production build pass.
- Schema changes have a tested migration and recovery procedure.
- Changed customer/staff journeys are verified at appropriate screen sizes.
- Errors and interrupted requests leave understandable, recoverable states.
- API, setup, and workflow documentation reflect the delivered behavior.
- The change contains no unrelated broad rewrites or formatting churn.
- Completed checklist items are marked only after verification; remaining limitations are recorded.
