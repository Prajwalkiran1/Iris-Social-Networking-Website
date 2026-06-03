import { useState } from "react";
import { FiImage as ImagePlus, FiX as X, FiSend as Send } from "react-icons/fi";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../contexts/AuthContext";
import { createPost } from "../services/postApi";
import { storage } from "../firebaseConfig";
import {
  colors,
  glassCard,
  radius,
  spacing,
  type,
  button,
  font,
  transition,
} from "../theme";

const CreatePost = ({ onCreate }) => {
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { currentUser } = useAuth();

  const handleImageChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    if (selected.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }
    setError("");
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const clearImage = () => {
    setFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async () => {
    if (!content.trim() && !file) return;
    if (!currentUser) return;

    setLoading(true);
    setError("");
    try {
      let imageUrl = "";
      if (file) {
        const path = `posts/${currentUser.uid}/${Date.now()}-${file.name}`;
        const snap = await uploadBytes(ref(storage, path), file);
        imageUrl = await getDownloadURL(snap.ref);
      }
      const newPost = await createPost({ content, imageUrl });
      onCreate(newPost);
      setContent("");
      setFile(null);
      setPreviewUrl(null);
    } catch (err) {
      console.error("Failed to create post:", err.message);
      setError("Couldn't publish your post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || (!content.trim() && !file);

  return (
    <form
      style={{
        ...glassCard({ padded: false }),
        padding: spacing.xl,
        marginBottom: spacing.xl,
      }}
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <textarea
        placeholder="What's on your mind?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={loading}
        rows={3}
        style={{
          width: "100%",
          padding: spacing.md,
          borderRadius: radius.md,
          border: `1px solid ${colors.border}`,
          background: colors.input,
          color: colors.text,
          ...type.body,
          fontFamily: font.family,
          resize: "vertical",
          minHeight: "90px",
          transition: transition(["border-color", "background"]),
          boxSizing: "border-box",
        }}
      />

      {previewUrl && (
        <div
          style={{
            position: "relative",
            marginTop: spacing.md,
            borderRadius: radius.md,
            overflow: "hidden",
            border: `1px solid ${colors.glassBorder}`,
          }}
        >
          <img
            src={previewUrl}
            alt="preview"
            style={{
              width: "100%",
              maxHeight: "260px",
              objectFit: "cover",
              display: "block",
            }}
          />
          <button
            type="button"
            onClick={clearImage}
            aria-label="Remove image"
            style={{
              position: "absolute",
              top: spacing.sm,
              right: spacing.sm,
              width: "32px",
              height: "32px",
              borderRadius: radius.pill,
              background: "rgba(0,0,0,0.55)",
              border: `1px solid ${colors.glassBorder}`,
              color: colors.text,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: spacing.md,
            color: colors.danger,
            ...type.footnote,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: spacing.md,
          gap: spacing.md,
        }}
      >
        <label
          style={{
            ...button("secondary", { size: "sm" }),
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          <ImagePlus size={15} />
          {file ? "Change image" : "Add image"}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={loading}
            style={{ display: "none" }}
          />
        </label>

        <button
          type="submit"
          disabled={disabled}
          style={{
            ...button("primary", { size: "md" }),
            opacity: disabled ? 0.55 : 1,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          <Send size={15} />
          {loading ? "Posting…" : "Post"}
        </button>
      </div>
    </form>
  );
};

export default CreatePost;
