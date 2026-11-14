
import { useEffect, useState } from "react";
import API from "../services/api";

function Teams() {
    const initialForm = {
        name: "",
        description: "",
        manager: "",
        members: []
    };

    const [teams, setTeams] = useState([]);
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState(initialForm);

    const [editId, setEditId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const role = (localStorage.getItem("role") || "").toLowerCase();
    const canManage = ["admin", "manager"].includes(role);

    // Handle normal and paginated API responses
    const getResults = (data) => {
        if (Array.isArray(data)) {
            return data;
        }

        if (Array.isArray(data?.results)) {
            return data.results;
        }

        if (Array.isArray(data?.users)) {
            return data.users;
        }

        return [];
    };

    // Load teams and users
    const fetchData = async () => {
        setLoading(true);
        setError("");

        const [teamResult, userResult] = await Promise.allSettled([
            API.get("teams/"),
            API.get("auth/users/")
        ]);

        if (teamResult.status === "fulfilled") {
            setTeams(getResults(teamResult.value.data));
        } else {
            console.error(
                "Teams API error:",
                teamResult.reason.response?.data || teamResult.reason
            );
            setError(
                "Unable to load teams: " +
                (teamResult.reason.response?.data?.detail || "Check the teams API endpoint.")
            );
        }

        if (userResult.status === "fulfilled") {
            const userData = getResults(userResult.value.data);
            setUsers(userData);

            console.log("Users loaded:", userData);
            console.log(
                "Managers:",
                userData.filter(user => user.role === "manager")
            );
            console.log(
                "Employees:",
                userData.filter(user => user.role === "employee")
            );
        } else {
            console.error(
                "Users API error:",
                userResult.reason.response?.data || userResult.reason
            );

            setUsers([]);

            setError(previous =>
                previous
                    ? previous + " User list could not be loaded."
                    : "Unable to load users. Check the /api/auth/users/ endpoint and permissions."
            );
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filter users by role
    const managers = users.filter(
        user => user.role?.toLowerCase() === "manager"
    );

    const employees = users.filter(
        user => user.role?.toLowerCase() === "employee"
    );

    // Handle form inputs
    const handleChange = (e) => {
        const { name, value, options } = e.target;

        if (name === "members") {
            const selected = Array.from(options)
                .filter(option => option.selected)
                .map(option => Number(option.value));

            setForm(previous => ({
                ...previous,
                members: selected
            }));
        } else {
            setForm(previous => ({
                ...previous,
                [name]: value
            }));
        }
    };

    // Create or update team
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        try {
            const payload = {
                name: form.name,
                description: form.description,
                members: form.members
            };

            // Admin selects a manager.
            // Managers are assigned by the backend.
            if (role === "admin") {
                payload.manager = Number(form.manager);
            }

            if (editId) {
                await API.put(`teams/${editId}/`, payload);
                alert("Team updated successfully!");
            } else {
                await API.post("teams/", payload);
                alert("Team created successfully!");
            }

            resetForm();
            await fetchData();

        } catch (err) {
            console.error(
                "Save team error:",
                err.response?.data || err
            );

            setError(
                JSON.stringify(
                    err.response?.data || "Unable to save team."
                )
            );
        } finally {
            setSaving(false);
        }
    };

    // Edit team
    const handleEdit = (team) => {
        setEditId(team.id);

        setForm({
            name: team.name || "",
            description: team.description || "",
            manager: String(team.manager || ""),
            members: Array.isArray(team.members)
                ? team.members.map(member =>
                    typeof member === "object" ? member.id : member
                )
                : []
        });

        setShowForm(true);
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    // Delete team
    const handleDelete = async (id) => {
        if (!window.confirm("Delete this team?")) {
            return;
        }

        try {
            await API.delete(`teams/${id}/`);
            alert("Team deleted successfully!");
            await fetchData();

        } catch (err) {
            console.error(
                "Delete team error:",
                err.response?.data || err
            );

            setError(
                err.response?.data?.detail || "Unable to delete team."
            );
        }
    };

    // Reset form
    const resetForm = () => {
        setForm(initialForm);
        setEditId(null);
        setShowForm(false);
        setError("");
    };

    return (
        <div className="container-fluid p-4">

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2>Team Management</h2>
                    <p className="text-muted">
                        Organize managers and employees into teams
                    </p>
                </div>

                {canManage && (
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            resetForm();
                            setShowForm(true);
                        }}
                    >
                        + Create Team
                    </button>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}

            {/* Team Form */}
            {showForm && (
                <div className="card shadow-sm p-4 mb-4">

                    <h4>
                        {editId ? "Edit Team" : "Create Team"}
                    </h4>

                    <form onSubmit={handleSubmit}>

                        {/* Team Name */}
                        <div className="mb-3">
                            <label className="form-label">
                                Team Name
                            </label>

                            <input
                                type="text"
                                name="name"
                                className="form-control"
                                placeholder="Enter team name"
                                value={form.name}
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
                                name="description"
                                className="form-control"
                                placeholder="Enter team description"
                                value={form.description}
                                onChange={handleChange}
                                rows="3"
                            />
                        </div>

                        {/* Manager Dropdown */}
                        {role === "admin" && (
                            <div className="mb-3">
                                <label className="form-label">
                                    Manager
                                </label>

                                <select
                                    name="manager"
                                    className="form-select"
                                    value={form.manager}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">
                                        Select Manager
                                    </option>

                                    {managers.map(manager => (
                                        <option
                                            key={manager.id}
                                            value={manager.id}
                                        >
                                            {manager.username}
                                        </option>
                                    ))}
                                </select>

                                {managers.length === 0 && (
                                    <small className="text-danger">
                                        No manager accounts found.
                                    </small>
                                )}
                            </div>
                        )}

                        {/* Employee Dropdown */}
                        <div className="mb-3">
                            <label className="form-label">
                                Employees
                            </label>

                            <select
                                name="members"
                                className="form-select"
                                multiple
                                value={form.members.map(String)}
                                onChange={handleChange}
                                style={{ height: "130px" }}
                            >
                                {employees.map(employee => (
                                    <option
                                        key={employee.id}
                                        value={employee.id}
                                    >
                                        {employee.username}
                                    </option>
                                ))}
                            </select>

                            {employees.length === 0 ? (
                                <small className="text-danger">
                                    No employee accounts found.
                                </small>
                            ) : (
                                <small className="text-muted">
                                    Hold Ctrl to select multiple employees.
                                </small>
                            )}
                        </div>

                        {/* Buttons */}
                        <button
                            type="submit"
                            className="btn btn-success me-2"
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : editId
                                    ? "Update Team"
                                    : "Create Team"}
                        </button>

                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={resetForm}
                            disabled={saving}
                        >
                            Cancel
                        </button>

                    </form>
                </div>
            )}

            {/* Teams List */}
            {loading ? (
                <p>Loading teams...</p>
            ) : teams.length === 0 ? (
                <div className="alert alert-info">
                    No teams available.
                </div>
            ) : (
                <div className="row g-3">

                    {teams.map(team => (
                        <div
                            className="col-md-6 col-lg-4"
                            key={team.id}
                        >
                            <div className="card shadow-sm h-100">

                                <div className="card-body">

                                    <h5>{team.name}</h5>

                                    <p className="text-muted">
                                        {team.description}
                                    </p>

                                    <p>
                                        <strong>Manager:</strong>{" "}
                                        {team.manager_name || "Not assigned"}
                                    </p>

                                    <p>
                                        <strong>Team Members:</strong>
                                    </p>

                                    {(team.member_names || []).length > 0 ? (
                                        team.member_names.map(name => (
                                            <span
                                                key={name}
                                                className="badge bg-primary me-1 mb-1"
                                            >
                                                {name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-muted">
                                            No members assigned
                                        </span>
                                    )}

                                    {canManage && (
                                        <div className="mt-3">

                                            <button
                                                className="btn btn-warning btn-sm me-2"
                                                onClick={() => handleEdit(team)}
                                            >
                                                Edit
                                            </button>

                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleDelete(team.id)}
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
            )}
        </div>
    );
}

export default Teams;
