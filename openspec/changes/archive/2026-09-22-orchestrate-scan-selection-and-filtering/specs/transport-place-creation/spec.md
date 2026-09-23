## MODIFIED Requirements

### Requirement: Active transport place

`ShipmentStore` SHALL retain its ID-based active transport-place state and creation command behavior for legacy controls. In the new data-backed workflow, clicking a transport-place row or scanning its barcode SHALL update active transport place through `ScanMachine`; `ScannerWorkflowOrchestrator` SHALL validate and apply that ID to `ShipmentDataStore`. Selection SHALL preserve source filter, selected source entity and both table display modes. Active transport-place selection SHALL NOT distribute, return, or otherwise change allocations.

#### Scenario: Created place becomes active

- **WHEN** пользователь creates a new transport place through a legacy control
- **THEN** legacy `activeTransportPlaceId` equals the ID of the created place

#### Scenario: Select an existing transport place by mouse or scanner

- **WHEN** the user clicks a visible transport-place row or scans its barcode
- **THEN** machine and `ShipmentDataStore` identify that place as active
- **AND** source context and allocations remain unchanged

#### Scenario: Unknown transport place preserves the active selection

- **WHEN** a resolved transport-place ID is absent from `ShipmentDataStore`
- **THEN** the orchestrator reports a typed selection error
- **AND** the previous active transport place and source context remain unchanged
