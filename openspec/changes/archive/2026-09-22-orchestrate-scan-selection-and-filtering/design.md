## Context

`BarcodeInputAdapter` and `BarcodeResolver` already turn input into typed machine events. `ScanMachine` has basic mouse and scan transitions, `ShipmentDataStore` has mutually exclusive source-filter operations, and `ScannerWorkflowOrchestrator` owns the machine and store. The current UI still keeps both table modes locally, table rows are inert, orchestrator reactions only log, and source projections ignore the store filter. The current machine also enters `transferring-*` on repeated scans, while this increment must not execute or stage transfers.

The scanner concept document defines these source behaviors: a container selection filters to that container and displays its products; a product selection without container context filters to that product across containers; scanning a product while a container is selected targets that product only within that container and preserves the container filter. Transfer actions described by the source are intentionally represented only by technical logs here.

## Goals / Non-Goals

**Goals:**

- Make mouse and scanner selection converge on the same typed `ScanMachine` context without having tables mutate `ShipmentDataStore` filters directly.
- Have the orchestrator synchronize machine context to source filters, active transport place, and the source display mode.
- Keep filtered rows in the selected table mode and preserve product aggregation: a product filter yields only that SKU; a container filter yields only products in that container when the source view is «Товары».
- Validate product-in-container context and preserve the last valid context when validation fails.
- Log transfer intents without changing allocations, creating pending transfer effects, or blocking subsequent input.

**Non-Goals:**

- Execute full-container, product-line, bulk, partial-quantity, or return transfers.
- Add a third filtered-table mode or expose source lines as separate rows.
- Move the right table display mode into the orchestrator or make it react automatically to a scanned transport place.
- Change resolver classification, persistence, backend fetching, or shipment data ownership.

## Decisions

### Machine context is the workflow source of truth

`ScanMachine` owns the compact source filter context, selected source entity (including a product selected within a container), active transport place ID, feedback, stable step, and a uniquely identified non-executing intent. It continues to store IDs and discriminated context only, never full domain records or raw barcode text. A filter in `ShipmentDataStore` is a one-way applied projection of this machine context, not an independently edited UI state.

Alternatives considered:

- Let table components call `ShipmentDataStore.set*Filter`: rejected because it bypasses machine transitions and can desynchronize mouse and scanner flows.
- Let the orchestrator own a second independent source selection/filter: rejected because it would create two competing workflow authorities.

### Different inputs share transitions, not preprocessing

The resolver keeps responsibility for converting raw barcode text to typed entities. Mouse handlers already have the entity type and ID, so a narrow orchestrator interaction method dispatches the corresponding explicit mouse event to the machine without calling the resolver. Both routes use common transition logic in `ScanMachine`. Table components do not import or mutate the machine directly.

The source display mode is observable UI state owned by `ScannerWorkflowOrchestrator`, not by `ScanMachine`. A manual mode change updates only that mode. A machine transition caused by container/product selection may set the source mode to «Товары». The right display mode remains local to its panel; selecting/scanning a transport place changes the active place only.

### Filters narrow projections without adding a table mode

The orchestrator's read-only source projections apply `ShipmentDataStore.sourceFilter` while preserving row type selected by the source mode. In «Товары», a container filter aggregates products from that container and a product filter returns the selected SKU aggregated across its remaining source lines. In «Контейнеры», a container filter shows that container; a product filter narrows the container rows to containers with a positive remainder for that product. All projections exclude zero remainders and preserve current stable ordering.

### Validation is performed at the orchestration boundary

The machine does not inspect shipment records. The orchestrator checks whether a selected product exists in the selected container using the loaded `ShipmentDataStore`. If not, it reports the typed machine error and leaves the existing container filter/selection intact; if valid, it keeps the container filter and sets the product selection context. This avoids coupling the state machine to data storage.

### Transfer intentions are observable but not effects

Repeated scans and the product-within-container case publish a uniquely identified typed intent for the orchestrator to log. The stable selection remains usable, `pendingEffect` stays empty, no `transferring-*` step is entered, and the input remains enabled. The intent sequence/ID ensures that repeating the same scan still causes one log even when the stable selection itself did not change. Mouse selection alone does not simulate a repeated scan.

Alternatives considered:

- Reuse `pendingEffect` and `transferring-*`: rejected because that marks an operation as in progress and blocks input despite no operation being executed.
- Log directly inside the machine: rejected because side effects belong to the orchestrator.

## Risks / Trade-offs

- Machine context and applied store filter are mirrored → Keep synchronization one-way and centralize all source-filter mutations in the orchestrator reaction.
- A valid product scan inside a selected container can emit a transfer-intent log without changing inventory → Use an explicit intent type and message that cannot be confused with a completed transfer.
- User-selected source mode can differ from the mode automatically selected by a later scan → Treat manual mode changes as presentation-only; the next relevant source selection may select «Товары» again.
- Product rows stay aggregated although future transfers operate on underlying source lines → Preserve the stable source-line order in the data store for the later transfer implementation.
