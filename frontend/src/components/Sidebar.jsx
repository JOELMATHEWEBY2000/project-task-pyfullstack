
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaFolder,
  FaTasks,
  FaUsers,
  FaUserCircle,
  FaBell,
  FaSignOutAlt,
  FaUsersCog
} from "react-icons/fa";

function Sidebar({ isOpen, closeSidebar }) {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const dashboardPaths = {
    admin: "/admin-dashboard",
    manager: "/manager-dashboard",
    employee: "/employee-dashboard",
  };

  const links = [
    {
      label: "Dashboard",
      path: dashboardPaths[role],
      icon: <FaHome />,
      roles: ["admin", "manager", "employee"],
    },
    {
      label: "Projects",
      path: "/projects",
      icon: <FaFolder />,
      roles: ["admin", "manager"],
    },
    {
      label: "Tasks",
      path: "/tasks",
      icon: <FaTasks />,
      roles: ["admin", "manager", "employee"],
    },
    {
      label: "Users",
      path: "/users",
      icon: <FaUsers />,
      roles: ["admin"],
    },
    {
      label: "Teams",
      path: "/teams",
      icon: <FaUsersCog />,
      roles: ["admin", "manager"],
    },
    {
      label: "Notifications",
      path: "/notifications",
      icon: <FaBell />,
      roles: ["admin", "manager", "employee"],
    },
    {
      label: "Profile",
      path: "/profile",
      icon: <FaUserCircle />,
      roles: ["admin", "manager", "employee"],
    },
  ];

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeSidebar}
        />
      )}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <h3>ProjectFlow</h3>
          <small>Project Management</small>
        </div>

        <div className="sidebar-user">
          <FaUserCircle size={35} />
          <div>
            <strong>{role?.toUpperCase()}</strong>
            <small>Workspace</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          {links
            .filter((link) => link.roles.includes(role))
            .map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
              >
                {link.icon}
                <span>{link.label}</span>
              </NavLink>
            ))}
        </nav>

        <button
          className="sidebar-logout"
          onClick={logout}
        >
          <FaSignOutAlt />
          Logout
        </button>
      </aside>
    </>
  );
}

export default Sidebar;
