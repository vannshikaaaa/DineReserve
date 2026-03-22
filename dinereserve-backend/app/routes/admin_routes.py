from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from app.schemas.user_schema import AdminRegister, AdminLogin
from app.database import (
    admins_collection,
    restaurants_collection,
    tables_collection,
    bookings_collection,
    customers_collection,
)
from app.utils.password import hash_password, verify_password
from app.utils.auth import create_access_token, verify_token
from bson import ObjectId
from datetime import datetime
 
router = APIRouter(prefix="/api/admin")
 
 
@router.post("/register")
async def register_admin(data: AdminRegister):
    restaurant = await restaurants_collection.find_one({
        "name": data.restaurant_name,
        "restaurant_unique_password": data.restaurant_unique_password
    })
    if not restaurant:
        raise HTTPException(status_code=400, detail="Invalid restaurant credentials")
    existing = await admins_collection.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Admin already exists")
    hashed = hash_password(data.password)
    await admins_collection.insert_one({
        "email":         data.email,
        "password":      hashed,
        "restaurant_id": str(restaurant["_id"])
    })
    return {"message": "Admin registered successfully"}
 
 
@router.post("/login")
async def login_admin(data: AdminLogin):
    admin = await admins_collection.find_one({"email": data.email})
    if not admin:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    if not verify_password(data.password, admin["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    restaurant = await restaurants_collection.find_one({
        "_id": ObjectId(admin["restaurant_id"]),
        "restaurant_unique_password": data.restaurant_unique_password
    })
    if not restaurant:
        raise HTTPException(status_code=400, detail="Invalid restaurant password")
    token = create_access_token({
        "id":            str(admin["_id"]),
        "role":          "admin",
        "restaurant_id": admin["restaurant_id"]
    })
    return {"token": token}
 
 
@router.post("/tables")
async def add_table(data: dict, user=Depends(verify_token)):
    if user["role"] != "admin":
        raise HTTPException(status_code=401, detail="Unauthorized")
    table = {
        "restaurant_id": user["restaurant_id"],
        "name":          data["name"],
        "seats":         int(data["seats"])
    }
    await tables_collection.insert_one(table)
    return {"message": "Table added successfully"}
 
 
@router.get("/tables")
async def get_tables(user=Depends(verify_token)):
    if user["role"] != "admin":
        raise HTTPException(status_code=401, detail="Unauthorized")
    today  = datetime.now().strftime("%Y-%m-%d")
    tables = []
    async for table in tables_collection.find({"restaurant_id": user["restaurant_id"]}):
        booking = await bookings_collection.find_one({
            "table_id": str(table["_id"]),
            "date":     today
        })
        status = "Available"
        if booking:
            status = f"Booked at {booking['time']}"
        tables.append({
            "_id":    str(table["_id"]),
            "name":   table["name"],
            "seats":  table["seats"],
            "status": status
        })
    return tables
 
 
@router.get("/dashboard")
async def dashboard(user=Depends(verify_token)):
    if user["role"] != "admin":
        raise HTTPException(status_code=401, detail="Unauthorized")
    today = datetime.now().strftime("%Y-%m-%d")
 
    today_bookings = await bookings_collection.find({
        "restaurant_id": user["restaurant_id"],
        "date":          today
    }).to_list(100)
 
    today_reservations = len(today_bookings)
    booked_tables   = len(set([b.get("table_id", "") for b in today_bookings if b.get("table_id")]))
    expected_guests = sum([b.get("guests", 0) for b in today_bookings])
 
    all_bookings = await bookings_collection.find({
        "restaurant_id": user["restaurant_id"]
    }).to_list(1000)
 
    total_guests = sum([b.get("guests", 0) for b in all_bookings])
    unique_days  = set([b["date"] for b in all_bookings if b.get("date")])
    total_days   = len(unique_days)
    avg_guests   = round(total_guests / total_days, 2) if total_days > 0 else 0
 
    hour_count = {}
    for b in all_bookings:
        # FIX 3: safely parse hour — handles "19:00", "19", or missing time
        raw_time = str(b.get("time", "12:00"))
        hour     = raw_time.split(":")[0].zfill(2)          # always 2 digits e.g. "09"
        hour_count[hour] = hour_count.get(hour, 0) + 1
 
    peak_hours = "N/A"
    if hour_count:
        peak_hour  = max(hour_count, key=hour_count.get)
        try:
            # FIX 3 continued: safe int conversion with fallback
            next_hour  = int(peak_hour) + 1
            peak_hours = f"{peak_hour}:00 - {next_hour:02d}:00"
        except ValueError:
            peak_hours = f"{peak_hour}:00"
 
    return {
        "today_reservations": today_reservations,
        "booked_tables":      booked_tables,
        "expected_guests":    expected_guests,
        "no_shows":           0,
        "peak_hours":         peak_hours,
        "avg_guests":         avg_guests
    }
 
 
@router.get("/bookings")
async def get_bookings_by_date(
    date: Optional[str] = None,
    user=Depends(verify_token)
):
    if user["role"] != "admin":
        raise HTTPException(status_code=401, detail="Unauthorized")
 
    query_date = date or datetime.now().strftime("%Y-%m-%d")
 
    raw_bookings = await bookings_collection.find({
        "restaurant_id": user["restaurant_id"],
        "date":          query_date
    }).to_list(200)
 
    customer_ids = list(set([b.get("customer_id") for b in raw_bookings if b.get("customer_id")]))
    customer_map = {}
    for cid in customer_ids:
        try:
            customer = await customers_collection.find_one({"_id": ObjectId(cid)})
            if customer:
                customer_map[cid] = customer.get("name", "Guest")
        except Exception:
            pass
 
    table_ids = list(set([b.get("table_id") for b in raw_bookings if b.get("table_id")]))
    table_map = {}
    for tid in table_ids:
        try:
            table = await tables_collection.find_one({"_id": ObjectId(tid)})
            if table:
                table_map[tid] = table.get("name", "Table")
        except Exception:
            pass
 
    bookings = []
    for b in raw_bookings:
        cid = b.get("customer_id", "")
        tid = b.get("table_id", "")
        bookings.append({
            "_id":           str(b["_id"]),
            "customer_id":   cid,
            "customer_name": customer_map.get(cid, "Guest"),
            "table_id":      tid,
            "table_name":    table_map.get(tid, "Table"),
            "date":          b.get("date", ""),
            "time":          str(b.get("time", "12:00")),
            "guests":        b.get("guests", 2),
            "notes":         b.get("notes", ""),
            "status":        b.get("status", "Pending"),
        })
    return bookings
 
 
@router.get("/reports")
async def reports(user=Depends(verify_token)):
    if user["role"] != "admin":
        raise HTTPException(status_code=401, detail="Unauthorized")
    pipeline = [
        {"$match": {"restaurant_id": user["restaurant_id"]}},
        {"$group": {"_id": "$date", "count": {"$sum": 1}}},
        {"$sort":  {"_id": 1}}
    ]
    results = await bookings_collection.aggregate(pipeline).to_list(100)
    return {
        "labels":   [r["_id"]   for r in results],
        "bookings": [r["count"] for r in results]
    }
 
