
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import {
    FaBars,
    FaMoon,
    FaSun,
    FaUserCircle,
    FaTimes
} from "react-icons/fa";

import Sidebar from "./Sidebar";
import API from "../services/api";
import { useTheme } from "../context/ThemeContext";

import "../styles/sidebar.css";

function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);

    const { theme, toggleTheme } = useTheme();

    // Load logged-in user profile
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const response = await API.get("auth/profile/");
                setUser(response.data);
            } catch (error) {
                console.error("Unable to load user profile:", error);
            } finally {
                setLoadingUser(false);
            }
        };

        loadProfile();
    }, []);

    // Close sidebar
    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    // Toggle sidebar
    const toggleSidebar = () => {
        setSidebarOpen(previous => !previous);
    };

    return (
        <div className="dashboard-layout">

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar */}
            <Sidebar
                isOpen={sidebarOpen}
                closeSidebar={closeSidebar}
            />

            {/* Main Dashboard */}
            <main className="main-content">

                {/* Responsive Top Navigation */}
                <header className="topbar">

                    {/* Left section */}
                    <div className="topbar-left">

                        <button
                            type="button"
                            className="menu-toggle"
                            onClick={toggleSidebar}
                            aria-label="Toggle navigation menu"
                            aria-expanded={sidebarOpen}
                        >
                            {sidebarOpen ? (
                                <FaTimes />
                            ) : (
                                <FaBars />
                            )}
                        </button>

                        <div className="workspace-title">
                            <h5>
                                ProjectFlow Workspace
                            </h5>

                            <small>
                                Project and Task Management
                            </small>
                        </div>

                    </div>

                    {/* Right section */}
                    <div className="topbar-actions">

                        {/* Theme Toggle */}
                        <button
                            type="button"
                            className="btn btn-outline-secondary theme-toggle"
                            onClick={toggleTheme}
                            title={
                                theme === "light"
                                    ? "Switch to dark mode"
                                    : "Switch to light mode"
                            }
                            aria-label="Toggle theme"
                        >
                            {theme === "light" ? (
                                <FaMoon />
                            ) : (
                                <FaSun />
                            )}

                            <span>
                                {theme === "light"
                                    ? "Dark Mode"
                                    : "Light Mode"}
                            </span>
                        </button>

                        {/* User Profile */}
                        <div className="user-profile-header">

                            <FaUserCircle
                                className="user-avatar"
                                size={30}
                            />

                            <div className="user-details">

                                <strong>
                                    {loadingUser
                                        ? "Loading..."
                                        : user?.username || "User"}
                                </strong>

                                <small>
                                    {user?.role
                                        ? user.role.charAt(0).toUpperCase() +
                                          user.role.slice(1)
                                        : "Workspace User"}
                                </small>

                            </div>

                        </div>

                    </div>

                </header>

                {/* Page Content */}
                <div className="page-content">
                    <Outlet />
                </div>

                {/* Footer */}
                <footer className="dashboard-footer">
                    <span>
                        © {new Date().getFullYear()} ProjectFlow.
                        All rights reserved.
                    </span>
                </footer>

            </main>

        </div>
    );
}

export default DashboardLayout;
