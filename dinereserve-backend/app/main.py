from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.customer_routes import router as customer_router
from app.routes.restaurant_routes import router as restaurant_router
from app.routes.booking_routes import router as booking_router
from app.routes.admin_routes import router as admin_router
from app.routes.report_routes import router as report_router
from app.routes.ai_routes import router as ai_router
from app.routes.chat_routes import router as chat_router
from app.routes.recommendation_routes import router as recommendation_router
 
app = FastAPI()
 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
app.include_router(customer_router)
app.include_router(restaurant_router)
app.include_router(booking_router)
app.include_router(admin_router)
app.include_router(report_router)
app.include_router(ai_router)
app.include_router(chat_router)
app.include_router(recommendation_router)
 
@app.get("/")
def home():
    return {"message": "DineReserve API running"}