## 1. Source projections

- [x] 1.1 Keep the source display mode as local UI state, independent of filtering and scanner workflow.
- [x] 1.2 Add an aggregated product-remainder projection with code, name, units, boxes and remaining-container count, sorted by product code and excluding zero remainders.

## 2. Source panel

- [x] 2.1 Enable the existing «Контейнеры / Товары» switch and render the corresponding table headers and rows.
- [x] 2.2 Render source rows as read-only data; do not select entities or invoke filter/transfer actions from table rows.
- [x] 2.3 Add the «Все товары распределены» empty state for an empty product view.
- [x] 2.4 Preserve the current labels and disabled behavior of deferred filter, quantity and product-transfer actions.

## 3. Verification

- [x] 3.1 Run lint and production build.
- [x] 3.2 Verify in the browser that switching modes, selection reset, product aggregation and the empty state meet the source-product-mode scenarios.
