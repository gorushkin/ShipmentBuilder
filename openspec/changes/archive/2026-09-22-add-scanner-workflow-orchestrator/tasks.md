## 1. Orchestrator module

- [x] 1.1 Add `ShipmentSnapshotLoader`, demo loader and
  `ScannerWorkflowOrchestrator` with explicit `start()` / `dispose()` lifecycle.
- [x] 1.2 Implement idempotent async snapshot loading into `ShipmentDataStore`
  and ignore results received after disposal.
- [x] 1.3 Add a MobX reaction over the compact scanner snapshot that writes one
  structured technical log per meaningful machine change, without data actions.

## 2. Composition and verification

- [x] 2.1 Create machine, new data store, loader and orchestrator in the page
  composition root; start and dispose the orchestrator while leaving UI on the
  old `ShipmentStore`.
- [x] 2.2 Add focused tests for lifecycle, loading, disposal and log-only
  observation; confirm scanner changes do not mutate the new data store.
- [x] 2.3 Run `pnpm test`, `pnpm lint`, `pnpm build` and validate the change.
