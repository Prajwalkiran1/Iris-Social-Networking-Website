import { useState } from "react"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { useAuth } from "../contexts/AuthContext"
import { createPost } from "../services/postApi"
import { storage } from "../firebaseConfig"
import { colors, font, radius, space } from "../theme"

const CreatePost = ({ onCreate }) => {
  const [content, setContent] = useState("")
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { currentUser } = useAuth()

  const handleImageChange = (e) => {
    const selected = e.target.files[0]
    if (!selected) return
    if (selected.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB")
      return
    }
    setError("")
    setFile(selected)
    setPreviewUrl(URL.createObjectURL(selected))
  }

  const handleSubmit = async () => {
    if (!content.trim() && !file) return
    if (!currentUser) return

    setLoading(true)
    setError("")
    try {
      let imageUrl = ""
      if (file) {
        // Store the image in Firebase Storage; only the URL goes to the graph.
        const path = `posts/${currentUser.uid}/${Date.now()}-${file.name}`
        const snap = await uploadBytes(ref(storage, path), file)
        imageUrl = await getDownloadURL(snap.ref)
      }
      const newPost = await createPost({ content, imageUrl })
      onCreate(newPost)
      setContent("")
      setFile(null)
      setPreviewUrl(null)
    } catch (err) {
      console.error("Failed to create post:", err.message)
      setError("Couldn't publish your post. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      style={styles.container}
      onSubmit={(e) => {
        e.preventDefault()
        handleSubmit()
      }}
    >
      <textarea
        placeholder="Share something..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={styles.textarea}
        disabled={loading}
      />

      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        disabled={loading}
        style={styles.fileInput}
      />

      {previewUrl && <img src={previewUrl} alt="preview" style={styles.preview} />}

      {error && <div style={styles.error}>{error}</div>}

      <button
        type="submit"
        disabled={loading || (!content.trim() && !file)}
        style={{
          ...styles.button,
          opacity: loading || (!content.trim() && !file) ? 0.6 : 1,
          cursor: loading || (!content.trim() && !file) ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Posting…" : "Post"}
      </button>
    </form>
  )
}

const styles = {
  container: {
    background: colors.surfaceAlt,
    padding: space(5),
    borderRadius: radius.md,
    marginBottom: space(5),
  },
  textarea: {
    width: "100%",
    padding: "10px",
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    marginBottom: "10px",
    backgroundColor: colors.input,
    color: colors.text,
    fontSize: "14px",
    fontFamily: font.family,
    resize: "vertical",
    minHeight: "80px",
  },
  fileInput: {
    marginBottom: "10px",
    color: colors.textMuted,
    fontSize: "13px",
  },
  preview: {
    width: "100%",
    maxHeight: "200px",
    objectFit: "cover",
    marginTop: "10px",
    borderRadius: radius.md,
  },
  error: {
    marginTop: "10px",
    color: colors.danger,
    fontSize: "13px",
  },
  button: {
    marginTop: "10px",
    padding: "10px 18px",
    borderRadius: radius.md,
    border: "none",
    background: colors.success,
    color: "white",
    fontSize: "14px",
    fontWeight: 600,
  },
}

export default CreatePost
