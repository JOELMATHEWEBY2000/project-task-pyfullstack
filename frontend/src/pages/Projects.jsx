import { useEffect, useState } from "react";
import API from "../services/api";

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);

  const emptyForm = {
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    status: "planning",
  };

  const [form, setForm] = useState(emptyForm);

  const role = localStorage.getItem("role");
  const canManage = ["admin", "manager"].includes(role);

  const getList = (data) => {
    if (Array.isArray(data)) return data;
    return data?.results || [];
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await API.get("projects/");
      setProjects(getList(response.data));
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load projects. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (editingId) {
        await API.put(`projects/${editingId}/`, form);
      } else {
        await API.post("projects/", form);
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } catch (err) {
      const data = err.response?.data;
      setError(
        typeof data === "string"
          ? data
          : JSON.stringify(data || "Unable to save project.")
      );
    }
  };

  const handleEdit = (project) => {
    setEditingId(project.id);
    setForm({
      name: project.name || "",
      description: project.description || "",
      start_date: project.start_date || "",
      end_date: project.end_date || "",
      status: project.status || "planning",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project?")) {
      return;
    }

    try {
      setError("");
      await API.delete(`projects/${id}/`);
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Unable to delete project."
      );
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = (project.name || "")
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="container mt-4">Loading projects...</div>;
  }

  return (
    <div className="container mt-4 mb-5">
      <h2 className="mb-4">Project Management</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      {canManage && (
        <div className="card shadow-sm mb-4">
          <div className="card-header">
            <h5 className="mb-0">
              {editingId ? "Edit Project" : "Create Project"}
            </h5>
          </div>

          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Project Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                />
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="start_date"
                    value={form.start_date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="end_date"
                    value={form.end_date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <button className="btn btn-primary me-2" type="submit">
                {editingId ? "Update Project" : "Create Project"}
              </button>

              {editingId && (
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      <div className="row mb-3">
        <div className="col-md-8 mb-2">
          <input
            type="text"
            className="form-control"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="col-md-4 mb-2">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="row">
        {filteredProjects.map((project) => (
          <div className="col-lg-6 mb-4" key={project.id}>
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h5>{project.name}</h5>
                <p className="text-muted">
                  {project.description || "No description provided."}
                </p>
                <p>
                  <strong>Manager:</strong> {project.manager_name || "—"}
                </p>
                <p>
                  <strong>Members:</strong>{" "}
                  {project.member_names?.join(", ") || "No members"}
                </p>
                <p>
                  <strong>Dates:</strong> {project.start_date} to {project.end_date}
                </p>
                <span className="badge bg-info text-dark">
                  {project.status}
                </span>

                {canManage && (
                  <div className="mt-3">
                    <button
                      className="btn btn-sm btn-warning me-2"
                      onClick={() => handleEdit(project)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(project.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="alert alert-light text-center">
          No projects found.
        </div>
      )}
    </div>
  );
}

export default Projects;
