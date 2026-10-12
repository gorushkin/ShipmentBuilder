# Spec Delta

## MODIFIED Requirements

### Requirement: Explicit line precedence
Совпадающий скан вне переключения container filter на product filter SHALL переносить явно выбранную строку и очищать её выбор после успеха. Без pin повторный скан SHALL брать первую положительную sourceLine в порядке snapshot.
#### Scenario: Continue after a pinned line
- **WHEN** пользователь выбирает L3 товара P1 и затем вне container filter дважды сканирует P1
- **THEN** переносятся L3, затем первая оставшаяся L1, а фильтр сохраняется
