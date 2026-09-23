## 1. Store contracts and snapshot lifecycle

- [x] 1.1 Add `ShipmentDataStore`, public projection row types, command input
  types, `DataResult` and stable data-operation error codes in a module that
  does not import React, `ShipmentStore` or scanner modules.
- [x] 1.2 Implement the empty initial state and transactional
  `setSnapshot(snapshot)` deep-copy/reset behavior.
- [x] 1.3 Implement derived remaining quantities, order/remaining totals,
  distribution progress and source/destination projections without duplicating
  mutable totals.

## 2. Context and data commands

- [x] 2.1 Implement source filter and active transport-place context commands,
  plus creation and explicit selection of transport places.
- [x] 2.2 Implement atomic explicit-ID transfer commands for a container, a
  product from a container, the next product source line in snapshot order and
  a product quantity.
- [x] 2.3 Implement atomic explicit-ID return commands for all contents of a
  transport place, a product and a product quantity.
- [x] 2.4 Centralize validation and allocation upsert/remove helpers so every
  command preserves source quantities, allocation provenance and KМ/КА data.

## 3. Verification and documentation

- [x] 3.1 Add focused unit tests for snapshot isolation/reset, projections and
  source filters; transport-place context; transfer/return invariants; typed
  failures; and deterministic `transferNextProductLine` ordering.
- [x] 3.2 Keep the new store isolated: do not connect it to `ShipmentPage`,
  panels, `BarcodeInput`, `ScanMachine` or current `ShipmentStore` integration.
  Restore only the pre-existing `ShipmentPage`/`BarcodeInput` prop mismatch
  authorised during apply.
- [x] 3.3 Verify `pnpm test`, `pnpm lint` and `pnpm build`; update the
  exploration architecture plan to record the standalone-store scope and the
  later documentation/spec migration.
