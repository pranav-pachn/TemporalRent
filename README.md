# TemporalRent

> **Conflict-free inventory planning for event rental businesses.**  
> Know what you can safely promise before you promise it.

TemporalRent is a temporal inventory reservation platform engineered for event rental and decor businesses. It solves the operational challenge of multi-item equipment scheduling: ensuring that every physical component required for an event is available across its entire turnaround window—including preparation, transit, event runtime, teardown, and cleaning buffers.

Unlike traditional booking apps that treat rentals as simple calendar slots, TemporalRent models **package Bill of Materials (BOM) expansion**, **effective temporal ranges**, **quantity-pool calculations**, **deterministic row-level locking**, and **audited state transitions**.

---

## The Core Operational Problem

Event rental businesses frequently promise inventory based on package names using spreadsheets or calendar entries:

```text
Booking: "Premium Haldi Setup" × 1
```

In reality, a package is not an inventory item—it is an abstraction that expands into physical inventory demand:

```text
Premium Haldi Setup × 1
├── Urli          × 4
├── VIP Sofa      × 4
├── Low Wooden Bajot × 6
├── Brass Diya    × 8
└── Yellow Carpet × 2
```

Two bookings for completely different packages may silently contest the exact same shared physical items (e.g., VIP Sofas). Without physical demand aggregation and temporal buffer awareness, overbooking is inevitable.

### The System Guarantee

```text
Available   → Confirm with a database-backed transaction guarantee
Unavailable → Reject with an actionable conflict explanation
```

When an inventory conflict occurs, TemporalRent returns actionable diagnostics rather than generic failure:

```json
{
  "code": "INVENTORY_CONFLICT",
  "message": "Insufficient inventory for the requested window.",
  "conflicts": [
    {
      "inventoryItemId": "item_vip_sofa",
      "itemName": "VIP Sofa",
      "required": 12,
      "usable": 10,
      "shortage": 2,
      "conflictingBookings": [
        {
          "bookingId": "bk_8912",
          "eventName": "Sangeet Night",
          "period": "[2026-11-12 14:00:00+00, 2026-11-13 04:00:00+00)"
        }
      ]
    }
  ]
}
```

---

## Core Engineering Pillars

### 1. Package BOM Expansion & Demand Aggregation

Packages are versioned and immutable once published. When a booking includes packages and direct individual inventory items, the engine expands the Bill of Materials (BOM) and aggregates total required units per physical inventory ID prior to availability checks.

### 2. Temporal Buffer Resolution

Inventory is unavailable before and after an event due to logistical overhead (staging, transport, maintenance, and recovery).

```text
Event Duration:      Friday 19:00 → Friday 23:30
Buffer Before (Prep): 2 hours
Buffer After (Clean): 12 hours
--------------------------------------------------------------
Effective Window:    Friday 17:00 → Saturday 11:30
```

TemporalRent models scheduling using PostgreSQL timestamp range types (`tstzrange`) and range overlap operators (`&&`) with GiST indexing.

### 3. Quantity-Aware Pool Calculations

Rather than binary "available / unavailable" flags, inventory availability evaluates usable stock against committed overlapping demand:

$$\text{Usable Pool} = \text{Owned} - (\text{Damaged} + \text{Missing} + \text{Maintenance})$$
$$\text{Available} = \text{Usable Pool} - \sum \text{Overlapping Committed Demands}$$

### 4. Concurrency & Race Condition Safety

Frontend availability checks are strictly advisory. Final confirmation executes within an ACID PostgreSQL transaction utilizing:

- **Deterministic lock ordering**: Inventory row locks are acquired in sorted item ID order to eliminate deadlocks.
- **In-transaction availability re-verification**: State is validated under lock before confirming reservations.
- **Idempotency keys**: Network retries safely return cached results without double-allocating inventory.

---

## System Architecture

TemporalRent is architected as a modular monorepo managed with **Turborepo** and **pnpm**:

```text
┌─────────────────────────────────────────────────────────┐
│                   Next.js 14 Web App                    │
│      (App Router, Tailwind CSS, TypeScript, UI Kit)     │
└────────────────────────────┬────────────────────────────┘
                             │ REST / JSON
┌────────────────────────────▼────────────────────────────┐
│                    Express.js REST API                  │
│       (Validation via Zod, Business Domain Modules)     │
└────────────────────────────┬────────────────────────────┘
                             │ Prisma ORM + Raw SQL
┌────────────────────────────▼────────────────────────────┐
│                   PostgreSQL Database                   │
│   (tstzrange, GiST Indexes, Constraints, Row Locks)     │
└─────────────────────────────────────────────────────────┘
```

### Monorepo Structure

```text
TemporalRent/
├── apps/
│   ├── api/                     # Node.js + Express REST API
│   │   ├── prisma/
│   │   │   └── schema.prisma    # Multi-tenant PostgreSQL domain schema
│   │   └── src/
│   │       ├── app.ts           # Express application setup & middleware
│   │       ├── server.ts        # Server entry point
│   │       └── lib/             # Shared API helpers and clients
│   └── web/                     # Next.js 14 frontend application
│       └── src/
│           ├── app/             # App router pages & layouts
│           └── components/      # UI components
├── packages/
│   └── shared/                  # Cross-boundary domain types & Zod schemas
├── package.json                 # Monorepo root scripts & Turborepo config
├── pnpm-workspace.yaml          # pnpm workspace definition
└── turbo.json                   # Build and pipeline orchestration
```

---

## Domain Model

- **Tenant Boundary (`Business`)**: Multi-tenant isolation ensuring users and bookings are strictly scoped.
- **Inventory Items (`InventoryItem`)**: Physical stock tracking owned, damaged, missing, and maintenance quantities.
- **Packages & Versions (`Package`, `PackageVersion`, `PackageComponent`)**: Catalog items with immutable version snapshots ensuring past bookings remain historically accurate when package components are edited.
- **Bookings & Demand (`Booking`, `BookingLine`, `BookingItemDemand`)**: Reservation entities storing temporal windows (`tstzrange`) and computed physical demand.
- **Inventory Reservations (`InventoryReservation`)**: Locked reservation slices tied to specific temporal windows.
- **Operations & Audit (`InventoryMovement`, `DamageReport`, `AuditEvent`)**: Complete lifecycle tracking from dispatch through check-in, maintenance adjustments, and security logs.

### Booking Lifecycle State Machine

```text
  [ DRAFT ] ──────────→ [ CANCELLED ]
      │                      ▲
      ▼                      │
[ CONFIRMED ] ───────────────┤
      │
      ▼
[ ACTIVE (Dispatched) ]
      │
      ▼
[ COMPLETED (Returned & Reconciled) ]
```

---

## Tech Stack

| Layer                     | Technology                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Monorepo Engine**       | [Turborepo](https://turbo.build/) & [pnpm](https://pnpm.io/)                                                             |
| **Frontend**              | [Next.js 14](https://nextjs.org/) (App Router), [React 18](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/) |
| **Backend API**           | [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [TypeScript](https://www.typescriptlang.org/)         |
| **Database & ORM**        | [PostgreSQL](https://www.postgresql.org/), [Prisma ORM](https://www.prisma.io/) (`tstzrange` range types)                |
| **Validation & Security** | [Zod](https://zod.dev/), [Helmet](https://helmetjs.github.io/), CORS, JWT                                                |

---

## Getting Started

### Prerequisites

- **Node.js**: `v20.0.0` or higher
- **pnpm**: `v9.0.0` or higher (`npm install -g pnpm`)
- **PostgreSQL**: PostgreSQL 14+ instance (local or hosted like [Neon](https://neon.tech/))

### 1. Clone Repository

```bash
git clone https://github.com/pranav-pachn/TemporalRent.git
cd TemporalRent
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

**API Configuration (`apps/api/.env`):**

Create `apps/api/.env` from `apps/api/.env.example`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/temporalrent?sslmode=disable"
PORT=3001
NODE_ENV=development
```

**Web Configuration (`apps/web/.env`):**

Create `apps/web/.env` from `apps/web/.env.example`:

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### 4. Database Setup

Generate the Prisma client and synchronize the schema:

```bash
# From workspace root
pnpm --filter api db:generate
pnpm --filter api db:push
```

### 5. Start Development Servers

Run all workspace applications in parallel via Turbo:

```bash
pnpm dev
```

- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **API Server**: [http://localhost:3001](http://localhost:3001)
- **API Health Endpoint**: [http://localhost:3001/health](http://localhost:3001/health)

---

## Available Scripts

Run these scripts from the repository root:

| Command                         | Description                                                      |
| ------------------------------- | ---------------------------------------------------------------- |
| `pnpm dev`                      | Starts frontend and backend applications in watch mode via Turbo |
| `pnpm build`                    | Builds all packages and applications                             |
| `pnpm lint`                     | Runs ESLint across all workspaces                                |
| `pnpm typecheck`                | Validates TypeScript types across the monorepo                   |
| `pnpm format`                   | Formats codebase using Prettier                                  |
| `pnpm --filter api db:generate` | Generates the Prisma client                                      |
| `pnpm --filter api db:push`     | Pushes Prisma schema changes directly to the database            |

---

## API Overview

The API is organized around domain capabilities:

| Domain           | Method & Route                                                   | Description                                           |
| ---------------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| **Health**       | `GET /health`                                                    | Health check endpoint                                 |
| **Auth**         | `POST /auth/login`, `POST /auth/register`                        | Authentication & token exchange                       |
| **Inventory**    | `GET /inventory`, `POST /inventory`, `PATCH /inventory/:id`      | Inventory item & stock adjustments                    |
| **Packages**     | `GET /packages`, `POST /packages`, `POST /packages/:id/versions` | Package and version management                        |
| **Availability** | `POST /availability/check`                                       | Evaluates temporal availability and returns shortages |
| **Bookings**     | `POST /bookings`, `GET /bookings/:id`                            | Booking builder & draft lifecycle                     |
| **Reservations** | `POST /bookings/:id/confirm`                                     | Atomic, locked reservation transaction                |
| **Operations**   | `POST /bookings/:id/dispatch`, `POST /bookings/:id/return`       | Warehouse check-out and return reconciliation         |
| **Audit**        | `GET /audit`                                                     | Immutable audit trail records                         |

---

## License

This project is licensed under the [MIT License](LICENSE).
