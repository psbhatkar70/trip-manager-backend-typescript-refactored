# 🚛 FleetFlow

### High-Performance Vehicle Logistics & Scheduling Backend

> **FleetFlow is a backend-first SaaS system architected for data integrity, concurrency safety, and transactional correctness.**
>
> Unlike typical CRUD applications, FleetFlow pushes critical business logic into PostgreSQL to guarantee **ACID compliance**, eliminate race conditions, and scale reliably under concurrent load.

![System Architecture](https://via.placeholder.com/900x400?text=FleetFlow+System+Architecture)

---

## 🚀 Overview

FleetFlow is a vehicle logistics and trip-scheduling platform designed to handle real-world concurrency problems such as double bookings, inconsistent pricing, and slow analytical queries.

Instead of relying on fragile API-layer checks, FleetFlow enforces correctness at the database level using PostgreSQL constraints, stored procedures, and triggers. This design reduces network round-trips, simplifies the API layer, and ensures correctness under high contention.

---

## 🧠 Core Engineering Principles

- Database as the Source of Truth
- Fail-Fast Integrity Enforcement
- Atomic Transactions Over Eventual Fixes
- Scalability Through Correctness

---

## 🛠 Tech Stack & Architecture

### Backend

- Runtime: Node.js (Express)
- Language: TypeScript (Strict Mode)
- Validation: Zod (Runtime Schema Validation)
- Security: Helmet, Rate Limiting, Centralized Error Handling

### Database

- PostgreSQL (Supabase)
- Indexing: B-Tree, GiST
- Business Logic: Stored Procedures (RPCs)
- Concurrency Control: Exclusion Constraints
- Data Security: Row Level Security (RLS)

---

## 💡 Key Architectural Decisions

---

### 1️⃣ Preventing Double-Booking with Database-Level Constraints

#### Problem

In distributed systems, checking availability in the API layer is unsafe. Two concurrent requests can pass an availability check before either transaction commits, resulting in overlapping bookings.

#### Solution

FleetFlow enforces exclusivity directly inside PostgreSQL using an Exclusion Constraint backed by a GiST index. The database itself rejects overlapping time ranges, eliminating race conditions entirely.

```sql
ALTER TABLE trips
ADD CONSTRAINT prevent_overlap
EXCLUDE USING gist (
  car_id WITH =,
  tstzrange(trip_start_date, trip_end_date, '[]') WITH &&
);
```
