## MODIFIED Requirements

### Requirement: Source container selection

`ShipmentStore` SHALL retain its ID-based container-selection capability for
legacy operations. The new data-backed container table SHALL render rows without
selecting a container: row clicks SHALL be inert or emit a technical log only,
and SHALL NOT mutate either store or scanner state. This temporary UI limitation
SHALL NOT change the transfer command's existing validation and allocation rules.

#### Scenario: Click a source container row
- **WHEN** the user clicks or activates a source container table row
- **THEN** the row remains a data display only or emits a technical log containing its entity type and ID
- **AND** `selectedContainerId`, filters, allocations, active transport place and scanner state remain unchanged

#### Scenario: Legacy selection capability remains available
- **WHEN** a non-table legacy caller explicitly invokes the container selection command with a valid container ID
- **THEN** the legacy `ShipmentStore` may retain that selection without changing source data, allocations or active transport place
