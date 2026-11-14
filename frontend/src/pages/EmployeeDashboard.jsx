
import { useEffect, useState } from "react";
import API from "../services/api";

function getList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
}

function getLocalDate() {
    const date = new Date();

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");
}

function EmployeeDashboard() {
    const [tasks, setTasks] = useState([]);
    const [user, setUser] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingTask, setUpdatingTask] = useState(null);

    // Fetch dashboard data
    const fetchData = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            setError("");

            const [taskRes, userRes] = await Promise.all([
                API.get("tasks/"),
                API.get("auth/profile/")
            ]);

            setTasks(getList(taskRes.data));
            setUser(userRes.data);

        } catch (error) {
            console.error("Employee dashboard error:", error);
            setError("Unable to load your dashboard data.");
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Update task status
    const updateStatus = async (id, status) => {
        const previousTasks = tasks;

        try {
            setUpdatingTask(id);
            setError("");

            // Update UI immediately
            setTasks(current =>
                current.map(task =>
                    task.id === id
                        ? { ...task, status }
                        : task
                )
            );

            await API.patch(`tasks/${id}/status/`, {
                status
            });

            // Refresh tasks without showing the full-page loader
            await fetchData(false);

        } catch (error) {
            console.error("Task status update error:", error);

            // Restore previous task data
            setTasks(previousTasks);

            setError(
                error.response?.data?.detail ||
                "Unable to update task status. Please try again."
            );

        } finally {
            setUpdatingTask(null);
        }
    };

    if (loading) {
        return (
            <div className="container-fluid p-4 text-center">
                <div className="spinner-border text-primary" />
                <p className="mt-3">Loading Employee Dashboard...</p>
            </div>
        );
    }

    if (error && tasks.length === 0) {
        return (
            <div className="container-fluid p-4">
                <div className="alert alert-danger">
                    {error}
                    <button
                        className="btn btn-sm btn-outline-danger ms-3"
                        onClick={() => fetchData()}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Task statistics
    const todo = tasks.filter(
        task => task.status === "todo"
    ).length;

    const inProgress = tasks.filter(
        task => task.status === "in_progress"
    ).length;

    const completed = tasks.filter(
        task => task.status === "completed"
    ).length;

    const today = getLocalDate();

    // Overdue tasks
    const overdueTasks = tasks.filter(task =>
        task.due_date &&
        task.status !== "completed" &&
        task.due_date < today
    );

    // Upcoming tasks
    const upcomingTasks = tasks
        .filter(task =>
            task.due_date &&
            task.status !== "completed" &&
            task.due_date >= today
        )
        .sort((a, b) =>
            a.due_date.localeCompare(b.due_date)
        );

    // Task completion percentage
    const completionPercentage = tasks.length
        ? Math.round((completed / tasks.length) * 100)
        : 0;

    // Priority badge
    const getPriorityBadge = priority => {
        const colors = {
            low: "success",
            medium: "warning",
            high: "danger"
        };

        return (
            <span className={`badge bg-${colors[priority] || "secondary"}`}>
                {priority || "Not set"}
            </span>
        );
    };

    // Status badge
    const getStatusBadge = status => {
        const colors = {
            todo: "secondary",
            in_progress: "info",
            completed: "success"
        };

        const labels = {
            todo: "To Do",
            in_progress: "In Progress",
            completed: "Completed"
        };

        return (
            <span className={`badge bg-${colors[status] || "secondary"}`}>
                {labels[status] || status}
            </span>
        );
    };

    // Dashboard cards
    const stats = [
        {
            title: "Total Tasks",
            value: tasks.length,
            color: "primary"
        },
        {
            title: "To Do",
            value: todo,
            color: "warning"
        },
        {
            title: "In Progress",
            value: inProgress,
            color: "info"
        },
        {
            title: "Completed",
            value: completed,
            color: "success"
        },
        {
            title: "Overdue",
            value: overdueTasks.length,
            color: "danger"
        }
    ];

    return (
        <div className="container-fluid p-4">

            {/* Dashboard Header */}
            <div className="mb-4">
                <h2 className="fw-bold">
                    Welcome, {user?.username || "Employee"}
                </h2>

                <p className="text-muted">
                    Here is your personal task overview.
                </p>
            </div>

            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}

            {/* Statistics Cards */}
            <div className="row g-3 mb-4">
                {stats.map(item => (
                    <div
                        className="col-12 col-sm-6 col-xl"
                        key={item.title}
                    >
                        <div className="card shadow-sm border-0 h-100">
                            <div className="card-body">
                                <p className="text-muted mb-2">
                                    {item.title}
                                </p>

                                <h2 className={`fw-bold text-${item.color} mb-0`}>
                                    {item.value}
                                </h2>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Completion Progress */}
            <div className="card shadow-sm border-0 mb-4">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <h5 className="fw-bold mb-0">
                            My Task Progress
                        </h5>

                        <h5 className="text-success fw-bold mb-0">
                            {completionPercentage}%
                        </h5>
                    </div>

                    <div className="progress" style={{ height: "12px" }}>
                        <div
                            className="progress-bar bg-success"
                            style={{
                                width: `${completionPercentage}%`
                            }}
                        />
                    </div>

                    <small className="text-muted mt-2 d-block">
                        {completed} out of {tasks.length} tasks completed
                    </small>
                </div>
            </div>

            {/* Overdue Alert */}
            {overdueTasks.length > 0 && (
                <div className="alert alert-danger d-flex justify-content-between align-items-center">
                    <div>
                        <strong>Overdue Tasks!</strong>
                        <div>
                            You have {overdueTasks.length} overdue task(s).
                            Please review them.
                        </div>
                    </div>

                    <span className="badge bg-danger fs-6">
                        {overdueTasks.length}
                    </span>
                </div>
            )}

            {/* My Tasks */}
            <div className="card shadow-sm border-0 mb-4">
                <div className="card-body">
                    <h4 className="fw-bold mb-3">My Tasks</h4>

                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>Task</th>
                                    <th>Project</th>
                                    <th>Priority</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                    <th>Update Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {tasks.length > 0 ? (
                                    tasks.map(task => (
                                        <tr key={task.id}>
                                            <td className="fw-semibold">
                                                {task.title}
                                            </td>

                                            <td>
                                                {task.project_name || "-"}
                                            </td>

                                            <td>
                                                {getPriorityBadge(task.priority)}
                                            </td>

                                            <td>
                                                {task.due_date || "-"}
                                            </td>

                                            <td>
                                                {getStatusBadge(task.status)}
                                            </td>

                                            <td style={{ minWidth: "160px" }}>
                                                <select
                                                    className="form-select"
                                                    value={task.status}
                                                    disabled={updatingTask === task.id}
                                                    onChange={e =>
                                                        updateStatus(
                                                            task.id,
                                                            e.target.value
                                                        )
                                                    }
                                                >
                                                    <option value="todo">
                                                        To Do
                                                    </option>

                                                    <option value="in_progress">
                                                        In Progress
                                                    </option>

                                                    <option value="completed">
                                                        Completed
                                                    </option>
                                                </select>

                                                {updatingTask === task.id && (
                                                    <small className="text-muted">
                                                        Updating...
                                                    </small>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="text-center text-muted py-4"
                                        >
                                            No tasks assigned yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Overdue Tasks List */}
            {overdueTasks.length > 0 && (
                <div className="card shadow-sm border-0 mb-4">
                    <div className="card-body">
                        <h4 className="fw-bold text-danger mb-3">
                            Overdue Tasks
                        </h4>

                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Task</th>
                                        <th>Project</th>
                                        <th>Due Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {overdueTasks.map(task => (
                                        <tr key={task.id}>
                                            <td>{task.title}</td>
                                            <td>{task.project_name || "-"}</td>
                                            <td className="text-danger">
                                                {task.due_date}
                                            </td>
                                            <td>
                                                {getStatusBadge(task.status)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Upcoming Deadlines */}
            <div className="card shadow-sm border-0 mb-4">
                <div className="card-body">
                    <h4 className="fw-bold mb-3">
                        Upcoming Deadlines
                    </h4>

                    {upcomingTasks.length === 0 ? (
                        <p className="text-muted mb-0">
                            No upcoming tasks.
                        </p>
                    ) : (
                        <ul className="list-group list-group-flush">
                            {upcomingTasks.map(task => (
                                <li
                                    key={task.id}
                                    className="list-group-item d-flex justify-content-between align-items-center flex-wrap gap-2"
                                >
                                    <div>
                                        <strong>{task.title}</strong>

                                        <small className="text-muted d-block">
                                            {task.project_name || "Project"}
                                        </small>
                                    </div>

                                    <div className="d-flex align-items-center gap-2">
                                        {getPriorityBadge(task.priority)}

                                        <span className="badge bg-primary">
                                            {task.due_date}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

        </div>
    );
}

export default EmployeeDashboard;
