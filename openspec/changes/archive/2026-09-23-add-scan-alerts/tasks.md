## 1. Alert infrastructure

- [x] 1.1 Add the shadcn Toast component and render its single `Toaster` at the shipment page root.
- [x] 1.2 Create the framework-independent `AlertService` contract and its shadcn Toast adapter for typed alerts.

## 2. Scanner workflow integration

- [x] 2.1 Add `ScanIssue` and change unknown-barcode handling to return `barcode-unrecognized` with the feedback text «ШК не распознан», or null while transferring.
- [x] 2.2 Inject `AlertService` into `ScannerWorkflowOrchestrator` and publish each returned issue once without changing selections or allocations.
- [x] 2.3 Compose the alert service in the runtime alongside the scanner workflow.

## 3. Verification

- [x] 3.1 Add unit tests for the machine issue contract and the orchestrator's single alert publication, including the busy case.
- [x] 3.2 Verify in the browser that an unknown scan shows one error toast and preserves the action-panel error.
- [x] 3.3 Run formatting, linting, tests, build, and strict OpenSpec validation.
