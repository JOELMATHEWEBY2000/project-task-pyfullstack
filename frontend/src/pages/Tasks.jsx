import { useEffect, useState } from "react";
import API from "../services/api";
import { exportCSV } from "../utils/exportCSV";

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [editingId, setEditingId] = useState(null);

  const role = localStorage.getItem("role");
  const canManage = ["admin", "manager"].includes(role);

  const emptyForm = {
    title: "",
    description: "",
    project: "",
    team: "",
    priority: "medium",
    status: "todo",
    due_date: "",
  };

  const [form, setForm] = useState(emptyForm);

  // Handle normal and paginated DRF responses
  const getList = (data) => {
    if (Array.isArray(data)) return data;
    return data?.results || [];
  };

  // Support IDs returned as numbers or objects
  const getId = (value) => {
    if (value && typeof value === "object") {
      return value.id;
    }
    return value;
  };

  // Load tasks, projects and teams
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [taskRes, projectRes] = await Promise.all([
        API.get("tasks/"),
        API.get("projects/"),
      ]);

      let teamData = [];

      // Only administrators and managers can access teams
      if (canManage) {
        const teamRes = await API.get("teams/");
        teamData = getList(teamRes.data);
      }

      const taskData = getList(taskRes.data);
      const projectData = getList(projectRes.data);

      console.log("Loaded projects:", projectData);
      console.log("Loaded teams:", teamData);

      setTasks(taskData);
      setProjects(projectData);
      setTeams(teamData);
    } catch (err) {
      console.error("Tasks page loading error:", err.response?.data || err);
      setError(
        err.response?.data?.detail ||
          "Unable to load tasks, projects or teams."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Teams are assigned directly to tasks, not through projects.
  // The Teams API supplies all teams available to this administrator/manager.

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Create or update task
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.project) {
      setError("Please select a project.");
      return;
    }

    if (!form.due_date) {
      setError("Please select a due date.");
      return;
    }

    const payload = {
      ...form,
      project: Number(form.project),
      team: form.team ? Number(form.team) : null,
    };

    try {
      if (editingId) {
        await API.put(`tasks/${editingId}/`, payload);
      } else {
        await API.post("tasks/", payload);
      }

      setForm(emptyForm);
      setEditingId(null);

      await loadData();
    } catch (err) {
      setError(
        JSON.stringify(
          err.response?.data || "Unable to save task."
        )
      );
    }
  };

  // Edit task
  const handleEdit = (task) => {
    setEditingId(task.id);

    setForm({
      title: task.title || "",
      description: task.description || "",
      project: String(getId(task.project) || ""),
      team: task.team
        ? String(getId(task.team))
        : "",
      priority: task.priority || "medium",
      status: task.status || "todo",
      due_date: task.due_date || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  // Delete task
  const handleDelete = async (taskId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this task?"
      )
    ) {
      return;
    }

    try {
      setError("");

      await API.delete(`tasks/${taskId}/`);

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to delete task."
      );
    }
  };

  // Update task status
  const updateStatus = async (taskId, newStatus) => {
    try {
      setError("");

      await API.patch(`tasks/${taskId}/status/`, {
        status: newStatus,
      });

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to update task status."
      );
    }
  };

  // Search and filters
  const filteredTasks = tasks.filter((task) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      (task.title || "").toLowerCase().includes(searchText) ||
      (task.project_name || "").toLowerCase().includes(searchText) ||
      (task.team_name || "").toLowerCase().includes(searchText);

    const matchesStatus =
      statusFilter === "all" ||
      task.status === statusFilter;

    const matchesPriority =
      priorityFilter === "all" ||
      task.priority === priorityFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPriority
    );
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, priorityFilter]);

  // Pagination
  const totalPages = Math.ceil(
    filteredTasks.length / itemsPerPage
  );

  const startIndex = (currentPage - 1) * itemsPerPage;

  const paginatedTasks = filteredTasks.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Keep current page valid after deletion
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Export filtered tasks
  const handleExport = () => {
    const exportData = filteredTasks.map((task) => ({
      Title: task.title,
      Description: task.description,
      Project: task.project_name || "",
      Team: task.team_name || "No team assigned",
      Priority: task.priority,
      Status: task.status,
      DueDate: task.due_date || "",
    }));

    exportCSV(exportData, "projectflow-tasks.csv");
  };

  // Priority badge
  const priorityBadge = (priority) => {
    const colors = {
      low: "success",
      medium: "warning",
      high: "danger",
    };

    return colors[priority] || "secondary";
  };

  // Status badge
  const statusBadge = (status) => {
    const colors = {
      todo: "secondary",
      in_progress: "primary",
      completed: "success",
    };

    return colors[status] || "secondary";
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          Loading tasks...
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-3 mb-5">

      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2>Task Management</h2>
          <p className="text-muted">
            Manage, assign and track project tasks.
          </p>
        </div>

        <button
          className="btn btn-success"
          onClick={handleExport}
          disabled={filteredTasks.length === 0}
        >
          Export CSV
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* Create / Edit Form */}
      {canManage && (
        <div className="card shadow-sm mb-4">

          <div className="card-header">
            <h5 className="mb-0">
              {editingId ? "Edit Task" : "Create New Task"}
            </h5>
          </div>

          <div className="card-body">
            <form onSubmit={handleSubmit}>

              {/* Task Title */}
              <div className="mb-3">
                <label className="form-label">
                  Task Title
                </label>

                <input
                  type="text"
                  className="form-control"
                  name="title"
                  placeholder="Enter task title"
                  value={form.title}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Description */}
              <div className="mb-3">
                <label className="form-label">
                  Description
                </label>

                <textarea
                  className="form-control"
                  name="description"
                  placeholder="Enter task description"
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                />
              </div>

              <div className="row">

                {/* Project */}
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    Select Project
                  </label>

                  <select
                    className="form-select"
                    name="project"
                    value={form.project}
                    onChange={handleChange}
                    required
                  >
                    <option value="">
                      Select Project
                    </option>

                    {projects.map((project) => (
                      <option
                        key={project.id}
                        value={project.id}
                      >
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Team */}
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    Select Team
                  </label>

                  <select
                    className="form-select"
                    name="team"
                    value={form.team}
                    onChange={handleChange}
                    disabled={teams.length === 0}
                  >
                    <option value="">
                      Select Team
                    </option>

                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>

                  {teams.length === 0 && (
                    <small className="text-danger">
                      No teams are available. Create a team first from the Teams page.
                    </small>
                  )}
                </div>

              </div>

              <div className="row">

                {/* Priority */}
                <div className="col-md-4 mb-3">
                  <label className="form-label">
                    Priority
                  </label>

                  <select
                    className="form-select"
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                {/* Status */}
                <div className="col-md-4 mb-3">
                  <label className="form-label">
                    Status
                  </label>

                  <select
                    className="form-select"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {/* Due Date */}
                <div className="col-md-4 mb-3">
                  <label className="form-label">
                    Due Date
                  </label>

                  <input
                    type="date"
                    className="form-control"
                    name="due_date"
                    value={form.due_date}
                    onChange={handleChange}
                    required
                  />
                </div>

              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn btn-primary me-2"
              >
                {editingId ? "Update Task" : "Create Task"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              )}

            </form>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">

          <div className="row">

            <div className="col-lg-6 mb-2">
              <input
                type="text"
                className="form-control"
                placeholder="Search task, project or team..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="col-lg-3 mb-2">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
              >
                <option value="all">All Statuses</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="col-lg-3 mb-2">
              <select
                className="form-select"
                value={priorityFilter}
                onChange={(e) =>
                  setPriorityFilter(e.target.value)
                }
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

          </div>
        </div>
      </div>

      {/* Task Count */}
      <div className="mb-3">
        <span className="text-muted">
          Showing {filteredTasks.length === 0 ? 0 : startIndex + 1}
          {" - "}
          {Math.min(
            startIndex + itemsPerPage,
            filteredTasks.length
          )}
          {" of "}
          {filteredTasks.length} tasks
        </span>
      </div>

      {/* Task Cards */}
      <div className="row">

        {paginatedTasks.map((task) => (
          <div
            className="col-lg-6 col-xl-4 mb-4"
            key={task.id}
          >
            <div className="card shadow-sm h-100">

              <div className="card-body">

                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5>{task.title}</h5>

                  <span
                    className={`badge bg-${priorityBadge(task.priority)}`}
                  >
                    {task.priority}
                  </span>
                </div>

                <p className="text-muted">
                  {task.description ||
                    "No description provided."}
                </p>

                <hr />

                <p>
                  <strong>Project:</strong>{" "}
                  {task.project_name || "Not specified"}
                </p>

                <p>
                  <strong>Team:</strong>{" "}
                  {task.team_name || "No team assigned"}
                </p>

                <p>
                  <strong>Due Date:</strong>{" "}
                  {task.due_date || "Not set"}
                </p>

                <div className="mb-3">
                  <strong>Status: </strong>

                  <span
                    className={`badge bg-${statusBadge(task.status)}`}
                  >
                    {(task.status || "todo").replace("_", " ")}
                  </span>
                </div>

                {/* Admin / Manager Actions */}
                {canManage && (
                  <div className="d-flex gap-2 flex-wrap">

                    <button
                      className="btn btn-sm btn-warning"
                      onClick={() => handleEdit(task)}
                    >
                      Edit
                    </button>

                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(task.id)}
                    >
                      Delete
                    </button>

                  </div>
                )}

                {/* Employee Status Update */}
                {!canManage && (
                  <div>
                    <label className="form-label">
                      Update Task Status
                    </label>

                    <select
                      className="form-select"
                      value={task.status}
                      onChange={(e) =>
                        updateStatus(task.id, e.target.value)
                      }
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">
                        In Progress
                      </option>
                      <option value="completed">
                        Completed
                      </option>
                    </select>
                  </div>
                )}

              </div>
            </div>
          </div>
        ))}

      </div>

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <div className="alert alert-light text-center">
          No tasks found.
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-4">
          <ul className="pagination justify-content-center flex-wrap">

            <li
              className={`page-item ${
                currentPage === 1 ? "disabled" : ""
              }`}
            >
              <button
                className="page-link"
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage(currentPage - 1)
                }
              >
                Previous
              </button>
            </li>

            {Array.from(
              { length: totalPages },
              (_, index) => index + 1
            ).map((page) => (
              <li
                key={page}
                className={`page-item ${
                  currentPage === page ? "active" : ""
                }`}
              >
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              </li>
            ))}

            <li
              className={`page-item ${
                currentPage === totalPages ? "disabled" : ""
              }`}
            >
              <button
                className="page-link"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage(currentPage + 1)
                }
              >
                Next
              </button>
            </li>

          </ul>
        </nav>
      )}

    </div>
  );
}

export default Tasks;