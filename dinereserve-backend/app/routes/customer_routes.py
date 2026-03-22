from fastapi import APIRouter, HTTPException, Depends
from app.schemas.user_schema import CustomerRegister, CustomerLogin
from app.database import (
    customers_collection,
    bookings_collection,
    restaurants_collection,
    tables_collection,
)
from app.utils.password import hash_password, verify_password
from app.utils.auth import create_access_token, verify_token
from datetime import datetime, date
from bson import ObjectId

router = APIRouter(prefix="/api/customer", tags=["Customer"])


@router.post("/register")
async def register(data: CustomerRegister):
    existing = await customers_collection.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    hashed = hash_password(data.password)
    await customers_collection.insert_one({
        "name":       data.name,
        "email":      data.email,
        "password":   hashed,
        "created_at": datetime.utcnow()
    })
    return {"message": "Registered successfully"}


@router.post("/login")
async def login(data: CustomerLogin):
    user = await customers_collection.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    if not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    token = create_access_token({"id": str(user["_id"]), "role": "customer"})
    return {"token": token}


@router.get("/profile")
async def profile(user=Depends(verify_token)):
    customer = await customers_collection.find_one({"_id": ObjectId(user["id"])})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    total_bookings = await bookings_collection.count_documents({"customer_id": user["id"]})
    return {
        "name":           customer["name"],
        "email":          customer["email"],
        "total_bookings": total_bookings
    }


@router.get("/bookings")
async def get_my_bookings(user=Depends(verify_token)):
    bookings_list = []
    async for booking in bookings_collection.find({"customer_id": user["id"]}):
        restaurant = await restaurants_collection.find_one({
            "_id": ObjectId(booking["restaurant_id"])
        })
 
        table = await tables_collection.find_one({
            "_id": ObjectId(booking["table_id"])
        }) if booking.get("table_id") else None
 
        booking_date = booking.get("date", "")
        stored_status = booking.get("status", "")
 
        if stored_status in ("cancelled", "no_show", "completed"):
            status = stored_status
        elif booking_date < str(date.today()):
            status = "completed"
        else:
            status = "Pending"
        bookings_list.append({
            "booking_id":      booking.get("booking_id", str(booking["_id"])),
            "restaurant_id":   str(booking["restaurant_id"]),
            "restaurant_name": restaurant["name"] if restaurant else "Unknown",
            "table_name":      table["name"] if table else "",
            "date":            booking_date,
            "time":            str(booking.get("time", "")),
            "guests":          booking.get("guests", 0),
            "notes":           booking.get("notes", ""),
            "status":          status
        })
    return bookings_list


@router.delete("/bookings/{booking_id}")
async def cancel_booking(booking_id: str, user=Depends(verify_token)):
    booking = await bookings_collection.find_one({"booking_id": booking_id})

    if not booking:
        try:
            booking = await bookings_collection.find_one({"_id": ObjectId(booking_id)})
        except Exception:
            booking = None

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["customer_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    await bookings_collection.delete_one({"_id": booking["_id"]})
    return {"message": "Booking cancelled successfully"}


@router.post("/logout")
async def logout():
    return {"message": "Logged out successfully"}
