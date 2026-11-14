
import { useEffect, useMemo, useState } from "react";
import API from "../services/api";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 6;

  // Handle normal and paginated API responses
  const getList = (data) => {
    if (Array.isArray(data)) return data;
    return data?.results || [];
  };

  // Load notifications and overdue tasks
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [notificationRes, overdueRes] = await Promise.all([
        API.get("notifications/"),
        API.get("notifications/overdue-tasks/"),
      ]);

      setNotifications(getList(notificationRes.data));
      setOverdueTasks(getList(overdueRes.data));
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to load notifications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Notification statistics
  const unreadCount = notifications.filter(
    (item) => !item.is_read
  ).length;

  const readCount = notifications.length - unreadCount;

  // Mark one notification as read
  const markAsRead = async (id) => {
    try {
      setError("");
      setSuccess("");

      await API.patch(`notifications/${id}/read/`);

      setNotifications((previous) =>
        previous.map((item) =>
          item.id === id
            ? { ...item, is_read: true }
            : item
        )
      );

      setSuccess("Notification marked as read.");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to update notification."
      );
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(
      (item) => !item.is_read
    );

    try {
      setError("");
      setSuccess("");

      await Promise.all(
        unreadNotifications.map((item) =>
          API.patch(`notifications/${item.id}/read/`)
        )
      );

      setNotifications((previous) =>
        previous.map((item) => ({
          ...item,
          is_read: true,
        }))
      );

      setSuccess("All notifications marked as read.");
    } catch (err) {
      setError(
        "Some notifications could not be updated. Refresh and try again."
      );

      await loadData();
    }
  };

  // Search and filter notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      const matchesSearch = item.message
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesFilter =
        filter === "all" ||
        (filter === "unread" && !item.is_read) ||
        (filter === "read" && item.is_read);

      return matchesSearch && matchesFilter;
    });
  }, [notifications, search, filter]);

  // Pagination
  const totalPages = Math.ceil(
    filteredNotifications.length / itemsPerPage
  );

  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Notification type labels
  const getTypeBadge = (type) => {
    const types = {
      task_assigned: {
        label: "Task Assigned",
        color: "primary",
      },
      task_completed: {
        label: "Task Completed",
        color: "success",
      },
      task_overdue: {
        label: "Task Overdue",
        color: "danger",
      },
      general: {
        label: "General",
        color: "secondary",
      },
    };

    return types[type] || types.general;
  };

  if (loading) {
    return (
      <div className="container mt-4 text-center">
        Loading notifications...
      </div>
    );
  }

  return (
    <div className="container-fluid mt-3 mb-5">

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h2>Notifications</h2>
          <p className="text-muted">
            Stay updated with your project activities.
          </p>
        </div>

        <button
          className="btn btn-outline-primary"
          onClick={loadData}
        >
          Refresh
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      {/* Statistics */}
      <div className="row mb-4">

        <div className="col-md-4 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <p className="text-muted mb-1">
                Total Notifications
              </p>
              <h3>{notifications.length}</h3>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <p className="text-muted mb-1">
                Unread Notifications
              </p>
              <h3 className="text-primary">
                {unreadCount}
              </h3>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <p className="text-muted mb-1">
                Overdue Tasks
              </p>
              <h3 className="text-danger">
                {overdueTasks.length}
              </h3>
            </div>
          </div>
        </div>

      </div>

      {/* Notifications */}
      <div className="card shadow-sm mb-4">

        <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h5 className="mb-0">
            My Notifications
          </h5>

          <button
            className="btn btn-sm btn-primary"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark All as Read
          </button>
        </div>

        <div className="card-body">

          {/* Search and filter */}
          <div className="row mb-3">

            <div className="col-md-8 mb-2">
              <input
                type="text"
                className="form-control"
                placeholder="Search notifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="col-md-4 mb-2">
              <select
                className="form-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Notifications</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>

          </div>

          {/* Notification list */}
          {paginatedNotifications.length === 0 ? (
            <div className="text-center py-5">
              <h6>No notifications found.</h6>
              <p className="text-muted">
                You're all caught up!
              </p>
            </div>
          ) : (
            paginatedNotifications.map((item) => {
              const badge = getTypeBadge(
                item.notification_type
              );

              return (
                <div
                  key={item.id}
                  className={`card mb-3 ${
                    item.is_read
                      ? ""
                      : "border-primary border-start border-4"
                  }`}
                >
                  <div className="card-body">

                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">

                      <div className="flex-grow-1">

                        <div className="mb-2 d-flex gap-2 flex-wrap">
                          <span className={`badge bg-${badge.color}`}>
                            {badge.label}
                          </span>

                          {!item.is_read && (
                            <span className="badge bg-warning text-dark">
                              New
                            </span>
                          )}
                        </div>

                        <p className="mb-1">
                          {item.message}
                        </p>

                        <small className="text-muted">
                          {new Date(
                            item.created_at
                          ).toLocaleString()}
                        </small>

                      </div>

                      {!item.is_read && (
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => markAsRead(item.id)}
                        >
                          Mark as Read
                        </button>
                      )}

                    </div>

                  </div>
                </div>
              );
            })
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="mt-4">
              <ul className="pagination justify-content-center flex-wrap">

                <li className={`page-item ${
                  currentPage === 1 ? "disabled" : ""
                }`}>
                  <button
                    className="page-link"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage((page) => page - 1)
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

                <li className={`page-item ${
                  currentPage === totalPages ? "disabled" : ""
                }`}>
                  <button
                    className="page-link"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((page) => page + 1)
                    }
                  >
                    Next
                  </button>
                </li>

              </ul>
            </nav>
          )}

        </div>
      </div>

      {/* Overdue Tasks */}
      <div className="card shadow-sm">

        <div className="card-header">
          <h5 className="mb-0 text-danger">
            Overdue Tasks
          </h5>
        </div>

        <div className="card-body">

          {overdueTasks.length === 0 ? (
            <div className="text-center py-4">
              <h6 className="text-success">
                No overdue tasks!
              </h6>
              <p className="text-muted mb-0">
                All your tasks are on schedule.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Project</th>
                    <th>Assigned To</th>
                    <th>Due Date</th>
                  </tr>
                </thead>

                <tbody>
                  {overdueTasks.map((task) => (
                    <tr key={task.id}>
                      <td>{task.title}</td>
                      <td>{task.project}</td>
                      <td>
                        {task.assigned_to || "Unassigned"}
                      </td>
                      <td>
                        <span className="badge bg-danger">
                          {task.due_date}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}

export default Notifications;
