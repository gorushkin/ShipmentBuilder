## 1. Destination preparation

- [x] 1.1 Extract an internal ShipmentStore operation that returns the active ТМ or creates and activates one when a valid transfer needs a destination.
- [x] 1.2 Update selected-container distribution to prepare its destination only after source validation and then transfer the full current remainder.

## 2. Interaction and verification

- [x] 2.1 Enable «Переместить строку» for a selected container with positive remainder even when no ТМ is active.
- [x] 2.2 Verify that a transfer without an active ТМ creates exactly one active ТМ, while a transfer with an active ТМ reuses it and invalid transfers create none.
- [x] 2.3 Run lint and production build.
