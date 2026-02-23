# Dispatche-Project Documentation

In-depth documentation for the dispatch-project: current state, target domain and schema, flows, architecture, and roles.

---

## Index

| Document | Description |
|----------|-------------|
| [00-current-state.md](00-current-state.md) | Current codebase: flow (shipper-post, courier-bid), entities, architecture, auth |
| [01-class-diagram.md](01-class-diagram.md) | Class diagram: current and target domain model (Mermaid) |
| [02-er-diagram.md](02-er-diagram.md) | ER diagram: target schema, enums, indexes, current vs target migration map |
| [03-entities.md](03-entities.md) | Entity document: purpose, lifecycle, attributes, ownership, business rules |
| [04-flows.md](04-flows.md) | Flows: current (v1), optional (courier catalog, courier-post/shipper-bid), time-limited chat |
| [05-microservices.md](05-microservices.md) | Microservices: current, Option A (monolith), Option B (split), recommendation |
| [06-module-connectivity.md](06-module-connectivity.md) | How modules connect (monolith diagram, optional Edge Functions, future split) |
| [07-architecture-decision.md](07-architecture-decision.md) | Why not microservices; when to revisit |
| [08-roles-and-access.md](08-roles-and-access.md) | Roles (Admin, Courier, Shipper), impersonation, RLS patterns, API matrix |
| [09-reference-mappings.md](09-reference-mappings.md) | Company feature to Dispatche mapping (vehicle-cross-access, alerts, location, invoice, Plus) |

---

## Quick reference

- **Current flow**: Shipper posts leads/loads; couriers are notified and bid; negotiation leads to acceptance. No contract/vehicle-access/trip/invoice entities yet.
- **Target**: Add Contract, Vehicle, Trip, VehicleAccess, ChatSession/ChatMessage, Invoice, vehicle_locations, notification_log; time-based access and lifecycle notifications.
- **Architecture**: Monolith (Express) + Supabase; optional Edge Functions for notifications and access revoke. No microservices for v1.
- **Roles**: Admin (full + impersonation), Courier (own contracts/trips/access/chat), Shipper (own vehicles/leads/contracts/chat).
