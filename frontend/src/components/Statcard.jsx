function StatCard({ title, value, color, icon }) {
    return (
        <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
                <div className="d-flex justify-content-between">
                    <div>
                        <p className="text-muted mb-2">{title}</p>
                        <h2 className="fw-bold">{value}</h2>
                    </div>

                    <div
                        className={`bg-${color} text-white rounded p-3`}
                    >
                        {icon}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StatCard;