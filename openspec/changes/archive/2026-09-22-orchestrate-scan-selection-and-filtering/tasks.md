## 1. Model typed selection and scanner transitions

- [x] 1.1 Extend ScanMachine context and events for container, product, transport-place, and quantity-command selections from scanner and mouse.
- [x] 1.2 Implement container and product selection transitions, including product selection under an active container context.
- [x] 1.3 Represent transfer-related scans as non-executing intents with unique identifiers; preserve current selection and avoid entering a transferring state.
- [x] 1.4 Add transition tests for valid selection, repeat scans, quantity command, and invalid product-in-container scans.

## 2. Orchestrate selection and store synchronization

- [x] 2.1 Add orchestrator entry points for typed mouse selections and scanner-resolved selections.
- [x] 2.2 React to ScanMachine state changes by synchronizing source filters and active transport place into ShipmentDataStore.
- [x] 2.3 Move source-table display mode ownership to ScannerWorkflowOrchestrator and switch to Products mode when container or product selection requires it.
- [x] 2.4 Validate selected products against the active container and publish a recoverable error without discarding the existing valid context.
- [x] 2.5 Log transfer intents and repeated scan intents without mutating shipment allocations or blocking barcode input.
- [x] 2.6 Add orchestrator tests for filter/mode synchronization, active transport-place selection, validation, and non-mutating transfer intents.

## 3. Apply filters to the two source-table modes

- [x] 3.1 Implement container and product filters as projections over the current source-table row mode.
- [x] 3.2 Preserve aggregated-by-SKU product rows and narrow the visible products to the active filter context.
- [x] 3.3 Verify that manual source-mode changes affect presentation only and do not change ScanMachine selection or active filters.
- [x] 3.4 Add projection tests for container filters, product filters, filter replacement, and empty results.

## 4. Route table interactions through the workflow

- [x] 4.1 Connect source container and product row clicks to the orchestrator’s typed selection entry points.
- [x] 4.2 Connect transport-place row clicks to active transport-place selection through the same workflow.
- [x] 4.3 Connect barcode-resolved entity and command events to ScanMachine through the input adapter/orchestrator path.
- [x] 4.4 Update source-mode controls and selection indicators to reflect orchestrator-owned mode and active context.
- [x] 4.5 Keep transfer controls outside this change’s execution path; show only the specified technical intent logs for scanner transfer scenarios.

## 5. Verify end-to-end behavior

- [x] 5.1 Add integration coverage for equivalent mouse and scanner selections and resulting filters/modes.
- [x] 5.2 Add regression coverage that selection and transfer-intent handling never changes product allocations.
- [x] 5.3 Run relevant unit and integration tests, lint, type checking, and the production build.
- [x] 5.4 Validate the OpenSpec change and ensure all scenarios in the delta specs are covered.
