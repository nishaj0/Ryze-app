import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api";

const MUSCLES = [
  "abdominals", "abductors", "adductors", "biceps", "calves", "chest",
  "forearms", "glutes", "hamstrings", "lats", "lower back", "middle back",
  "neck", "quadriceps", "shoulders", "traps", "triceps"
];

const FORCES = ["push", "pull", "static"];
const LEVELS = ["beginner", "intermediate", "expert"];
const MECHANICS = ["isolation", "compound"];
const CATEGORIES = ["strength", "cardio", "stretching", "powerlifting", "olympic weightlifting", "strongman", "plyometrics"];

export default function CreateExercisePage() {
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [name, setName] = useState(searchParams.get("name") || "");
  const [force, setForce] = useState(searchParams.get("force") || "");
  const [level, setLevel] = useState(searchParams.get("level") || "");
  const [mechanic, setMechanic] = useState(searchParams.get("mechanic") || "");
  const [equipment, setEquipment] = useState(searchParams.get("equipment") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [instructions, setInstructions] = useState(searchParams.get("instructions") || "");
  const [primaryMuscles, setPrimaryMuscles] = useState<string[]>(
    searchParams.get("primaryMuscles") ? searchParams.get("primaryMuscles")!.split(",") : []
  );
  const [secondaryMuscles, setSecondaryMuscles] = useState<string[]>(
    searchParams.get("secondaryMuscles") ? searchParams.get("secondaryMuscles")!.split(",") : []
  );
  const [images, setImages] = useState<Array<{ url: string; publicId: string }>>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const toggleMuscle = (muscle: string, isPrimary: boolean) => {
    if (isPrimary) {
      setPrimaryMuscles((prev) =>
        prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
      );
    } else {
      setSecondaryMuscles((prev) =>
        prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
      );
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const { data } = await api.post("/exercises/request/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImages((prev) => [...prev, { url: data.url, publicId: data.publicId }]);
    } catch (err) {
      console.error("Failed to upload image:", err);
      alert("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage({ type: "error", text: "Exercise name is required" });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      await api.post("/admin/exercises", {
        name: name.trim(),
        force: force || null,
        level: level || null,
        mechanic: mechanic || null,
        equipment: equipment.trim() || null,
        category: category || null,
        instructions: instructions.trim() || null,
        primaryMuscles: primaryMuscles.length > 0 ? primaryMuscles : null,
        secondaryMuscles: secondaryMuscles.length > 0 ? secondaryMuscles : null,
        images: images.length > 0 ? images : null,
      });

      setMessage({ type: "success", text: "Exercise created successfully!" });
      setName("");
      setForce("");
      setLevel("");
      setMechanic("");
      setEquipment("");
      setCategory("");
      setInstructions("");
      setPrimaryMuscles([]);
      setSecondaryMuscles([]);
      setImages([]);

      // Mark request as approved if it came from a request
      const requestId = searchParams.get("requestId");
      if (requestId) {
        await api.patch(`/admin/exercise-requests/${requestId}`, { status: "APPROVED" });
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to create exercise",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderSelectGroup = (
    label: string,
    options: string[],
    selected: string,
    onSelect: (value: string) => void
  ) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>{label}</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button
          type="button"
          onClick={() => onSelect("")}
          style={{
            padding: "8px 16px",
            borderRadius: 20,
            border: "1px solid",
            borderColor: !selected ? "#667eea" : "#e0e0e0",
            backgroundColor: !selected ? "#667eea" : "white",
            color: !selected ? "white" : "#333",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          None
        </button>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            style={{
              padding: "8px 16px",
              borderRadius: 20,
              border: "1px solid",
              borderColor: selected === option ? "#667eea" : "#e0e0e0",
              backgroundColor: selected === option ? "#667eea" : "white",
              color: selected === option ? "white" : "#333",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              textTransform: "capitalize",
            }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );

  const renderMuscleGroup = (label: string, muscles: string[], isPrimary: boolean) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>{label}</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {MUSCLES.map((muscle) => {
          const isSelected = muscles.includes(muscle);
          return (
            <button
              key={muscle}
              type="button"
              onClick={() => toggleMuscle(muscle, isPrimary)}
              style={{
                padding: "8px 16px",
                borderRadius: 20,
                border: "1px solid",
                borderColor: isSelected ? "#667eea" : "#e0e0e0",
                backgroundColor: isSelected ? "#667eea" : "white",
                color: isSelected ? "white" : "#333",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
                textTransform: "capitalize",
              }}
            >
              {muscle}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Create Exercise</h1>

      {message && (
        <div
          style={{
            padding: 16,
            borderRadius: 8,
            backgroundColor: message.type === "success" ? "#d1fae5" : "#fee2e2",
            color: message.type === "success" ? "#065f46" : "#991b1b",
            marginBottom: 16,
          }}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ maxWidth: 800 }}>
          {/* Name */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
              Exercise Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Bulgarian Split Squat"
              required
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 8,
                border: "1px solid #e0e0e0",
                fontSize: 14,
              }}
            />
          </div>

          {/* Select Groups */}
          {renderSelectGroup("Force Type", FORCES, force, setForce)}
          {renderSelectGroup("Difficulty Level", LEVELS, level, setLevel)}
          {renderSelectGroup("Mechanic Type", MECHANICS, mechanic, setMechanic)}
          {renderSelectGroup("Category", CATEGORIES, category, setCategory)}

          {/* Equipment */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Equipment</label>
            <input
              type="text"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="e.g., barbell, dumbbells, cable machine"
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 8,
                border: "1px solid #e0e0e0",
                fontSize: 14,
              }}
            />
          </div>

          {/* Instructions */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="How to perform this exercise..."
              rows={5}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 8,
                border: "1px solid #e0e0e0",
                fontSize: 14,
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Muscle Groups */}
          {renderMuscleGroup("Primary Muscles", primaryMuscles, true)}
          {renderMuscleGroup("Secondary Muscles", secondaryMuscles, false)}

          {/* Images */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Images</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImage}
              style={{ marginBottom: 8 }}
            />
            {images.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {images.map((img, idx) => (
                  <div key={idx} style={{ position: "relative" }}>
                    <img src={img.url} alt="" style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 8 }} />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                      style={{
                        position: "absolute",
                        top: -8,
                        right: -8,
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        border: "none",
                        backgroundColor: "#ef4444",
                        color: "white",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            style={{
              padding: "12px 24px",
              borderRadius: 8,
              border: "none",
              backgroundColor: "#667eea",
              color: "white",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              opacity: submitting || !name.trim() ? 0.6 : 1,
            }}
          >
            {submitting ? "Creating..." : "Create Exercise"}
          </button>
        </div>
      </form>
    </div>
  );
}
