
import { Link, useNavigate } from "react-router-dom";

function Navbar() {

    const navigate = useNavigate();
    const role = localStorage.getItem("role");

    const dashboardPath = {
        admin: "/admin-dashboard",
        manager: "/manager-dashboard",
        employee: "/employee-dashboard"
    };

    const logout = () => {

        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("role");

        navigate("/");
    };

    return (

        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">

            <div className="container-fluid">

                <Link
                    className="navbar-brand fw-bold"
                    to={dashboardPath[role] || "/"}
                >
                    ProjectFlow
                </Link>

                <div className="navbar-nav me-auto">

                    <Link
                        className="nav-link"
                        to={dashboardPath[role] || "/"}
                    >
                        Dashboard
                    </Link>

                    {role === "admin" && (
                        <Link className="nav-link" to="/users">
                            User Management
                            </Link>
                        )}

                    {(role === "admin" || role === "manager") && (
                        <>
                            <Link className="nav-link" to="/projects">
                                Projects
                            </Link>

                            <Link className="nav-link" to="/tasks">
                                Tasks
                            </Link>

                            <Link className="nav-link" to="/teams">
                            Teams 
                            </Link>
                        </>
                    )}

                </div>

                <span className="text-white me-3">
                    {role?.toUpperCase()}
                </span>

                <button
                    className="btn btn-danger"
                    onClick={logout}
                >
                    Logout
                </button>

            </div>

        </nav>
    );
}

export default Navbar;
