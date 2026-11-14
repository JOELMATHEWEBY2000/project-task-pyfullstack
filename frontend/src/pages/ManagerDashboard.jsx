
import { useEffect, useState } from "react";
import API from "../services/api";

function getList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
}

function getId(value) {
    return typeof value === "object" ? value?.id : value;
}

function ManagerDashboard() {
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [teams, setTeams] = useState([]);
    const [user, setUser] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError("");

                const [projectRes, taskRes, teamRes, userRes] =
                    await Promise.all([
                        API.get("projects/"),
                        API.get("tasks/"),
                        API.get("teams/"),
                        API.get("auth/profile/")
                    ]);

                setProjects(getList(projectRes.data));
                setTasks(getList(taskRes.data));
                setTeams(getList(teamRes.data));
                setUser(userRes.data);

            } catch (err) {
                console.error(
                    "Manager dashboard error:",
                    err.response?.data || err
                );

                setError(
                    "Unable to load manager dashboard data. Check your API endpoints and permissions."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="container-fluid p-4 text-center">
                <div className="spinner-border text-primary" />
                <p className="mt-3">Loading Manager Dashboard...</p>
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

    // Project statistics
    const activeProjects = projects.filter(
        project => project.status === "active"
    ).length;

    const completedProjects = projects.filter(
        project => project.status === "completed"
    ).length;

    const planningProjects = projects.filter(
        project => project.status === "planning"
    ).length;

    // Task statistics
    const completedTasks = tasks.filter(
        task => task.status === "completed"
    ).length;

    const pendingTasks = tasks.filter(
        task => task.status === "todo"
    ).length;

    const inProgressTasks = tasks.filter(
        task => task.status === "in_progress"
    ).length;

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

    // Unique team members
    const teamMembers = new Set();

    teams.forEach(team => {
        (team.members || []).forEach(member => {
            const id = getId(member);
            if (id !== undefined && id !== null) {
                teamMembers.add(id);
            }
        });
    });

    // Completion percentage
    const completionPercentage = tasks.length
        ? Math.round((completedTasks / tasks.length) * 100)
        : 0;

    // Dashboard statistics
    const stats = [
        {
            title: "My Projects",
            value: projects.length,
            color: "primary"
        },
        {
            title: "Active Projects",
            value: activeProjects,
            color: "success"
        },
        {
            title: "My Teams",
            value: teams.length,
            color: "info"
        },
        {
            title: "Team Members",
            value: teamMembers.size,
            color: "secondary"
        },
        {
            title: "Total Tasks",
            value: tasks.length,
            color: "primary"
        },
        {
            title: "To Do",
            value: pendingTasks,
            color: "warning"
        },
        {
            title: "In Progress",
            value: inProgressTasks,
            color: "info"
        },
        {
            title: "Completed Tasks",
            value: completedTasks,
            color: "success"
        },
        {
            title: "Overdue Tasks",
            value: overdueTasks,
            color: "danger"
        }
    ];

    const getStatusBadge = (status) => {
        const colors = {
            planning: "warning",
            active: "success",
            completed: "primary",
            todo: "secondary",
            in_progress: "info",
            high: "danger",
            medium: "warning",
            low: "success"
        };

        return (
            <span className={`badge bg-${colors[status] || "secondary"}`}>
                {(status || "unknown").replace("_", " ")}
            </span>
        );
    };

    // Get tasks for a project
    const getProjectTasks = (projectId) => {
        return tasks.filter(
            task => String(getId(task.project)) === String(projectId)
        );
    };

    // Project progress
    const recentProjects = [...projects].sort(
        (a, b) =>
            new Date(b.created_at || 0) -
            new Date(a.created_at || 0)
    );

    const recentTasks = [...tasks]
        .sort(
            (a, b) =>
                new Date(b.created_at || 0) -
                new Date(a.created_at || 0)
        )
        .slice(0, 5);

    return (
        <div className="container-fluid p-4">

            {/* Header */}
            <div className="mb-4">
                <h2 className="fw-bold">Manager Dashboard</h2>
                <p className="text-muted">
                    Welcome, <strong>{user?.username || "Manager"}</strong>.
                    Monitor your projects, teams and task performance.
                </p>
            </div>

            {/* Statistics */}
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
                                <h2 className={`fw-bold text-${item.color} mb-0`}>
                                    {item.value}
                                </h2>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Project and Task Overview */}
            <div className="row g-3 mt-3">

                <div className="col-lg-6">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body">
                            <h5 className="fw-bold mb-3">
                                Project Overview
                            </h5>

                            {[
                                ["Active Projects", activeProjects, "success"],
                                ["Planning Projects", planningProjects, "warning"],
                                ["Completed Projects", completedProjects, "primary"]
                            ].map(([label, value, color]) => (
                                <div className="mb-3" key={label}>
                                    <div className="d-flex justify-content-between">
                                        <span>{label}</span>
                                        <strong>{value}</strong>
                                    </div>
                                    <div className="progress">
                                        <div
                                            className={`progress-bar bg-${color}`}
                                            style={{
                                                width: `${
                                                    projects.length
                                                        ? value / projects.length * 100
                                                        : 0
                                                }%`
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="col-lg-6">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body">
                            <h5 className="fw-bold mb-3">
                                Task Performance
                            </h5>

                            <h2 className="text-success fw-bold">
                                {completionPercentage}%
                            </h2>

                            <div className="progress mb-3" style={{ height: "12px" }}>
                                <div
                                    className="progress-bar bg-success"
                                    style={{ width: `${completionPercentage}%` }}
                                />
                            </div>

                            <div className="d-flex justify-content-between mb-2">
                                <span>Completed</span>
                                <strong>{completedTasks}</strong>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span>In Progress</span>
                                <strong>{inProgressTasks}</strong>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span>To Do</span>
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

            {/* My Teams */}
            <div className="card shadow-sm border-0 mt-4">
                <div className="card-body">
                    <h5 className="fw-bold mb-3">My Teams</h5>

                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead>
                                <tr>
                                    <th>Team Name</th>
                                    <th>Description</th>
                                    <th>Team Members</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teams.length > 0 ? (
                                    teams.map(team => (
                                        <tr key={team.id}>
                                            <td className="fw-semibold">
                                                {team.name}
                                            </td>
                                            <td>{team.description || "-"}</td>
                                            <td>
                                                {team.member_names?.length ??
                                                    team.members?.length ?? 0}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="text-center text-muted py-4">
                                            No teams assigned.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* My Projects */}
            <div className="card shadow-sm border-0 mt-4">
                <div className="card-body">
                    <h5 className="fw-bold mb-3">My Projects</h5>

                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead>
                                <tr>
                                    <th>Project</th>
                                    <th>Team Size</th>
                                    <th>Status</th>
                                    <th>End Date</th>
                                    <th>Tasks</th>
                                    <th>Progress</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentProjects.length > 0 ? (
                                    recentProjects.map(project => {
                                        const projectTasks = getProjectTasks(project.id);
                                        const completed = projectTasks.filter(
                                            task => task.status === "completed"
                                        ).length;

                                        const progress = projectTasks.length
                                            ? Math.round(completed / projectTasks.length * 100)
                                            : 0;

                                        return (
                                            <tr key={project.id}>
                                                <td className="fw-semibold">
                                                    {project.name}
                                                </td>
                                                <td>
                                                    {project.member_names?.length ??
                                                        project.members?.length ?? 0}
                                                </td>
                                                <td>{getStatusBadge(project.status)}</td>
                                                <td>{project.end_date || "-"}</td>
                                                <td>{projectTasks.length}</td>
                                                <td style={{ minWidth: "130px" }}>
                                                    <small>{progress}%</small>
                                                    <div className="progress">
                                                        <div
                                                            className="progress-bar bg-success"
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center text-muted py-4">
                                            No projects available.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Recent Tasks */}
            <div className="card shadow-sm border-0 mt-4">
                <div className="card-body">
                    <h5 className="fw-bold mb-3">Recent Tasks</h5>

                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead>
                                <tr>
                                    <th>Task</th>
                                    <th>Project</th>
                                    <th>Assigned To</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Due Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTasks.length > 0 ? (
                                    recentTasks.map(task => (
                                        <tr key={task.id}>
                                            <td>{task.title}</td>
                                            <td>{task.project_name || "-"}</td>
                                            <td>{task.assigned_name || "-"}</td>
                                            <td>{getStatusBadge(task.priority)}</td>
                                            <td>{getStatusBadge(task.status)}</td>
                                            <td>{task.due_date || "-"}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center text-muted py-4">
                                            No tasks available.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
    );
}

export default ManagerDashboard;
