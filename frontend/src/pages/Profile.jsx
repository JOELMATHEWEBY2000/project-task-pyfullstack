
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    username: "",
    email: "",
    role: "",
  });

  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("auth/profile/")
      .then((response) => {
        setProfile(response.data);
      })
      .catch(() => {
        setError("Unable to load profile.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const updateProfile = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await API.patch(
        "auth/profile/",
        {
          username: profile.username,
          email: profile.email,
        }
      );

      setProfile(response.data.user);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(
        JSON.stringify(err.response?.data || "Profile update failed.")
      );
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await API.post(
        "auth/change-password/",
        passwords
      );

      localStorage.clear();

      setMessage("Password changed. Please log in again.");

      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      setError(
        JSON.stringify(err.response?.data || "Password change failed.")
      );
    }
  };

  if (loading) {
    return <div className="container mt-4">Loading profile...</div>;
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4">My Profile</h2>

      {message && (
        <div className="alert alert-success">{message}</div>
      )}

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      <div className="row">
        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="mb-4">Personal Information</h5>

              <form onSubmit={updateProfile}>
                <div className="mb-3">
                  <label className="form-label">Username</label>
                  <input
                    className="form-control"
                    value={profile.username}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        username: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={profile.email || ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        email: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Role</label>
                  <input
                    className="form-control"
                    value={profile.role || ""}
                    disabled
                  />
                </div>

                <button className="btn btn-primary">
                  Save Changes
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="mb-4">Change Password</h5>

              <form onSubmit={changePassword}>
                <div className="mb-3">
                  <label className="form-label">
                    Current Password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    value={passwords.current_password}
                    onChange={(e) =>
                      setPasswords({
                        ...passwords,
                        current_password: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    New Password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    minLength={8}
                    value={passwords.new_password}
                    onChange={(e) =>
                      setPasswords({
                        ...passwords,
                        new_password: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <button className="btn btn-warning">
                  Change Password
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
