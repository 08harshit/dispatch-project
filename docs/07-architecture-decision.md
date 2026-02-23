# Architecture Decision: Should We Follow Microservice Architecture?

**Decision: No (for now).** Use a **monolith + Supabase** for Dispatche-Project. This section records the reasoning and when to revisit.

---

## 1. Why Not Microservices (for This Project)

1. **Single team, single product, limited scale**  
   A monolith is faster to build, debug, and deploy. Splitting into many services adds deployment, monitoring, and debugging overhead without clear benefit at current scope.

2. **Consistency**  
   Contracts, vehicle access, and trips share the same database. Keeping them in one app and one DB avoids distributed transactions and eventual consistency issues. A single transaction can create a contract and the corresponding vehicle_access rows.

3. **Supabase as the backbone**  
   Supabase already provides Auth, Realtime, and Postgres. Adding multiple services would mean either sharing one DB (and still having one logical backend) or splitting the DB (complexity and consistency cost). One backend that uses Supabase is the simplest fit.

4. **Sufficient structure without microservices**  
   "Microservice-like" separation can be achieved with clear **modules** (route groups and services) inside the monolith and, if needed, one or two **Supabase Edge Functions** (e.g. notifications, access revoke). That gives boundaries and optional async workers without the cost of full microservices.

---

## 2. When to Revisit (Criteria for Splitting)

Consider moving to a more distributed or microservice-style architecture only if one or more of the following become true:

- **Multiple teams** owning different domains (e.g. one team for contracts/trips, another for notifications), and they need independent release cycles and scaling.
- **Independent scaling** of one domain (e.g. notification volume or location ingestion) without scaling the rest of the app.
- **Regulatory or isolation** requirements (e.g. payment or PII in a separate service with stricter controls).
- **Technology mismatch** (e.g. a heavy background job stack that does not fit well in the same process as the API).

Until then, the monolith + Supabase plus optional Edge Functions remains the recommended architecture.

---

## 3. Documented Decision

| Item | Decision |
|------|----------|
| **Architecture** | Monolith (Express) + Supabase (Postgres, Auth, Realtime). |
| **Modules** | Logical modules inside the monolith (contracts, vehicle-access, trips, invoices, notifications, etc.). |
| **Async jobs** | Implement via Supabase Edge Functions (e.g. notification worker, vehicle access revoker) triggered by DB or cron, not by adding a separate microservice. |
| **Revisit** | If multiple teams, independent scaling needs, regulatory isolation, or technology mismatch justify splitting. |

This should be updated if the project scope or team structure changes significantly.
