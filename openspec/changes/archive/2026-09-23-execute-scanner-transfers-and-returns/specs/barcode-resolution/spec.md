## MODIFIED Requirements

### Requirement: Unambiguous short mock barcode formats

Resolver SHALL сохранять C*, P*, TM* и поддерживать CMD:CONTAINER, CMD:NEXT, CMD:LINE, CMD:PRODUCT, CMD:ALL, CMD:QTY, CMD:RETURN-ALL, CMD:RETURN, CMD:RETURN-QTY, CMD:CANCEL по централизованному каталогу design.md. Matching SHALL быть точным после trim().toUpperCase(); resolver SHALL NOT исполнять операции.

#### Scenario: Commands
- **WHEN** поступает любой код каталога в смешанном регистре
- **THEN** возвращается соответствующая typed command

#### Scenario: Unknown command
- **WHEN** поступает CMD:UNKNOWN
- **THEN** возвращается unknown без операции
