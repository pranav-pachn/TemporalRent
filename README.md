# TemporalRent

> **Conflict-free inventory planning for event rental businesses.**\
> **Know what you can safely promise before you promise it.**

TemporalRent is a temporal inventory reservation platform designed for
small and mid-sized event decorators and rental businesses.

It solves a deceptively difficult operational problem:

> **Given a proposed event, can the business fulfill every physical
> inventory requirement for the entire period those items are actually
> unavailable?**

Unlike a typical booking CRUD application, TemporalRent models package
composition, inventory quantities, preparation/recovery buffers,
temporal overlaps, transactional reservations, concurrency, state
transitions, warehouse operations, and auditability.

------------------------------------------------------------------------

## Why TemporalRent?

Event decorators commonly manage reusable inventory with a mixture of
spreadsheets, calendars, WhatsApp messages, and memory.

A booking such as:

``` text
Premium Haldi Setup × 1
```

may actually consume:

``` text
Backdrop × 1
Urli × 4
Bajot × 6
VIP Sofa × 4
Carpet × 2
LED Par × 2
```

Two bookings can therefore appear valid individually while being
impossible to fulfill together.

TemporalRent makes the inventory relationship explicit and answers
availability using the **actual physical demand**, not just booking
labels.

### The core promise

``` text
Available → Confirm with a database-backed guarantee

Unavailable → Reject with an actionable explanation
```

For example:

``` text
Inventory conflict

VIP Sofa
Required: 12
Usable:   10
Shortage: 2

Conflict:
Sangeet Package — Nov 12, 7:00 PM
```

------------------------------------------------------------------------

## Core Engineering Problems

### 1. Package / BOM expansion

A package is not inventory.

TemporalRent expands:

``` text
Premium Haldi × 2
```

into its physical components:

``` text
Urli       × 8
VIP Sofa   × 8
Carpet     × 4
Bajot      × 12
```

Demand is aggregated by `inventory_item_id`, so direct item selections
and package components are combined correctly.

------------------------------------------------------------------------

### 2. Temporal availability

An item is not necessarily available immediately after an event ends.

Example:

``` text
Event:
Friday 7:00 PM → 11:30 PM

Buffer before:
2 hours

Buffer after:
12 hours
```

The effective inventory window becomes:

``` text
Friday 5:00 PM → Saturday 11:30 AM
```

A Saturday 9:00 AM booking therefore conflicts even though the two event
times do not overlap.

TemporalRent uses PostgreSQL timestamp ranges and overlap queries to
model this correctly.

------------------------------------------------------------------------

### 3. Quantity-aware conflicts

If:

``` text
Owned VIP Sofas = 10
Booking A       = 8
Booking B       = 4
```

the system must calculate:

``` text
Required = 12
Usable   = 10
Shortage = 2
```

This is fundamentally different from a simple "booked / not booked"
model.

------------------------------------------------------------------------

### 4. Concurrent reservation safety

Availability checks performed by the frontend are only advisory.

The final confirmation must happen inside a database transaction.

Example:

``` text
2 sofas available

Request A → reserves 2 → SUCCESS
Request B → reserves 2 → CONFLICT
```

Never:

``` text
Request A → SUCCESS
Request B → SUCCESS

Reserved = 4
Available = 2

OVERBOOKED ❌
```

The reservation engine therefore uses:

-   PostgreSQL transactions
-   row-level locking
-   deterministic lock ordering
-   availability re-checking inside the transaction
-   idempotency
-   audited state transitions

------------------------------------------------------------------------

## Product Scope

### MVP

#### Business and security

-   Multi-tenant business isolation
-   Authentication
-   Role-based authorization
-   Business timezone
-   Owner
-   Salesperson
-   Warehouse Manager

#### Inventory

-   Categories
-   Inventory items
-   Owned quantity
-   Damaged quantity
-   Missing quantity
-   Maintenance quantity
-   Buffer overrides
-   Usable inventory calculation

#### Packages

-   Packages
-   Immutable package versions
-   Bill of materials (BOM)
-   Package component quantities
-   Historical package snapshots

#### Bookings

-   Customers
-   Booking creation
-   Package lines
-   Direct inventory lines
-   Availability checking
-   Conflict explanations
-   Booking lifecycle

#### Reservation engine

-   Confirm
-   Cancel
-   Reschedule
-   Owner override with audited reason
-   Transactional reservation
-   Concurrency protection
-   Idempotent writes
-   `409 INVENTORY_CONFLICT` responses

#### Warehouse

-   Pick list
-   Dispatch
-   Return
-   Damage recording
-   Missing inventory recording
-   Audit trail

#### Frontend

-   Dashboard
-   Inventory
-   Packages
-   Calendar / timeline
-   Booking builder
-   Availability panel
-   Booking details
-   Warehouse workflow
-   Audit log
-   Settings

#### Verification

-   Unit tests
-   Integration tests
-   Concurrency tests
-   Authorization tests
-   End-to-end tests
-   Type checking
-   Linting
-   Production build validation

------------------------------------------------------------------------

## Explicit Non-Goals

TemporalRent is intentionally **not** an ERP or all-in-one business
platform.

The MVP does **not** include:

``` text
❌ AI/ML features
❌ AI chatbot
❌ AI forecasting
❌ Accounting
❌ GST invoicing
❌ Payroll
❌ CRM / sales pipeline
❌ Payment gateway
❌ Customer marketplace
❌ Route optimization
❌ WhatsApp automation
❌ Kafka
❌ Kubernetes
❌ Microservices
❌ Event sourcing
❌ Multi-warehouse inventory
❌ Nested packages
❌ Per-unit serialized inventory
❌ Customer-facing quote portal
```

These may be considered for later versions only after the core
reservation engine is proven.

------------------------------------------------------------------------

## V2 Roadmap

Potential future capabilities include:

-   Nested packages
-   Serialized high-value inventory
-   Multi-warehouse support
-   Manager role
-   Granular preparation / transport / setup / teardown / cleaning
    phases
-   Soft-hold reservations with TTL
-   Customer quote portal
-   SMS / WhatsApp notifications
-   Advanced reporting
-   Inventory forecasting
-   More detailed warehouse workflows

The core temporal reservation model should remain the foundation.

------------------------------------------------------------------------

# Architecture

TemporalRent deliberately uses a modular monolith rather than
microservices.

``` text
                    ┌──────────────────────┐
                    │       Next.js        │
                    │      Frontend        │
                    └──────────┬───────────┘
                               │
                            REST API
                               │
                    ┌──────────▼───────────┐
                    │    Node.js API       │
                    │      Express         │
                    │    TypeScript        │
                    └──────────┬───────────┘
                               │
                         Prisma + SQL
                               │
                    ┌──────────▼───────────┐
                    │     PostgreSQL       │
                    │                      │
                    │ Temporal Queries     │
                    │ Transactions         │
                    │ Constraints          │
                    │ Row Locks             │
                    └──────────────────────┘
```

### Architectural principle

Build from the data and correctness layer outward:

``` text
Database
   ↓
Domain / Reservation Engine
   ↓
API
   ↓
Automated Tests
   ↓
Frontend
```

The UI should never be responsible for enforcing inventory correctness.

------------------------------------------------------------------------

# Technology Stack

## Frontend

-   Next.js
-   TypeScript
-   Tailwind CSS
-   shadcn/ui
-   React Query
-   Date/time utilities

## Backend

-   Node.js
-   Express
-   TypeScript
-   Prisma
-   Zod
-   JWT authentication

## Database

-   PostgreSQL
-   PostgreSQL range types
-   GiST indexes
-   `btree_gist`
-   `pgcrypto`

## Testing

-   Vitest / Jest
-   PostgreSQL test database / Testcontainers
-   Playwright

## Infrastructure

-   Docker
-   GitHub Actions
-   Vercel
-   Render or Railway
-   Neon PostgreSQL

------------------------------------------------------------------------

# Domain Model

The central data model revolves around these concepts:

``` text
Business
 ├── Users
 ├── Categories
 ├── Inventory Items
 ├── Packages
 │    └── Package Versions
 │          └── BOM Components
 ├── Customers
 ├── Bookings
 │    ├── Booking Lines
 │    └── Inventory Demand
 ├── Warehouse Operations
 └── Audit Events
```

### Important design decision

A package is versioned.

For example:

``` text
Premium Haldi v1
    ↓
Booking #101
```

Later:

``` text
Premium Haldi v2
    ↓
New bookings
```

Booking #101 must continue referring to the original package definition.

This prevents catalog edits from silently changing historical bookings.

------------------------------------------------------------------------

# Availability Engine

Given:

``` text
inventory item
requested quantity
event start
event end
```

TemporalRent calculates:

``` text
1. Resolve buffer-before
2. Resolve buffer-after
3. Build effective time range
4. Find overlapping active demand
5. Calculate usable inventory
6. Calculate committed quantity
7. Calculate available quantity
8. Return conflicts and shortages
```

Conceptually:

``` text
effective_start = event_start - buffer_before
effective_end   = event_end + buffer_after

usable_pool =
    owned_qty
    - damaged_qty
    - missing_qty
    - maintenance_qty

available =
    usable_pool - overlapping_committed_quantity
```

The overlap query uses PostgreSQL range operations rather than scanning
every booking in application code.

------------------------------------------------------------------------

# Package Demand Aggregation

A booking can contain both packages and direct inventory items.

Example:

``` text
Booking
├── Premium Haldi × 1
└── VIP Sofa × 2
```

If the package itself contains:

``` text
VIP Sofa × 4
Urli × 4
Carpet × 2
```

the final demand becomes:

``` text
VIP Sofa = 6
Urli     = 4
Carpet   = 2
```

The reservation engine aggregates demand by physical inventory item
before checking availability.

------------------------------------------------------------------------

# Reservation Transaction

The critical operation is confirmation.

Conceptually:

``` text
BEGIN TRANSACTION

1. Load booking
2. Validate booking state
3. Expand package versions
4. Aggregate physical demand
5. Resolve effective ranges
6. Acquire item locks in deterministic order
7. Re-check availability
8. If shortage exists:
       ROLLBACK
       return 409 INVENTORY_CONFLICT
9. Persist inventory demand
10. Transition booking → CONFIRMED
11. Record audit event
12. Commit

COMMIT
```

### Why deterministic lock ordering?

Suppose two transactions need:

``` text
Item A
Item B
```

If one transaction locks:

``` text
A → B
```

and another locks:

``` text
B → A
```

they can deadlock.

TemporalRent therefore sorts inventory IDs before acquiring locks:

``` text
A → B
```

for every transaction.

------------------------------------------------------------------------

# Idempotency

Network failures can cause clients to retry a request.

For example:

``` text
POST /bookings/123/confirm

Server:
    confirms booking

Client:
    times out

Client:
    retries request
```

The second request must not create another reservation.

Confirmation therefore uses an idempotency mechanism so that the same
operation can safely be retried.

------------------------------------------------------------------------

# Booking State Machine

The MVP lifecycle is:

``` text
DRAFT
  │
  ▼
QUOTED
  │
  ▼
CONFIRMED
  │
  ▼
DISPATCHED
  │
  ▼
RETURNED
  │
  ▼
COMPLETED
```

Cancellation can occur from appropriate pre-completion states:

``` text
DRAFT ────────→ CANCELLED
QUOTED ───────→ CANCELLED
CONFIRMED ────→ CANCELLED
```

Invalid transitions are rejected by the backend.

The frontend should never be trusted to enforce the state machine.

------------------------------------------------------------------------

# Warehouse Workflow

After a booking is confirmed:

``` text
CONFIRMED
    ↓
Pick List
    ↓
Dispatch
    ↓
Event
    ↓
Return
    ↓
Inspection
    ├── Good
    ├── Damaged
    └── Missing
    ↓
COMPLETED
```

Inventory adjustments are recorded with audit information.

------------------------------------------------------------------------

# Authorization

Every request is scoped to a business.

Conceptually:

``` text
Authenticated User
        ↓
Business Membership
        ↓
Role Check
        ↓
Resource Ownership
        ↓
Operation
```

The backend must never trust a client-supplied `business_id` without
verifying that the authenticated user belongs to that business.

### MVP roles

  Role                Primary responsibility
  ------------------- -----------------------------------------
  Owner               Full business control
  Salesperson         Customers, bookings, availability
  Warehouse Manager   Dispatch, returns, inventory operations

A Manager role can be introduced later without redesigning the domain
model.

------------------------------------------------------------------------

# Auditability

Important operations should create immutable audit events.

An audit record should answer:

``` text
WHO
WHAT
WHEN
BEFORE
AFTER
REASON
```

Examples:

``` text
Owner
changed
VIP Sofa owned quantity
50 → 48
reason: 2 units permanently retired
```

or:

``` text
Owner
overrode
inventory conflict
Booking #104
reason: external rental confirmed
```

Audit history should not be silently rewritten.

------------------------------------------------------------------------

# API Design

The API should be organized by domain rather than by generic CRUD alone.

Example resource groups:

``` text
/auth
/users
/customers
/inventory
/packages
/bookings
/availability
/warehouse
/audit
```

Important operations include:

``` text
POST   /auth/login

GET    /inventory
POST   /inventory
PATCH  /inventory/:id

GET    /packages
POST   /packages
POST   /packages/:id/versions

POST   /availability/check

POST   /bookings
GET    /bookings/:id
PATCH  /bookings/:id

POST   /bookings/:id/confirm
POST   /bookings/:id/cancel
POST   /bookings/:id/reschedule
POST   /bookings/:id/override-confirm

POST   /bookings/:id/dispatch
POST   /bookings/:id/return

GET    /audit
```

The exact API surface may evolve during implementation; domain behavior
should remain the source of truth.

------------------------------------------------------------------------

# Error Handling

Errors should be structured and predictable.

Example conflict response:

``` json
{
  "code": "INVENTORY_CONFLICT",
  "message": "Inventory is not available for the requested time window.",
  "conflicts": [
    {
      "inventoryItem": "VIP Sofa",
      "required": 12,
      "available": 10,
      "shortage": 2
    }
  ]
}
```

The frontend can then explain the problem instead of displaying a
generic error.

------------------------------------------------------------------------

# Project Structure

Recommended monorepo structure:

``` text
temporalrent/
├── apps/
│   ├── web/
│   │   └── ...
│   │
│   └── api/
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── users/
│       │   │   ├── customers/
│       │   │   ├── inventory/
│       │   │   ├── packages/
│       │   │   ├── bookings/
│       │   │   ├── warehouse/
│       │   │   └── audit/
│       │   │
│       │   ├── lib/
│       │   │   ├── db.ts
│       │   │   ├── locking.ts
│       │   │   └── idempotency.ts
│       │   │
│       │   ├── middleware/
│       │   │   ├── auth.ts
│       │   │   ├── tenant-scope.ts
│       │   │   └── error-handler.ts
│       │   │
│       │   └── app.ts
│       │
│       └── tests/
│           ├── unit/
│           ├── integration/
│           └── concurrency/
│
├── packages/
│   ├── shared/
│   │   └── ...
│   │
│   └── db/
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       └── seed.ts
│
├── .github/
│   └── workflows/
│
├── docker-compose.yml
├── pnpm-workspace.yaml
└── README.md
```

------------------------------------------------------------------------

# Local Development

## Prerequisites

Install:

-   Node.js 20+
-   pnpm
-   Docker
-   Git

Verify:

``` bash
node --version
pnpm --version
docker --version
```

------------------------------------------------------------------------

## 1. Clone

``` bash
git clone <your-repository-url>
cd temporalrent
```

------------------------------------------------------------------------

## 2. Install dependencies

``` bash
pnpm install
```

------------------------------------------------------------------------

## 3. Start PostgreSQL

The project should provide a Docker Compose configuration for local
PostgreSQL.

``` bash
docker compose up -d
```

Verify:

``` bash
docker compose ps
```

------------------------------------------------------------------------

## 4. Configure environment variables

Create environment files for the API and web applications.

Example API variables:

``` env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/temporalrent"
JWT_SECRET="replace-with-a-long-random-secret"
JWT_REFRESH_SECRET="replace-with-another-long-random-secret"
FRONTEND_ORIGIN="http://localhost:3000"
NODE_ENV="development"
```

Never commit real secrets.

------------------------------------------------------------------------

## 5. Run database migrations

``` bash
pnpm prisma migrate dev
```

Generate Prisma Client:

``` bash
pnpm prisma generate
```

------------------------------------------------------------------------

## 6. Seed demo data

``` bash
pnpm db:seed
```

The seed should create:

-   Demo business
-   Demo users
-   Categories
-   Inventory items
-   Packages
-   Package versions
-   Customers
-   Example bookings

This dataset is also useful for integration and E2E tests.

------------------------------------------------------------------------

## 7. Start development servers

``` bash
pnpm dev
```

Expected services:

``` text
Web:
http://localhost:3000

API:
http://localhost:4000
```

Adjust ports to match the implementation.

------------------------------------------------------------------------

# Testing Strategy

Testing is a core part of TemporalRent because the hardest problems are
correctness problems.

## Unit tests

Test pure domain logic:

``` text
buffer calculation
package expansion
demand aggregation
shortage calculation
state transitions
permission checks
```

------------------------------------------------------------------------

## Integration tests

Test against a real PostgreSQL database:

``` text
create booking
check availability
confirm booking
cancel booking
reschedule booking
dispatch booking
return booking
audit creation
tenant isolation
```

Avoid replacing PostgreSQL-specific behavior with a fake database for
tests involving transactions or range queries.

------------------------------------------------------------------------

## Concurrency tests

This is the most important test suite.

Example:

``` text
Inventory:
2 sofas

Concurrent requests:
10

Each request:
reserve 1 sofa
```

Expected:

``` text
SUCCESS = 2
CONFLICT = 8
```

Never:

``` text
SUCCESS > 2
```

The test should run repeatedly to expose race conditions.

Also test:

``` text
same item
multiple items
different item lock ordering
same idempotency key
different idempotency keys
cancel vs confirm
confirm vs reschedule
```

------------------------------------------------------------------------

## Authorization tests

Verify that:

``` text
Business A user
    cannot read
Business B inventory
```

and that roles cannot perform unauthorized operations.

Examples:

``` text
Salesperson → cannot modify audit history
Warehouse Manager → cannot manage users
Unauthorized user → cannot access another tenant
```

------------------------------------------------------------------------

## E2E tests

The critical browser workflow should be:

``` text
Login
  ↓
Create/select customer
  ↓
Create booking
  ↓
Select package
  ↓
Select event window
  ↓
Check availability
  ↓
View component demand
  ↓
Confirm booking
  ↓
Dispatch
  ↓
Return
  ↓
Complete
```

Also include an E2E conflict scenario.

------------------------------------------------------------------------

# Development Roadmap

## Week 1 --- Foundation

-   Monorepo setup
-   PostgreSQL
-   Prisma
-   Core schema
-   Migrations
-   Seed data
-   Authentication
-   Tenant isolation
-   RBAC foundation

## Week 2 --- Inventory + Packages

-   Inventory CRUD
-   Categories
-   Quantity invariants
-   Package CRUD
-   Package versions
-   BOM components
-   Immutable versioning

## Week 3 --- Availability Engine

Focus almost entirely on backend correctness.

Implement:

-   Buffer resolution
-   Effective ranges
-   Package expansion
-   Demand aggregation
-   PostgreSQL overlap queries
-   Shortage calculations
-   Conflict explanations

No serious frontend polish yet.

## Week 4 --- Reservation + Concurrency

Implement:

``` text
confirm()
cancel()
reschedule()
overrideConfirm()
```

with:

``` text
transactions
row locks
deterministic lock ordering
availability re-check
idempotency
audit events
```

### Critical gate

Do not move forward until concurrency tests prove that inventory can
never be over-reserved.

## Week 5 --- Booking + Warehouse

-   Booking state machine
-   Booking APIs
-   Dispatch
-   Pick lists
-   Returns
-   Damage
-   Missing inventory
-   Audit UI/API

## Week 6 --- Frontend Core

Build:

-   Login
-   Dashboard
-   Inventory
-   Packages
-   Calendar
-   Booking list
-   Booking detail

Prioritize speed and clarity over animation.

## Week 7 --- Booking Builder

This is the hero screen.

Build:

``` text
Customer
   ↓
Event dates
   ↓
Packages
   ↓
Direct items
   ↓
Component breakdown
   ↓
Live availability
   ↓
Conflict explanation
   ↓
Confirmation
```

## Week 8 --- Verification + Deployment

-   Unit tests
-   Integration tests
-   Concurrency tests
-   Authorization tests
-   Playwright E2E
-   Typecheck
-   Lint
-   Build
-   CI/CD
-   Deployment
-   Seed/demo polish
-   README
-   Engineering proof

------------------------------------------------------------------------

# Deployment

Recommended production topology:

``` text
                    GitHub
                       │
                 GitHub Actions
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
          Vercel             Render/Railway
          Next.js             Node API
                                 │
                                 ▼
                              Neon
                           PostgreSQL
```

### Production environments

``` text
development
    ↓
staging
    ↓
production
```

### Recommended production variables

``` text
DATABASE_URL
JWT_SECRET
JWT_REFRESH_SECRET
FRONTEND_ORIGIN
NODE_ENV
```

Secrets should be stored in the hosting provider's secret/environment
configuration, never committed to Git.

------------------------------------------------------------------------

# CI/CD

Pull requests should run:

``` text
Install
  ↓
Lint
  ↓
Typecheck
  ↓
Unit tests
  ↓
Integration tests
  ↓
Concurrency tests
  ↓
Build
```

Production deployment should:

``` text
Run migrations
    ↓
Deploy API
    ↓
Deploy frontend
```

A failed migration or test should block deployment.

------------------------------------------------------------------------

# Engineering Proof

TemporalRent should have a dedicated section in its documentation or
portfolio presentation demonstrating the difficult parts of the system.

## 01 --- Package Explosion

``` text
Premium Haldi × 2
        │
        ├── Urli × 8
        ├── Sofa × 8
        ├── Carpet × 4
        └── Bajot × 12
```

## 02 --- Temporal Availability

``` text
Event
████████████

Buffer
░░░░░░░░░░░░

Effective inventory window
████████████████████
```

## 03 --- Quantity Conflict

``` text
Owned sofas = 10

Booking A = 8
Booking B = 4

Total required = 12

Shortage = 2
```

## 04 --- Concurrency

``` text
Inventory = 2

Request A ───────── SUCCESS
Request B ───────── CONFLICT

Never > 2 reserved
```

## 05 --- Package Versioning

``` text
Haldi v1 ───────→ Booking #101
                   │
                   └── Historical definition preserved

Haldi v2 ───────→ New bookings
```

## 06 --- Auditability

``` text
WHO
WHAT
WHEN
BEFORE
AFTER
REASON
```

These examples make the engineering value much easier to understand than
screenshots alone.

------------------------------------------------------------------------

# Performance and Observability

The MVP should avoid premature infrastructure complexity.

Useful signals include:

``` text
availability request latency
booking confirmation latency
inventory conflict count
database query duration
API error rate
```

For conflict monitoring, structured logs can record:

``` text
event: inventory_conflict
business_id
inventory_items
booking_id
shortage
timestamp
```

At MVP scale, this is preferable to introducing Prometheus, Kafka, or a
large observability stack without a measured need.

------------------------------------------------------------------------

# Security Principles

TemporalRent handles operational business data, so security is part of
the architecture.

### Authentication

-   Secure password hashing
-   Short-lived access tokens
-   Refresh token strategy
-   Secure cookie/token handling

### Authorization

-   Server-side RBAC
-   Business membership checks
-   Resource ownership checks

### Tenant isolation

Every business-owned resource must be scoped to the authenticated
business.

### Input validation

Use Zod at API boundaries.

Never trust:

``` text
quantity
business_id
user_id
booking_id
role
status
```

when supplied by the client.

### Database defense in depth

Use PostgreSQL constraints for invariants wherever possible.

For example:

``` text
damaged_qty
+ missing_qty
+ maintenance_qty
<= owned_qty
```

The database should reject invalid states even if an application bug
attempts to create them.

------------------------------------------------------------------------

# Design Principles

TemporalRent should follow these rules:

### 1. Database is the final authority

``` text
Frontend availability
        ↓
Advisory

Database transaction
        ↓
Final authority
```

### 2. Prefer constraints over assumptions

If a business rule can safely be enforced by PostgreSQL, enforce it
there.

### 3. Prefer deterministic logic

The same input should produce the same availability result.

### 4. Preserve history

Historical bookings must not change because a package was edited later.

### 5. Explain conflicts

Every rejection should help the salesperson understand what went wrong.

### 6. Keep the architecture boring

No technology should exist merely to look impressive.

The difficult engineering comes from:

``` text
temporal reasoning
+
relational modeling
+
transactions
+
concurrency
+
state machines
+
auditability
```

------------------------------------------------------------------------

# What Makes TemporalRent Different

TemporalRent intentionally complements an AI-heavy project such as
JobShield rather than duplicating it.

### JobShield

``` text
Unstructured data
        ↓
AI inference
        ↓
Risk classification
        ↓
MongoDB
        ↓
Async service architecture
```

### TemporalRent

``` text
Physical inventory
        ↓
Relational modeling
        ↓
BOM expansion
        ↓
Temporal reasoning
        ↓
PostgreSQL range queries
        ↓
Transactional concurrency
        ↓
State machine
        ↓
Auditability
```

Together, they demonstrate two very different engineering profiles:

``` text
AI / ML systems
        +
Transactional backend systems
```

------------------------------------------------------------------------

# Resume Positioning

After the implementation is actually complete and tested, a strong
description is:

> **TemporalRent --- Temporal Inventory Reservation Platform**
>
> Built a PostgreSQL-backed inventory reservation engine for event
> rental businesses, expanding package BOMs into component-level demand
> and calculating buffer-adjusted availability using temporal range
> queries. Implemented transactional row-level locking, idempotent
> booking confirmation, immutable package versions, booking state
> transitions, warehouse reconciliation, and concurrent race-condition
> testing.

Do not claim performance numbers, concurrency counts, or production
guarantees until they have been measured and verified.

------------------------------------------------------------------------

# Project Status

> **Status:** In Development\
> **MVP target:** 8-week implementation\
> **Architecture:** Modular monolith\
> **Primary database:** PostgreSQL\
> **Core challenge:** Temporal inventory reservation + transactional
> concurrency

------------------------------------------------------------------------

# License

Choose a license before making the repository public.

For a personal portfolio project, MIT is a reasonable default if you
want others to freely inspect, fork, and reuse the code.

------------------------------------------------------------------------

## Final Principle

> **Do not build TemporalRent from the UI inward.**

Build it:

``` text
PostgreSQL
    ↓
Domain / Reservation Engine
    ↓
API
    ↓
Tests
    ↓
UI
```

The most important milestone is not the dashboard.

It is proving:

``` text
2 units available

100 concurrent confirmation attempts

≤ 2 successful reservations
100% of the time
```

Once that invariant is reliable, the rest of TemporalRent becomes
product engineering around a genuinely strong systems-engineering core.
# TemporalRent
