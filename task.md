# Phase 29 Tasks — Warehouse UI

- `[x]` **1. Backend: Read-Only Listing Endpoints & Services**
  - `[x]` Add `listDispatches` and `getDispatchById` in `dispatch.service.ts` (strictly read-only, NO auto-inserts on GET).
  - `[x]` Add top-level `dispatches.routes.ts` mounted at `/api/v1/dispatches` (supporting `GET /`, `GET /:id`).
  - `[x]` Add `listAwaitingReturns`, `listCompletedReturns`, and `getReturnInspectionData` in `returns.service.ts`.
  - `[x]` Add top-level `returns.routes.ts` mounted at `/api/v1/returns` (supporting `GET /`, `GET /:bookingId/inspection`, `POST /:id/complete`).
  - `[x]` Add `damage-reports.routes.ts` mounted at `/api/v1/damage-reports` (supporting `GET /`).
  - `[x]` Wire routes in `app.ts`.

- `[x]` **2. Shared Types & API Client (Strongly Typed, No `any`)**
  - `[x]` Create `apps/web/src/types/warehouse.ts` with explicit types:
    - `DispatchStatus`, `DispatchDTO`, `DispatchLineDTO`
    - `ReturnStatus`, `ReturnDTO`, `ReturnLineDTO`, `AwaitingReturnDTO`, `ReturnInspectionDTO`, `ReturnsListResponse`
    - `DamageReportDTO`
  - `[x]` Update `apps/web/src/lib/api.ts` with strongly typed endpoints.

- `[x]` **3. Frontend: Sidebar & Navigation Reorganization**
  - `[x]` Update `Sidebar.tsx` to group into OPERATIONS (Calendar, Bookings), WAREHOUSE (Dispatch, Returns, Damage), INVENTORY (Inventory, Packages), SYSTEM (Audit Log, Settings).

- `[x]` **4. Frontend: Dispatch Board (`/dispatch`)**
  - `[x]` Filter tabs: `[ READY ]`, `[ PICKING ]`, `[ DISPATCHED ]`.
  - `[x]` Operational cards with booking info, event time, items count, operational status.
  - `[x]` Pick List modal: displays items, `Expected`, `Dispatched` input, and `Remaining` calculation.
  - `[x]` Action handling: `[ Start Dispatch ]` (calls `startPicking`), `[ Confirm Dispatch ]` (idempotent submission).

- `[x]` **5. Frontend: Returns Inspection (`/returns`)**
  - `[x]` View tabs: `[ Awaiting Return ]` and `[ Completed Returns ]`.
  - `[x]` Inspection form based strictly on `dispatchLine.dispatchedQty`.
  - `[x]` Live invariant validation indicator: `Good + Damaged + Missing = Expected`. Disables submission if invalid.
  - `[x]` Mandatory damage reason input when `Damaged > 0`.
  - `[x]` Action handling: `[ Complete Return ]` (idempotent submission).

- `[x]` **6. Frontend: Damage Reports (`/damage`)**
  - `[x]` Operational traceability view with filters: `[ All ]`, `[ Damaged ]`, `[ Missing ]`.
  - `[x]` Clean cards/table displaying item details, damage reason, event link, status.

- `[x]` **7. Automated & Concurrency Testing**
  - `[x]` Add/run concurrency & idempotency test for dispatch and return in `tests/dispatch-returns.test.ts`.
  - `[x]` Run web application production build (`npm run build`).
