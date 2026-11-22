import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import ProtectedRoute from "./components/ProtectedRoute";
import Services from "./pages/Services";
import ServicesList from "./pages/ServicesList";
import BookingFlow from "./pages/BookingFlow";
import MyBookings from "./pages/MyBookings";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAppointments from "./pages/AdminAppointments";
import AdminShopHours from "./pages/AdminShopHours";

export default function App() {
  return (
    <>
      <Navbar />
      <div className="container mt-4 flex-grow-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/services" element={<ServicesList />} />
          <Route path="/booking" element={<BookingFlow />} />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute>
                <MyBookings />
              </ProtectedRoute>
            }
          />

          {/* Area admin: layout con sidebar + controllo del ruolo a monte */}
          <Route
            element={
              <ProtectedRoute role="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin-area" element={<AdminDashboard />} />
            <Route path="/admin/appointments" element={<AdminAppointments />} />
            <Route path="/admin/services" element={<Services />} />
            <Route path="/admin/orari" element={<AdminShopHours />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <footer className="app-footer text-center small py-4 mt-4">
        © 2026 DacciUnTaglio, Via Roma 12, Milano
        <span className="d-none d-sm-inline"> — </span>
        <span className="d-block d-sm-inline mt-1 mt-sm-0">
          Tel.{" "}
          <a href="tel:+393331234567" className="text-decoration-none">
            +39 333 1234567
          </a>
        </span>
      </footer>
    </>
  );
}
