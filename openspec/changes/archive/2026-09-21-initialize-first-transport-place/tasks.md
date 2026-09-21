## 1. Session initialization

- [x] 1.1 Initialize each new ShipmentStore session with one empty active ТМ-001 using the existing transport-place creation rules.
- [x] 1.2 Preserve empty allocation lines, source remainders and zero distribution progress during initialization.

## 2. Initial presentation and verification

- [x] 2.1 Update the initial right panel to show active ТМ-001 instead of the no-transport-place empty state.
- [x] 2.2 Verify that manually creating the next ТМ produces active ТМ-002 without changing the initial place or order totals.
- [x] 2.3 Run lint and production build.
