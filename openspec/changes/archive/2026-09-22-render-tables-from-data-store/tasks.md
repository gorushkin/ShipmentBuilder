## 1. Shared workflow runtime and table projections

- [x] 1.1 Create a single shared runtime composition for `ScanMachine`, `ShipmentDataStore` and `ScannerWorkflowOrchestrator`; reuse it from `ShipmentPage` and table panels without creating duplicate stores.
- [x] 1.2 Add typed row DTOs and mode-specific read-only source/destination projection methods to `ScannerWorkflowOrchestrator`, derived from the new data store and returning empty results before snapshot load.
- [x] 1.3 Add unit tests for container, product, transport-place and active-transport-place-product projections, plus missing-snapshot and no-active-place cases.
- [x] 1.4 Include the active transport-place indicator in destination rows and verify projections react to snapshot/context changes.

## 2. Table rendering

- [x] 2.1 Move source and destination display modes to local panel UI state and use the selected mode when requesting rows from the shared orchestrator.
- [x] 2.2 Update source and destination tables to render the orchestrator-projected row DTOs without reading or receiving the legacy `ShipmentStore` or `ShipmentDataStore`.
- [x] 2.3 Remove row click domain actions; leave rows inert or log entity type and ID without selecting, filtering, transferring or changing active transport place.
- [x] 2.4 Remove or narrow legacy row formatting helpers only when they are no longer used by other screen regions; keep non-table legacy store consumers unchanged.
- [x] 2.5 Reconcile container selection, active transport-place selection and destination-product selection specs with the temporary inert-row behavior.

## 3. Verification

- [x] 3.1 Verify loading a snapshot reactively updates all four table modes and preserves the selected local mode when data changes.
- [x] 3.2 Verify table row clicks do not mutate either store or invoke scanner/domain actions.
- [x] 3.3 Run unit tests, lint and production build; verify the existing large-demo scenario uses a consistent snapshot for the tables.
