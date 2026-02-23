# ER Diagram (Database)

Target schema and relation to current schema. Diagrams are in Mermaid.

---

## Target Schema (Canonical)

```mermaid
erDiagram
    auth_users ||--o| profiles : "has"
    auth_users ||--o| couriers : "auth"
    auth_users ||--o| shippers : "auth"

    profiles {
        uuid user_id PK
        text display_name
        text role
        timestamptz created_at
    }

    couriers {
        uuid id PK
        uuid user_id FK
        text name
        text contact_email
        text phone
        text address
        enum status
        enum compliance
        timestamptz created_at
        timestamptz updated_at
    }

    shippers {
        uuid id PK
        uuid user_id FK
        text name
        text contact_email
        text business_type
        enum status
        enum compliance
        timestamptz created_at
        timestamptz updated_at
    }

    vehicles {
        uuid id PK
        uuid shipper_id FK
        text reg_no
        text vehicle_type
        text goods_type
        numeric capacity
        boolean is_available
        timestamptz created_at
        timestamptz updated_at
    }

    leads {
        uuid id PK
        uuid shipper_id FK
        text pickup_address
        text delivery_address
        text vehicle_year
        text vehicle_make
        text vehicle_model
        numeric initial_price
        text status
        timestamptz created_at
        timestamptz updated_at
    }

    negotiations {
        uuid id PK
        uuid lead_id FK
        uuid courier_id FK
        enum status
        numeric current_offer
        integer counter_count
        timestamptz negotiation_expires_at
        timestamptz created_at
        timestamptz updated_at
    }

    offers {
        uuid id PK
        uuid negotiation_id FK
        text offered_by
        numeric amount
        text response
        timestamptz created_at
    }

    contracts {
        uuid id PK
        uuid courier_id FK
        uuid shipper_id FK
        uuid lead_id FK
        uuid vehicle_id FK
        numeric amount
        timestamptz wef_dt
        timestamptz exp_dt
        enum contract_status
        timestamptz signed_at
        timestamptz created_at
        timestamptz updated_at
    }

    trips {
        uuid id PK
        uuid contract_id FK
        enum trip_status
        timestamptz started_at
        timestamptz ended_at
        timestamptz created_at
        timestamptz updated_at
    }

    trip_legs {
        uuid id PK
        uuid trip_id FK
        uuid vehicle_id FK
        integer sequence
        text segment_info
        timestamptz created_at
    }

    vehicle_access {
        uuid id PK
        uuid vehicle_id FK
        uuid courier_id FK
        uuid contract_id FK
        timestamptz wef_dt
        timestamptz exp_dt
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    chat_sessions {
        uuid id PK
        uuid contract_id FK
        timestamptz expires_at
        timestamptz created_at
    }

    chat_messages {
        uuid id PK
        uuid session_id FK
        uuid sender_id FK
        text text
        timestamptz created_at
    }

    invoices {
        uuid id PK
        uuid contract_id FK
        uuid trip_id FK
        numeric amount
        text storage_path
        timestamptz generated_at
        timestamptz created_at
    }

    vehicle_locations {
        uuid id PK
        uuid vehicle_id FK
        numeric lat
        numeric lng
        timestamptz updated_at
    }

    notification_log {
        uuid id PK
        text event_type
        uuid contract_id FK
        uuid trip_id FK
        uuid recipient_id FK
        text channel
        timestamptz sent_at
    }

    loads {
        uuid id PK
        uuid shipper_id FK
        uuid courier_id FK
        enum load_status
        timestamptz created_at
    }

    tickets {
        uuid id PK
        text title
        enum priority
        enum status
        timestamptz created_at
    }

    ticket_comments {
        uuid id PK
        uuid ticket_id FK
        text author
        text text
        timestamptz created_at
    }

    shippers ||--o{ vehicles : owns
    shippers ||--o{ leads : creates
    leads ||--o{ negotiations : has
    couriers ||--o{ negotiations : participates
    negotiations ||--o{ offers : has
    negotiations ||--o| contracts : "becomes"
    contracts }o--|| trips : has
    contracts ||--o{ vehicle_access : grants
    vehicles ||--o{ vehicle_access : has
    couriers ||--o{ vehicle_access : receives
    contracts ||--o| chat_sessions : has
    chat_sessions ||--o{ chat_messages : has
    contracts ||--o{ invoices : has
    trips ||--o{ invoices : has
    vehicles ||--o{ vehicle_locations : "current"
    contracts ||--o{ notification_log : triggers
    trips ||--o{ trip_legs : "smart planner"
    vehicles ||--o{ trip_legs : assigned
```

---

## Enums (Target)

| Enum | Values |
|------|--------|
| `contract_status` | draft, signed, active, completed, cancelled |
| `trip_status` | scheduled, in_progress, completed, cancelled |
| `vehicle_access_status` | active, expired, revoked |
| `negotiation_status` | pending, negotiating, accepted, declined, expired, timeout |
| `load_status` | pending, in-transit, delivered, cancelled |
| `ticket_status` | open, in-progress, resolved, closed |
| `ticket_priority` | low, medium, high, urgent |

---

## Indexes (Recommended)

- `contracts(courier_id)`, `contracts(shipper_id)`, `contracts(exp_dt)`
- `vehicle_access(vehicle_id)`, `vehicle_access(courier_id)`, `vehicle_access(exp_dt)`, `vehicle_access(is_active)`
- `trips(contract_id)`, `trips(trip_status)`
- `chat_sessions(contract_id)`, `chat_sessions(expires_at)`
- `vehicle_locations(vehicle_id)`, `vehicle_locations(updated_at)`
- `notification_log(contract_id)`, `notification_log(sent_at)`

---

## Current vs Target Migration Map

| Current | Target | Action |
|---------|--------|--------|
| `auth.users` | Same | Keep |
| `profiles` | Same + optional `role` | Migrate if needed |
| `couriers` (Shipper + Admin schemas) | Single `couriers` + `user_id` to auth | Consolidate, add `user_id` |
| `shippers` | Same + `user_id` to auth | Add `user_id` |
| `leads` | Same (or rename to `shipment_requests`) | Keep; ensure `shipper_id` |
| `negotiations`, `offers` | Same | Keep |
| `load_notifications`, `load_offers` | Keep or consolidate with leads/negotiations | Document overlap; optionally merge |
| `loads` | Same | Keep (admin operational load) |
| (none) | `vehicles` | **New** table |
| (none) | `contracts` | **New** table |
| (none) | `trips` | **New** table |
| (none) | `trip_legs` | **New** (smart planner) |
| (none) | `vehicle_access` | **New** table |
| (none) | `chat_sessions`, `chat_messages` | **New** tables |
| (none) | `invoices` | **New** table |
| (none) | `vehicle_locations` | **New** table |
| (none) | `notification_log` | **New** table |
| `tickets`, `ticket_comments` | Same | Keep |
