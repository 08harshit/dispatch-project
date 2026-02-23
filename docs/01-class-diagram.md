# Class Diagram (Domain Model)

Domain model in Mermaid: current state (as implemented) and target state (with Contract, Vehicle, Trip, VehicleAccess, Chat, Invoice, etc.).

---

## Current State (As Implemented)

```mermaid
classDiagram
    class Admin {
        +role: "admin"
    }
    class Courier {
        +id
        +name
        +email
        +available_capacity
        +is_available
    }
    class Shipper {
        +id
        +name
        +contact_email
        +business_type
    }
    class Lead {
        +id
        +pickup_address
        +delivery_address
        +vehicle_*
        +initial_price
        +status
    }
    class Negotiation {
        +lead_id
        +courier_id
        +status
        +current_offer
        +counter_count
        +*_deadline
    }
    class Offer {
        +negotiation_id
        +offered_by
        +amount
        +response
    }
    class LoadNotification {
        +shipper_id
        +pickup_*
        +delivery_*
        +vehicle_*
        +price
        +status
        +expires_at
    }
    class LoadOffer {
        +notification_id
        +courier_id
        +offer_price
        +status
    }
    class Load {
        +shipper_id
        +courier_id
        +vehicle_*
        +status
    }
    class Ticket {
        +title
        +priority
        +status
    }

    Shipper "1" --> "*" Lead : creates
    Lead "1" --> "*" Negotiation : has
    Courier "1" --> "*" Negotiation : participates
    Negotiation "1" --> "*" Offer : has
    Shipper "1" --> "*" LoadNotification : creates
    LoadNotification "1" --> "*" LoadOffer : has
    Courier "1" --> "*" LoadOffer : submits
    Load "0..1" --> Shipper : shipper_id
    Load "0..1" --> Courier : courier_id
    Admin --> Courier : manages
    Admin --> Shipper : manages
    Admin --> Load : manages
    Admin --> Ticket : manages
```

---

## Target State (With New Domain Concepts)

```mermaid
classDiagram
    class Admin {
        +role: "admin"
        +impersonate(userId)
    }
    class Courier {
        +id
        +name
        +email
        +profile
    }
    class Shipper {
        +id
        +name
        +contact_email
        +profile
    }
    class Vehicle {
        +id
        +shipper_id
        +reg_no
        +type
        +capacity
        +goods_type
    }
    class Lead {
        +id
        +shipper_id
        +vehicle_*
        +pickup_*
        +delivery_*
        +price
        +status
    }
    class Contract {
        +id
        +courier_id
        +shipper_id
        +lead_id
        +vehicle_id
        +amount
        +wef_dt
        +exp_dt
        +status
    }
    class Trip {
        +id
        +contract_id
        +status
        +started_at
        +ended_at
    }
    class TripLeg {
        +id
        +trip_id
        +vehicle_id
        +segment_*
    }
    class VehicleAccess {
        +id
        +vehicle_id
        +courier_id
        +wef_dt
        +exp_dt
        +is_active
    }
    class ChatSession {
        +id
        +contract_id
        +expires_at
    }
    class ChatMessage {
        +id
        +session_id
        +sender_id
        +text
        +created_at
    }
    class Negotiation {
        +lead_id
        +courier_id
        +status
        +*_deadline
    }
    class Offer {
        +negotiation_id
        +offered_by
        +amount
    }
    class Invoice {
        +id
        +contract_id
        +trip_id
        +amount
        +generated_at
    }
    class NotificationEvent {
        +type
        +contract_id
        +trip_id
        +sent_at
    }

    Shipper "1" --> "*" Vehicle : owns
    Shipper "1" --> "*" Lead : creates
    Lead "1" --> "*" Negotiation : has
    Courier "1" --> "*" Negotiation : participates
    Negotiation "1" --> "*" Offer : has
    Negotiation "1" --> "0..1" Contract : becomes
    Contract "1" --> "1" Trip : has
    Contract "1" --> "1" ChatSession : has
    Contract "1" --> "0..1" Invoice : has
    Trip "1" --> "*" TripLeg : "smart planner"
    Contract "1" --> "*" VehicleAccess : grants
    Vehicle "1" --> "*" VehicleAccess : has
    Courier "1" --> "*" VehicleAccess : receives
    ChatSession "1" --> "*" ChatMessage : has
    Contract "1" --> "*" NotificationEvent : triggers
    Admin --> Courier : "view as"
    Admin --> Shipper : "view as"
```

---

## Notes

- **Current**: No Contract, Vehicle, Trip, VehicleAccess, Chat, or Invoice; Lead/Negotiation/Offer and LoadNotification/LoadOffer represent the shipper-post, courier-bid flow.
- **Target**: Contract links Courier and Shipper to a Vehicle and time window; VehicleAccess is time-bound (wef_dt, exp_dt); Trip (and optional TripLeg for smart planner) links to Contract; ChatSession has expires_at for time-limited bidding/chat; Invoice is generated from Contract/Trip; NotificationEvent represents lifecycle emails (agreement, trip start/end, etc.).
