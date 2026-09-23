## REMOVED Requirements

### Requirement: Isolated in-memory store

**Reason**: The requirement describes the removed `ShipmentStore`; the active
`ShipmentDataStore` has its own snapshot lifecycle specification.

**Migration**: Consumers use `ShipmentDataStore` and `setSnapshot(snapshot)`.
