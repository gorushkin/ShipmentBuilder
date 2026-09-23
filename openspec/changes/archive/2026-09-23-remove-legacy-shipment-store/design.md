## Context

`ShipmentStore` was the original all-in-one MobX store. Runtime composition now
creates `ShipmentDataStore` and gives it to `ScannerWorkflowOrchestrator`; no
code or test imports the legacy class.

## Goals / Non-Goals

**Goals:**

- Remove the unused implementation and its obsolete contract.
- Keep the active snapshot-store and orchestrator contracts internally
  consistent.

**Non-Goals:**

- Do not change shipment data, demo fixtures, transfer behavior or historical
  OpenSpec exploration and archive records.

## Decisions

- Delete the legacy module directly because a repository-wide import search
  establishes it has no runtime or test consumers.
- Remove only the old store requirement from `demo-domain-store`; its data-model
  and demo-fixture requirements still document active code.
- Replace legacy-store references in active specifications with direct
  `ShipmentDataStore` contracts rather than retaining negative compatibility
  guarantees for a class that no longer exists.

## Risks / Trade-offs

- [An untracked external consumer imports the class] → this prototype exposes
  no public package API; TypeScript build verifies all repository consumers.
