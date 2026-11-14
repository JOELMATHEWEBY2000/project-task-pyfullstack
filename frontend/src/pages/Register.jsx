
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (
      !formData.username.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    try {
      setLoading(true);

      await API.post("auth/register/", {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        // Public registration always creates an employee.
        role: "employee",
      });

      setSuccess("Registration successful! Redirecting to login...");

      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      const data = err.response?.data;

      if (data && typeof data === "object") {
        const firstError = Object.values(data).flat()[0];
        setError(
          typeof firstError === "string"
            ? firstError
            : "Registration failed. Please check your details."
        );
      } else {
        setError("Unable to register. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light py-4">
      <div className="card shadow border-0 rounded-4 p-4" style={{ maxWidth: "450px", width: "100%" }}>
        <div className="text-center mb-4">
          <h2 className="fw-bold text-primary">ProjectFlow</h2>
          <h5 className="fw-semibold">Create Your Account</h5>
          <p className="text-muted mb-0">
            Join your project management workspace
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success" role="alert">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Username</label>
            <input
              type="text"
              name="username"
              className="form-control"
              placeholder="Enter username"
              value={formData.username}
              onChange={handleChange}
              autoComplete="username"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Email Address</label>
            <input
              type="email"
              name="email"
              className="form-control"
              placeholder="Enter email address"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Password</label>
            <input
              type="password"
              name="password"
              className="form-control"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={8}
              required
            />
            <small className="text-muted">
              Minimum 8 characters
            </small>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              className="form-control"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Account Role</label>
            <select className="form-select" value="employee" disabled>
              <option value="employee">Employee</option>
            </select>
            <small className="text-muted">
              New public accounts are registered as Employees.
              Admins can assign Manager roles.
            </small>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2 fw-semibold"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        <div className="text-center mt-4">
          <span className="text-muted">Already have an account? </span>
          <Link to="/" className="text-decoration-none fw-semibold">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
