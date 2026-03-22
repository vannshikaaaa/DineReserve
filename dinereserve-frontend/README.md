# DineReserve Frontend

Restaurant Reservation System (Frontend)

## Tech Stack

- React (Vite)
- Axios
- React Router DOM
- Chart.js
- Basic CSS

---

## Installation

1. npm create vite@latest dinereserve-frontend
2. cd dinereserve-frontend
3. npm install
4. npm install axios react-router-dom chart.js
5. npm run dev

Open:
http://localhost:5173

---

## Backend Base URL

Edit file:
src/api/axios.js

Change:

baseURL: "http://localhost:8000/api/"

If backend port changes, modify here.

---

## Authentication

Token stored in:

localStorage.setItem("token", response.data.token)

Interceptor automatically attaches:

Authorization: Bearer <token>

---

## 401 Handling

If backend returns 401:
- Token removed
- Redirect to /login

Handled inside axios.js

---

## Expected Behavior

- Landing page → choose Guest or Operator
- Guest flow → Register → Login → Home → Book
- Admin flow → Register → Login → Dashboard → Manage Tables → Reports

---

## Common Errors

CORS error:
Enable CORS in backend.

Network Error:
Backend not running.

401:
Token invalid or expired.

---

Project ready for backend integration.