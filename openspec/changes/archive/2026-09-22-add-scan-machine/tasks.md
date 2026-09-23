## 1. Scanner domain contracts

- [x] 1.1 Add discriminated TypeScript contracts for scanner events, source and
  destination context, steps, effects, transfer results and stable error codes.
- [x] 1.2 Implement reactive `ScanMachine` with stable selection states,
  `awaiting-quantity`, `transferring-*`, feedback and explicit mouse-context
  methods; keep it independent of `ShipmentStore` and React.
- [x] 1.3 Verify the machine’s container, product, transport-place, quantity,
  pending-effect, success and error transitions with focused automated tests or
  equivalent executable state-transition checks.

## 2. Barcode resolution and composition

- [x] 2.1 Add short prefixed mock barcodes for containers, products and
  transport places without changing their display identifiers.
- [x] 2.2 Implement a case-insensitive prototype resolver returning typed scan
  events or a typed unknown result through exact normalized matching.
- [x] 2.3 Add the input adapter and page-level composition that sends completed
  `BarcodeInput` values through the resolver to `ScanMachine` without importing
  or mutating `ShipmentStore`.

## 3. UI state integration

- [x] 3.1 Replace the technical console log with adapter submission and expose
  scanner feedback in the shipment UI.
- [x] 3.2 Reflect `transferring-*` by disabling `BarcodeInput` and showing
  «Обработка…» while preserving the existing hidden/expanded presentation.
- [x] 3.3 Route existing mouse selection, active-TM selection and filter-clear
  interactions into the machine’s explicit mouse-context events without
  changing their current `ShipmentStore` behavior.

## 4. Verification

- [x] 4.1 Run lint and production build.
- [ ] 4.2 Manually verify case-insensitive resolution of C1, P1, TM1 and
  CMD:QTY; selection feedback; pending transfer processing; and unchanged
  shipment allocations.
