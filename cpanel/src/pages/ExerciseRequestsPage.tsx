import { useState, useEffect } from "react";
import { PageLoader, Pagination, Badge } from "../components/UI";
import api from "../api";

interface ExerciseRequest {
  id: string;
  name: string;
  description: string | null;
  force: string | null;
  level: string | null;
  mechanic: string | null;
  equipment: string | null;
  category: string | null;
  instructions: string | null;
  primaryMuscles: string | null;
  secondaryMuscles: string | null;
  referenceImages: string | null;
  status: string;
  adminNotes: string | null;
  requestedById: string | null;
  createdAt: string;
  updatedAt: string;
  requestedBy: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

const statusColors: Record<string, string> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

export default function ExerciseRequestsPage() {
  const [requests, setRequests] = useState<ExerciseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedRequest, setSelectedRequest] = useState<ExerciseRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [page, statusFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get("/admin/exercise-requests", { params });
      setRequests(data.requests);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error("Failed to fetch exercise requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    setUpdating(true);
    try {
      await api.patch(`/admin/exercise-requests/${id}`, {
        status,
        adminNotes: adminNotes || null,
      });
      setSelectedRequest(null);
      setAdminNotes("");
      fetchRequests();
    } catch (err) {
      console.error("Failed to update request:", err);
      alert("Failed to update request");
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateExercise = (request: ExerciseRequest) => {
    // Navigate to create exercise page with pre-filled data
    const params = new URLSearchParams({
      name: request.name,
      force: request.force || "",
      level: request.level || "",
      mechanic: request.mechanic || "",
      equipment: request.equipment || "",
      category: request.category || "",
      instructions: request.instructions || "",
      primaryMuscles: request.primaryMuscles || "",
      secondaryMuscles: request.secondaryMuscles || "",
      requestId: request.id,
    });
    window.location.href = `/create-exercise?${params.toString()}`;
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Exercise Requests</h1>
        <div style={{ display: "flex", gap: 8 }}>
          {["", "PENDING", "APPROVED", "REJECTED"].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                backgroundColor: statusFilter === status ? "#667eea" : "#f0f0f0",
                color: statusFilter === status ? "white" : "#333",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              {status || "All"}
            </button>
          ))}
        </div>
      </div>

      {requests.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: "#999" }}>
          <p>No exercise requests found</p>
        </div>
      ) : (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
                <th style={{ textAlign: "left", padding: 12 }}>Name</th>
                <th style={{ textAlign: "left", padding: 12 }}>Requested By</th>
                <th style={{ textAlign: "left", padding: 12 }}>Date</th>
                <th style={{ textAlign: "left", padding: 12 }}>Status</th>
                <th style={{ textAlign: "right", padding: 12 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr
                  key={req.id}
                  style={{ borderBottom: "1px solid #f0f0f0", cursor: "pointer" }}
                  onClick={() => setSelectedRequest(req)}
                >
                  <td style={{ padding: 12, fontWeight: 500 }}>{req.name}</td>
                  <td style={{ padding: 12, color: "#666" }}>
                    {req.requestedBy?.name || req.requestedBy?.email || "Unknown"}
                  </td>
                  <td style={{ padding: 12, color: "#666" }}>
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: 12 }}>
                    <Badge color={statusColors[req.status] || "default"}>
                      {req.status}
                    </Badge>
                  </td>
                  <td style={{ padding: 12, textAlign: "right" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRequest(req);
                      }}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: "none",
                        backgroundColor: "#667eea",
                        color: "white",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination page={page} totalPages={totalPages} total={total} limit={20} onPage={setPage} />
        </>
      )}

      {/* Detail Modal */}
      {selectedRequest && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setSelectedRequest(null)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: 12,
              padding: 24,
              maxWidth: 600,
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>{selectedRequest.name}</h2>
              <Badge color={statusColors[selectedRequest.status] || "default"}>
                {selectedRequest.status}
              </Badge>
            </div>

            {selectedRequest.description && (
              <div style={{ marginBottom: 16 }}>
                <strong>Description:</strong>
                <p style={{ margin: "8px 0", color: "#666" }}>{selectedRequest.description}</p>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {selectedRequest.force && (
                <div>
                  <strong>Force:</strong>
                  <p style={{ margin: "4px 0", color: "#666", textTransform: "capitalize" }}>{selectedRequest.force}</p>
                </div>
              )}
              {selectedRequest.level && (
                <div>
                  <strong>Level:</strong>
                  <p style={{ margin: "4px 0", color: "#666", textTransform: "capitalize" }}>{selectedRequest.level}</p>
                </div>
              )}
              {selectedRequest.mechanic && (
                <div>
                  <strong>Mechanic:</strong>
                  <p style={{ margin: "4px 0", color: "#666", textTransform: "capitalize" }}>{selectedRequest.mechanic}</p>
                </div>
              )}
              {selectedRequest.equipment && (
                <div>
                  <strong>Equipment:</strong>
                  <p style={{ margin: "4px 0", color: "#666" }}>{selectedRequest.equipment}</p>
                </div>
              )}
              {selectedRequest.category && (
                <div>
                  <strong>Category:</strong>
                  <p style={{ margin: "4px 0", color: "#666", textTransform: "capitalize" }}>{selectedRequest.category}</p>
                </div>
              )}
              {selectedRequest.primaryMuscles && (
                <div>
                  <strong>Primary Muscles:</strong>
                  <p style={{ margin: "4px 0", color: "#666", textTransform: "capitalize" }}>
                    {selectedRequest.primaryMuscles}
                  </p>
                </div>
              )}
              {selectedRequest.secondaryMuscles && (
                <div>
                  <strong>Secondary Muscles:</strong>
                  <p style={{ margin: "4px 0", color: "#666", textTransform: "capitalize" }}>
                    {selectedRequest.secondaryMuscles}
                  </p>
                </div>
              )}
            </div>

            {selectedRequest.instructions && (
              <div style={{ marginBottom: 16 }}>
                <strong>Instructions:</strong>
                <p style={{ margin: "8px 0", color: "#666", whiteSpace: "pre-wrap" }}>{selectedRequest.instructions}</p>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <strong>Requested by:</strong>
              <p style={{ margin: "4px 0", color: "#666" }}>
                {selectedRequest.requestedBy?.name || "Unknown"} ({selectedRequest.requestedBy?.email})
              </p>
              <p style={{ margin: "4px 0", color: "#999", fontSize: 13 }}>
                {new Date(selectedRequest.createdAt).toLocaleString()}
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Admin Notes:</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add your research notes here..."
                style={{
                  width: "100%",
                  minHeight: 80,
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid #e0e0e0",
                  fontSize: 14,
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setSelectedRequest(null)}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "1px solid #e0e0e0",
                  backgroundColor: "white",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              {selectedRequest.status !== "APPROVED" && (
                <button
                  onClick={() => handleStatusUpdate(selectedRequest.id, "APPROVED")}
                  disabled={updating}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "none",
                    backgroundColor: "#10b981",
                    color: "white",
                    cursor: "pointer",
                    opacity: updating ? 0.6 : 1,
                  }}
                >
                  {updating ? "..." : "Approve"}
                </button>
              )}
              {selectedRequest.status !== "REJECTED" && (
                <button
                  onClick={() => handleStatusUpdate(selectedRequest.id, "REJECTED")}
                  disabled={updating}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "none",
                    backgroundColor: "#ef4444",
                    color: "white",
                    cursor: "pointer",
                    opacity: updating ? 0.6 : 1,
                  }}
                >
                  {updating ? "..." : "Reject"}
                </button>
              )}
              {selectedRequest.status === "APPROVED" && (
                <button
                  onClick={() => handleCreateExercise(selectedRequest)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "none",
                    backgroundColor: "#667eea",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  Create Exercise
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
