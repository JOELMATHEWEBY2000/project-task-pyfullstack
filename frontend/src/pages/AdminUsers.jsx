
import { useEffect, useState } from "react";
import API from "../services/api";

function AdminUsers() {

    const initialForm = {
        username: "",
        email: "",
        password: "",
        role: "employee",
        is_active: true
    };

    const [users, setUsers] = useState([]);
    const [form, setForm] = useState(initialForm);

    const [editId, setEditId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchUsers = async () => {

        try {
            setLoading(true);

            const response = await API.get("admin/users/");

            setUsers(response.data);
            setError("");

        } catch (err) {
            console.error(err.response?.data || err);
            setError("Unable to fetch users.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleChange = (e) => {

        const { name, value, type, checked } = e.target;

        setForm({
            ...form,
            [name]: type === "checkbox" ? checked : value
        });
    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            if (editId) {

                const payload = {
                    username: form.username,
                    email: form.email,
                    role: form.role,
                    is_active: form.is_active
                };

                if (form.password) {
                    payload.password = form.password;
                }

                await API.patch(
                    `admin/users/${editId}/`,
                    payload
                );

                alert("User updated successfully!");

            } else {

                await API.post("admin/users/", form);

                alert("User created successfully!");
            }

            resetForm();
            await fetchUsers();

        } catch (err) {

            const data = err.response?.data;

            alert(
                data
                    ? JSON.stringify(data)
                    : "Unable to save user."
            );
        }
    };

    const handleEdit = (user) => {

        setEditId(user.id);

        setForm({
            username: user.username,
            email: user.email,
            password: "",
            role: user.role,
            is_active: user.is_active
        });

        setShowForm(true);
    };

    const handleDelete = async (id) => {

        if (!window.confirm(
            "Are you sure you want to deactivate this user?"
        )) {
            return;
        }

        try {

            await API.delete(`admin/users/${id}/`);

            alert("User deactivated successfully!");

            await fetchUsers();

        } catch (err) {

            alert(
                err.response?.data
                    ? JSON.stringify(err.response.data)
                    : "Unable to deactivate user."
            );
        }
    };

    const handleActivate = async (user) => {

        try {

            await API.patch(
                `admin/users/${user.id}/`,
                { is_active: true }
            );

            alert("User activated successfully!");

            await fetchUsers();

        } catch (err) {

            alert("Unable to activate user.");
        }
    };

    const resetForm = () => {

        setForm(initialForm);
        setEditId(null);
        setShowForm(false);
    };

    const filteredUsers = users.filter(user => {

        const matchesSearch =
            user.username.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase());

        const matchesRole =
            roleFilter === "all" || user.role === roleFilter;

        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "active" && user.is_active) ||
            (statusFilter === "inactive" && !user.is_active);

        return matchesSearch && matchesRole && matchesStatus;
    });

    return (

        <div className="container-fluid p-4">

            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>
                    <h2>User Management</h2>
                    <p className="text-muted">
                        Manage application users and permissions
                    </p>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={() => {
                        resetForm();
                        setShowForm(true);
                    }}
                >
                    + Add User
                </button>

            </div>

            <div className="row g-3 mb-4">

                <div className="col-md-4">
                    <div className="card shadow-sm p-3">
                        <h6>Total Users</h6>
                        <h3>{users.length}</h3>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card shadow-sm p-3">
                        <h6>Active Users</h6>
                        <h3 className="text-success">
                            {users.filter(u => u.is_active).length}
                        </h3>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card shadow-sm p-3">
                        <h6>Inactive Users</h6>
                        <h3 className="text-danger">
                            {users.filter(u => !u.is_active).length}
                        </h3>
                    </div>
                </div>

            </div>

            {showForm && (

                <div className="card shadow-sm p-4 mb-4">

                    <h4>
                        {editId ? "Edit User" : "Create New User"}
                    </h4>

                    <form onSubmit={handleSubmit}>

                        <div className="row">

                            <div className="col-md-6 mb-3">
                                <label className="form-label">
                                    Username
                                </label>

                                <input
                                    name="username"
                                    className="form-control"
                                    value={form.username}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">
                                    Email
                                </label>

                                <input
                                    type="email"
                                    name="email"
                                    className="form-control"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                        </div>

                        <div className="row">

                            <div className="col-md-6 mb-3">
                                <label className="form-label">
                                    Password {editId && "(Optional)"}
                                </label>

                                <input
                                    type="password"
                                    name="password"
                                    className="form-control"
                                    placeholder={
                                        editId
                                            ? "Leave blank to keep existing password"
                                            : "Enter password"
                                    }
                                    value={form.password}
                                    onChange={handleChange}
                                    required={!editId}
                                    minLength={8}
                                />
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">
                                    Role
                                </label>

                                <select
                                    name="role"
                                    className="form-select"
                                    value={form.role}
                                    onChange={handleChange}
                                >
                                    <option value="admin">Admin</option>
                                    <option value="manager">Manager</option>
                                    <option value="employee">Employee</option>
                                </select>
                            </div>

                        </div>

                        {editId && (
                            <div className="form-check mb-3">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    className="form-check-input"
                                    checked={form.is_active}
                                    onChange={handleChange}
                                    id="activeUser"
                                />

                                <label
                                    className="form-check-label"
                                    htmlFor="activeUser"
                                >
                                    Active Account
                                </label>
                            </div>
                        )}

                        <button className="btn btn-success me-2">
                            {editId ? "Update User" : "Create User"}
                        </button>

                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={resetForm}
                        >
                            Cancel
                        </button>

                    </form>

                </div>
            )}

            <div className="row mb-3">

                <div className="col-md-4 mb-2">
                    <input
                        className="form-control"
                        placeholder="Search username or email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div className="col-md-4 mb-2">
                    <select
                        className="form-select"
                        value={roleFilter}
                        onChange={e => setRoleFilter(e.target.value)}
                    >
                        <option value="all">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="employee">Employee</option>
                    </select>
                </div>

                <div className="col-md-4 mb-2">
                    <select
                        className="form-select"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Accounts</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

            </div>

            {loading ? (

                <p>Loading users...</p>

            ) : error ? (

                <div className="alert alert-danger">
                    {error}
                </div>

            ) : (

                <div className="table-responsive">

                    <table className="table table-bordered table-hover bg-white">

                        <thead className="table-dark">
                            <tr>
                                <th>ID</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>

                            {filteredUsers.map(user => (

                                <tr key={user.id}>

                                    <td>{user.id}</td>
                                    <td>{user.username}</td>
                                    <td>{user.email}</td>

                                    <td>
                                        <span className="badge bg-primary">
                                            {user.role}
                                        </span>
                                    </td>

                                    <td>
                                        <span className={`badge ${
                                            user.is_active
                                                ? "bg-success"
                                                : "bg-danger"
                                        }`}>
                                            {user.is_active
                                                ? "Active"
                                                : "Inactive"}
                                        </span>
                                    </td>

                                    <td>

                                        <button
                                            className="btn btn-sm btn-warning me-2"
                                            onClick={() => handleEdit(user)}
                                        >
                                            Edit
                                        </button>

                                        {user.is_active ? (

                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleDelete(user.id)}
                                            >
                                                Deactivate
                                            </button>

                                        ) : (

                                            <button
                                                className="btn btn-sm btn-success"
                                                onClick={() => handleActivate(user)}
                                            >
                                                Activate
                                            </button>

                                        )}

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                    {filteredUsers.length === 0 && (
                        <div className="alert alert-info">
                            No users found.
                        </div>
                    )}

                </div>
            )}

        </div>
    );
}

export default AdminUsers;
