## Why

`ShipmentStore` был заменён `ShipmentDataStore` и больше не имеет импортов в
приложении или тестах. Оставшийся мёртвый код и ссылки на него в актуальных
спецификациях создают ложное впечатление, что в runtime существуют два store.

## What Changes

- Удалить неиспользуемый модуль `ShipmentStore`.
- Удалить из спецификации устаревшее требование, описывающее этот store.
- Убрать из актуальных спецификаций ссылки на отсутствующий старый store,
  сохранив контракт `ShipmentDataStore` и оркестратора.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `demo-domain-store`: Удалить требование об устаревшем `ShipmentStore`.
- `shipment-data-store`: Описывать независимость snapshot-store без ссылки на
  удалённый store.
- `scanner-workflow-orchestrator`: Убрать неактуальные гарантии отсутствия
  зависимости от legacy store.

## Impact

- Удаляется `src/domain/shipment/shipment-store.ts`.
- Обновляются три OpenSpec-спецификации; исторические exploration-документы и
  архивы остаются неизменными.
