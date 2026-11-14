import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

function Login() {

    const navigate = useNavigate();

    const [form, setForm] = useState({
        username: "",
        password: ""
    });

    const [error, setError] = useState("");

    const handleChange = (e) => {

        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {

    e.preventDefault();
    setError("");

    try {

        const response = await API.post(
            "auth/login/",
            form
        );

        localStorage.setItem(
            "access",
            response.data.access
        );

        localStorage.setItem(
            "refresh",
            response.data.refresh
        );

        const profile = await API.get("auth/profile/");

        const role = profile.data.role;

        localStorage.setItem("role", role);

        if (role === "admin") {
            navigate("/admin-dashboard");
        }
        else if (role === "manager") {
            navigate("/manager-dashboard");
        }
        else {
            navigate("/employee-dashboard");
        }

    } catch (err) {

        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("role");

        setError(
            err.response?.data?.detail ||
            "Invalid username or password"
        );
    }
};


    return (

        <div className="container mt-5">

            <div className="row justify-content-center">

                <div className="col-md-5">

                    <div className="card shadow p-4">

                        <h2 className="text-center mb-4">
                            ProjectFlow
                        </h2>

                        <h5 className="text-center">
                            Login
                        </h5>

                        {error && (
                            <div className="alert alert-danger">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>

                            <input
                                type="text"
                                name="username"
                                className="form-control mb-3"
                                placeholder="Username"
                                value={form.username}
                                onChange={handleChange}
                                required
                            />

                            <input
                                type="password"
                                name="password"
                                className="form-control mb-3"
                                placeholder="Password"
                                value={form.password}
                                onChange={handleChange}
                                required
                            />

                            <button className="btn btn-primary w-100">
                                Login
                            </button>

                        </form>

                        <p className="text-center mt-3">
                            Don't have an account?

                            <Link to="/register">
                                {" "}Register
                            </Link>
                        </p>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default Login;