import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import RestaurantDetails from "./pages/RestaurantDetails";
import TableBooking from "./pages/TableBooking";
import ThankYou from "./pages/ThankYou";
import Profile from "./pages/Profile";
import MyBookings from "./pages/MyBookings";
import AdminLogin from "./pages/AdminLogin";
import AdminRegister from "./pages/AdminRegister";
import AdminDashboard from "./pages/AdminDashboard";
import ManageTables from "./pages/ManageTables";
import Reports from "./pages/Reports";
import Chatbot from "./components/Chatbot";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"                  element={<LandingPage />}     />
        <Route path="/login"             element={<Login />}           />
        <Route path="/register"          element={<Register />}        />
        <Route path="/home"              element={<Home />}            />
        <Route path="/restaurant/:id"    element={<RestaurantDetails />} />
        <Route path="/restaurant/:id/book" element={<TableBooking />} />
        <Route path="/thankyou"          element={<ThankYou />}        />
        <Route path="/profile"           element={<Profile />}         />
        <Route path="/bookings"          element={<MyBookings />}      />
        <Route path="/admin-login"       element={<AdminLogin />}      />
        <Route path="/admin-register"    element={<AdminRegister />}   />
        <Route path="/admin-dashboard"   element={<AdminDashboard />}  />
        <Route path="/manage-tables"     element={<ManageTables />}    />
        <Route path="/reports"           element={<Reports />}         />
      </Routes>

      <Chatbot />
    </>
  );
}

export default App;