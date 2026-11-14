
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";

// Authentication pages
import Login from "./pages/Login";
import Register from "./pages/Register";

// Dashboard pages
import AdminDashboard from "./pages/AdminDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";

// Application pages
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import AdminUsers from "./pages/AdminUsers";
import Teams from "./pages/Teams";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes - all authenticated users */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={["admin", "manager", "employee"]}
            />
          }
        >
          <Route element={<DashboardLayout />}>
            {/* Admin dashboard */}
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin"]} />
              }
            >
              <Route index element={<AdminDashboard />} />
            </Route>

            {/* Manager dashboard */}
            <Route
              path="/manager-dashboard"
              element={
                <ProtectedRoute allowedRoles={["manager"]} />
              }
            >
              <Route index element={<ManagerDashboard />} />
            </Route>

            {/* Employee dashboard */}
            <Route
              path="/employee-dashboard"
              element={
                <ProtectedRoute allowedRoles={["employee"]} />
              }
            >
              <Route index element={<EmployeeDashboard />} />
            </Route>

            {/* Projects - Admin and Manager */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["admin", "manager"]}
                />
              }
            >
              <Route path="/projects" element={<Projects />} />
              <Route path="/teams" element={<Teams />} />
            </Route>

            {/* Tasks - All roles */}
            <Route path="/tasks" element={<Tasks />} />

            {/* Admin-only user management */}
            <Route
              element={
                <ProtectedRoute allowedRoles={["admin"]} />
              }
            >
              <Route path="/users" element={<AdminUsers />} />
            </Route>

            {/* Notifications - All roles */}
            <Route
              path="/notifications"
              element={<Notifications />}
            />

            {/* Profile - All roles */}
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Redirect unknown routes to the correct dashboard */}
        <Route
          path="*"
          element={<RoleRedirect />}
        />
      </Routes>
    </BrowserRouter>
  );
}

function RoleRedirect() {
  const token = localStorage.getItem("access");
  const role = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  const dashboardPaths = {
    admin: "/admin-dashboard",
    manager: "/manager-dashboard",
    employee: "/employee-dashboard",
  };

  return (
    <Navigate
      to={dashboardPaths[role] || "/"}
      replace
    />
  );
}

export default App;
