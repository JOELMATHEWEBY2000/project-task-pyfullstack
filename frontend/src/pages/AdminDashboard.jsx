import { useEffect, useState } from "react";
import API from "../services/api";

function getList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
}

function getUserRole(user) {
    if (user.is_superuser) return "admin";
    return (user.role || "employee").toLowerCase();
}

function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError("");

                const [userRes, projectRes, taskRes] =
                    await Promise.all([
                        API.get("auth/users/"),
                        API.get("projects/"),
                        API.get("tasks/")
                    ]);

                setUsers(getList(userRes.data));
                setProjects(getList(projectRes.data));
                setTasks(getList(taskRes.data));

            } catch (error) {
                console.error("Admin dashboard error:", error);
                setError(
                    "Unable to load dashboard data. Please check your backend API."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="container-fluid p-4">
                <div className="text-center mt-5">
                    <div className="spinner-border text-primary" />
                    <p className="mt-3">Loading Admin Dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container-fluid p-4">
                <div className="alert alert-danger">
                    {error}
                    <button
                        className="btn btn-sm btn-outline-danger ms-3"
                        onClick={() => window.location.reload()}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // User role calculations
    const admins = users.filter(
        user => getUserRole(user) === "admin"
    ).length;

    const managers = users.filter(
        user => getUserRole(user) === "manager"
    ).length;

    const employees = users.filter(
        user => getUserRole(user) === "employee"
    ).length;

    // Project calculations
    const activeProjects = projects.filter(
        project => project.status === "active"
    ).length;

    const completedProjects = projects.filter(
        project => project.status === "completed"
    ).length;

    const planningProjects = projects.filter(
        project => project.status === "planning"
    ).length;

    // Task calculations
    const completedTasks = tasks.filter(
        task => task.status === "completed"
    ).length;

    const pendingTasks = tasks.filter(
        task => task.status === "todo"
    ).length;

    const inProgressTasks = tasks.filter(
        task => task.status === "in_progress"
    ).length;

    // Use local date to avoid UTC date differences
    const now = new Date();

    const today = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
    ].join("-");

    const overdueTasks = tasks.filter(task =>
        task.due_date &&
        task.status !== "completed" &&
        task.due_date < today
    ).length;

    // Task completion percentage
    const completionPercentage = tasks.length
        ? Math.round((completedTasks / tasks.length) * 100)
        : 0;

    // Dashboard statistics
    const stats = [
        {
            title: "Total Users",
            value: users.length,
            color: "primary"
        },
        {
            title: "Admins",
            value: admins,
            color: "dark"
        },
        {
            title: "Managers",
            value: managers,
            color: "info"
        },
        {
            title: "Employees",
            value: employees,
            color: "secondary"
        },
        {
            title: "Total Projects",
            value: projects.length,
            color: "success"
        },
        {
            title: "Active Projects",
            value: activeProjects,
            color: "primary"
        },
        {
            title: "Total Tasks",
            value: tasks.length,
            color: "info"
        },
        {
            title: "Completed Tasks",
            value: completedTasks,
            color: "success"
        },
        {
            title: "Pending Tasks",
            value: pendingTasks,
            color: "warning"
        },
        {
            title: "Overdue Tasks",
            value: overdueTasks,
            color: "danger"
        }
    ];

    const getStatusBadge = (status) => {
        const colors = {
            active: "success",
            planning: "warning",
            completed: "primary",
            todo: "secondary",
            in_progress: "info"
        };

        return (
            <span className={`badge bg-${colors[status] || "secondary"}`}>
                {(status || "unknown").replace("_", " ")}
            </span>
        );
    };

    const getRoleBadge = (role) => {
    const normalizedRole = (role || "employee").toLowerCase();

    const roleLabels = {
        admin: "Admin",
        manager: "Manager",
        employee: "Employee"
    };

    const colors = {
        admin: "danger",
        manager: "primary",
        employee: "success"
    };

    return (
        <span className={`badge bg-${colors[normalizedRole] || "secondary"}`}>
            {roleLabels[normalizedRole] || normalizedRole}
        </span>
    );
};

    // Most recent records, if created_at is available
    const recentProjects = [...projects]
        .sort((a, b) =>
            new Date(b.created_at || 0) - new Date(a.created_at || 0)
        )
        .slice(0, 5);

    const recentUsers = users
    .filter(user => getUserRole(user) === "employee")
    .sort((a, b) =>
        new Date(b.date_joined || 0) -
        new Date(a.date_joined || 0)
    )
    .slice(0, 5);

    return (
        <div className="container-fluid p-4">

            {/* Dashboard Header */}
            <div className="mb-4">
                <h2 className="fw-bold">Admin Dashboard</h2>
                <p className="text-muted">
                    Organization-wide management and analytics
                </p>
            </div>

            {/* Statistics Cards */}
            <div className="row g-3">
                {stats.map(item => (
                    <div
                        className="col-12 col-sm-6 col-xl-3"
                        key={item.title}
                    >
                        <div className="card shadow-sm border-0 h-100">
                            <div className="card-body">
                                <p className="text-muted mb-2">
                                    {item.title}
                                </p>

                                <h2 className={`text-${item.color} fw-bold mb-0`}>
                                    {item.value}
                                </h2>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Project and Task Summary */}
            <div className="row mt-4 g-3">

                <div className="col-lg-6">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body">
                            <h5 className="fw-bold mb-3">
                                Project Overview
                            </h5>

                            <div className="mb-3">
                                <div className="d-flex justify-content-between">
                                    <span>Active Projects</span>
                                    <strong>{activeProjects}</strong>
                                </div>
                                <div className="progress">
                                    <div
                                        className="progress-bar bg-success"
                                        style={{
                                            width: `${
                                                projects.length
                                                    ? activeProjects / projects.length * 100
                                                    : 0
                                            }%`
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="mb-3">
                                <div className="d-flex justify-content-between">
                                    <span>Planning Projects</span>
                                    <strong>{planningProjects}</strong>
                                </div>
                                <div className="progress">
                                    <div
                                        className="progress-bar bg-warning"
                                        style={{
                                            width: `${
                                                projects.length
                                                    ? planningProjects / projects.length * 100
                                                    : 0
                                            }%`
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="d-flex justify-content-between">
                                    <span>Completed Projects</span>
                                    <strong>{completedProjects}</strong>
                                </div>
                                <div className="progress">
                                    <div
                                        className="progress-bar bg-primary"
                                        style={{
                                            width: `${
                                                projects.length
                                                    ? completedProjects / projects.length * 100
                                                    : 0
                                            }%`
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-lg-6">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body">
                            <h5 className="fw-bold mb-3">
                                Task Completion
                            </h5>

                            <h2 className="text-success fw-bold">
                                {completionPercentage}%
                            </h2>

                            <div className="progress mb-3" style={{ height: "12px" }}>
                                <div
                                    className="progress-bar bg-success"
                                    style={{
                                        width: `${completionPercentage}%`
                                    }}
                                />
                            </div>

                            <div className="d-flex justify-content-between">
                                <span>Completed</span>
                                <strong>{completedTasks}</strong>
                            </div>

                            <div className="d-flex justify-content-between">
                                <span>In Progress</span>
                                <strong>{inProgressTasks}</strong>
                            </div>

                            <div className="d-flex justify-content-between">
                                <span>Pending</span>
                                <strong>{pendingTasks}</strong>
                            </div>

                            <div className="d-flex justify-content-between">
                                <span>Overdue</span>
                                <strong className="text-danger">
                                    {overdueTasks}
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Projects and Users */}
            <div className="row mt-4 g-3">

                {/* Recent Projects */}
                <div className="col-lg-6">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body">
                            <h5 className="fw-bold mb-3">
                                Recent Projects
                            </h5>

                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead>
                                        <tr>
                                            <th>Project</th>
                                            <th>Manager</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {recentProjects.length > 0 ? (
                                            recentProjects.map(project => (
                                                <tr key={project.id}>
                                                    <td>{project.name}</td>
                                                    <td>
                                                        {project.manager_name || "-"}
                                                    </td>
                                                    <td>
                                                        {getStatusBadge(project.status)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="3" className="text-center text-muted py-4">
                                                    No projects available
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Users */}
                <div className="col-lg-6">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body">
                            <h5 className="fw-bold mb-3">
                                Recent Employees
                            </h5>

                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead>
                                        <tr>
                                            <th>Username</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {recentUsers.length > 0 ? (
                                            recentUsers.map(user => (
                                                <tr key={user.id}>
                                                    <td>{user.username}</td>
                                                    <td>{user.email}</td>
                                                    <td>
                                                        {getRoleBadge(getUserRole(user))}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="3" className="text-center text-muted py-4">
                                                    No users available
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default AdminDashboard;
