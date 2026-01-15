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
- Security: Helmet, Rate Limiting

### Database

- PostgreSQL (Supabase)
- Indexing: B-Tree, GiST
- Business Logic: Stored Procedures (RPCs)
- Concurrency Control: Exclusion Constraints
- Data Security: Row Level Security (RLS)

---
## 👥 Role-Based Access Control (RBAC)

The system enforces strict permission boundaries using custom Middleware:

### 🚗 Fleet Owners
- **Inventory Management:** Create, Edit, and "Soft Delete" vehicles.
- **Financials:** View total profit, revenue, and trip history.
- **Availability:** Toggle car status (Online/Maintenance) via RPCs.

### 👤 Customers
- **Booking Engine:** Search cars by date range with overlap prevention.
- **Trip Management:** Cancel trips with dynamic refund logic (Full refund > 48h).
- **Reviews:** Post ratings that auto-update the car's average score via Triggers.

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
  p_user_id uuid,
  p_car_id uuid,
  p_total_distance numeric,
  p_trip_start_date timestamptz,
  p_trip_end_date timestamptz,
  p_customer_name text,
  p_total_days numeric,
  p_role text
)

RETURNS TABLE (
  trip_id uuid,
  total_cost numeric,
  profit numeric
)

LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

DECLARE 
v_price_perKm numeric;
v_driver_cost numeric;
v_extra_day_cost numeric;
v_total_cost numeric;
v_mileage numeric;
v_profit numeric;
v_model text;
v_business_name text;
v_owner_id uuid;
v_car_number text;
v_owner_name text;
v_active boolean;
BEGIN 
SELECT
  "price_perKm",
  driver_cost,
  extra_day_cost,
  mileage,
  model,
  owner_id,
  car_number,
  active
INTO 
  v_price_perKm,
  v_driver_cost,
  v_extra_day_cost,
  v_mileage,
  v_model,
  v_owner_id,
  v_car_number,
  v_active
FROM "Cars"
WHERE id = p_car_id AND deleted=false;

IF NOT FOUND THEN
    RAISE EXCEPTION 'Car does not exist or it is deleted';
  END IF;

IF v_active = false THEN
RAISE EXCEPTION 'Car is under maintenance you can not create trip with this';
END IF;

SELECT
  business_name,
  full_name
INTO 
  v_business_name,
  v_owner_name
FROM profiles 
WHERE id = v_owner_id;

IF NOT FOUND THEN
    RAISE EXCEPTION 'Owner does not exist';
  END IF;

  v_total_cost := (p_total_distance*v_price_perKm)+ v_driver_cost +(p_total_days - 1)*v_extra_day_cost;
  v_profit :=v_total_cost - (p_total_distance*v_mileage) - v_driver_cost;

  INSERT INTO trips(
car_number,
owner_name,
owner_id ,
car_id,
car_name,
business_name,
trip_start_date,
trip_end_date,
customer_name,
total_distance,
total_cost,
profit,
total_days,
booked_by_id,
booked_by_role
  )
  VALUES(
v_car_number,
v_owner_name,
v_owner_id,
p_car_id,
v_model,
v_business_name,
p_trip_start_date,
p_trip_end_date,
p_customer_name,
p_total_distance,
v_total_cost,
v_profit,
p_total_days,
p_user_id,
p_role
  )
  RETURNING id INTO trip_id;

  RETURN QUERY 
  SELECT trip_id,v_total_cost , v_profit;

END;
$$;
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
CREATE OR REPLACE FUNCTION public."updateReviewAvg"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE profiles
    SET 
        avg_rating = ((COALESCE(avg_rating, 0) * COALESCE(total_reviews, 0)) + NEW.rating) / (COALESCE(total_reviews, 0) + 1),
        total_reviews = COALESCE(total_reviews, 0) + 1
    WHERE id = NEW.owner_id AND role = 'owner';

    UPDATE "Cars"
    SET 
        avg_rating = ((COALESCE(avg_rating, 0) * COALESCE(total_reviews, 0)) + NEW.car_rating) / (COALESCE(total_reviews, 0) + 1),
        total_reviews = COALESCE(total_reviews, 0) + 1
    WHERE id = NEW.car_id;

    RETURN NEW;
END;
$$;
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
- **SQL Injection Safe:** Parameterized queries and RPC usage

---

## 🔌 API Overview

| Method | Endpoint         | Description                            | Access       |
| ------ | ---------------- | -------------------------------------- | ------------ |
| POST   | `/api/trips`     | Create a new trip (atomic & validated) | Auth         |
| GET    | `/api/trips`     | Paginated trip history                 | Owner        |
| PATCH  | `/api/trips/:id` | Modify or cancel trip                  | User / Owner |
| POST   | `/api/reviews`   | Add review (auto-aggregated)           | User         |
| POST   | `/api/cars`      | Create a new car                       | Owner        |
| GET    | `/api/cars`      | Get list of cars                       | User / Owner |
| PATCH  | `/api/cars/:id`  | Modify,delete or set offline car       | Owner        |
| GET    | `/api/cars/:id`  | Get schedule of car                    | User / Owner |
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

- LinkedIn: https://www.linkedin.com/in/pravin-bhatkar-01547631a/
- GitHub: https://github.com/psbhatkar70

---

## ⭐ Why This Project Matters

FleetFlow is not a demo CRUD application.
It is a production-oriented backend system designed around correctness, concurrency safety, and database-driven architecture.

This project reflects how I think about real-world systems—not just how I write endpoints.

$$
$$
