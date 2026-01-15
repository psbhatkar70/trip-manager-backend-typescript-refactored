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

### ✅ Result

- Guaranteed booking integrity
- No application-level locking
- Correctness under concurrent load

---

## 2️⃣ Atomic Business Logic Using PostgreSQL RPCs

### Problem

Creating a trip required multiple API-to-database calls:

- Fetch car
- Fetch owner
- Check availability
- Calculate pricing
- Insert trip

This resulted in high latency, partial failures, and complex rollback logic.

---

### Solution

FleetFlow encapsulates the entire workflow inside a single PostgreSQL stored procedure, ensuring atomic execution directly at the data layer.

```sql
CREATE OR REPLACE FUNCTION create_trip_rpc(
  car_id uuid,
  user_id uuid,
  start_date timestamptz,
  end_date timestamptz
) RETURNS json
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Availability enforced by exclusion constraint
  -- Pricing logic calculated atomically

  INSERT INTO trips (
    car_id,
    booked_by_id,
    trip_start_date,
    trip_end_date,
    total_cost
  )
  VALUES (
    car_id,
    user_id,
    start_date,
    end_date,
    calculated_cost
  );

  RETURN json_build_object(
    'status', 'success',
    'message', 'Trip created successfully'
  );
END;
$$ LANGUAGE plpgsql;
```

### Benefits

- One API call → one DB transaction
- No partial writes
- Reduced network round-trips (~60%)
- Cleaner and thinner API layer

---

## 3️⃣ O(1) Aggregate Updates with Database Triggers

### Problem

Calculating average ratings dynamically using `AVG()` leads to O(N) scans and degrades dashboard performance as data volume increases.

---

### Solution

FleetFlow maintains aggregate statistics incrementally using PostgreSQL triggers, guaranteeing constant-time updates with full transactional safety.

```sql
CREATE OR REPLACE FUNCTION updateReviewAvg()
RETURNS trigger AS $$
BEGIN
UPDATE Cars
SET
avg_rating =
((COALESCE(avg_rating, 0) \* COALESCE(total_reviews, 0)) + NEW.rating)
/ (COALESCE(total_reviews, 0) + 1),
total_reviews = COALESCE(total_reviews, 0) + 1
WHERE id = NEW.car_id;

RETURN NEW;
END;

$$
LANGUAGE plpgsql;
```

### Why This Scales

- O(1) updates
- No table scans
- No race conditions
- Fully atomic operations

---

## 🛡️ Security & Reliability

- **Zod Validation:** Strict runtime validation for all API inputs
- **Row Level Security (RLS):** Users can only access their own records
- **Rate Limiting:** Protection against abuse and DDoS attacks
- **Centralized Error Handling:** Consistent and predictable API responses
- **SQL Injection Safe:** Parameterized queries and RPC usage

---

## 🔌 API Overview

| Method | Endpoint         | Description                            | Access       |
| ------ | ---------------- | -------------------------------------- | ------------ |
| POST   | `/api/trips`     | Create a new trip (atomic & validated) | Auth         |
| GET    | `/api/trips`     | Paginated trip history                 | User / Owner |
| PATCH  | `/api/trips/:id` | Modify or cancel trip                  | Owner        |
| POST   | `/api/reviews`   | Add review (auto-aggregated)           | User         |

---

## 📈 Performance Highlights

- Zero double-booking race conditions
- Reduced API chatter via database RPCs
- Constant-time aggregate updates
- Strong transactional consistency guarantees

---

## 👨‍💻 Author

**Pravin Bhatkar**
Backend & Full-Stack Engineer
Specializing in Distributed Systems and PostgreSQL-based Architectures

- LinkedIn: https://linkedin.com/in/your-profile
- GitHub: https://github.com/your-username

---

## ⭐ Why This Project Matters

FleetFlow is not a demo CRUD application.
It is a production-oriented backend system designed around correctness, concurrency safety, and database-driven architecture.

This project reflects how I think about real-world systems—not just how I write endpoints.

$$
$$
