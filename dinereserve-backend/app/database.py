from motor.motor_asyncio import AsyncIOMotorClient
from app.config import MONGO_URI, DATABASE_NAME
 
client = AsyncIOMotorClient(MONGO_URI)
db = client[DATABASE_NAME]
 
customers_collection  = db["customers"]
admins_collection     = db["admins"]
restaurants_collection = db["restaurants"]
tables_collection     = db["tables"]
bookings_collection   = db["bookings"]
reviews_collection    = db["reviews"]
menu_collection       = db["menu_items"]
