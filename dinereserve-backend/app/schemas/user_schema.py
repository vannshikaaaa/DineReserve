from pydantic import BaseModel, EmailStr
 
class CustomerRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
 
class CustomerLogin(BaseModel):
    email: EmailStr
    password: str
 
class AdminRegister(BaseModel):
    email: EmailStr
    password: str
    restaurant_name: str
    restaurant_unique_password: str
 
class AdminLogin(BaseModel):
    email: EmailStr
    password: str
    restaurant_unique_password: str
