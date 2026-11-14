import { Navigate, Outlet } from "react-router-dom";

function ProtectedRoute({ allowedRoles }) {
  const token = localStorage.getItem("access");
  const role = localStorage.getItem("role");

  const dashboardPaths = {
    admin: "/admin-dashboard",
    manager: "/manager-dashboard",
    employee: "/employee-dashboard",
  };

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <Navigate
        to={dashboardPaths[role] || "/"}
        replace
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;
