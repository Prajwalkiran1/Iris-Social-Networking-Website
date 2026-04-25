import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { createPost } from "../services/postApi"

const CreatePost = ({ onCreate }) => {
  const [content, setContent] = useState("")
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const { currentUser } = useAuth()

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Convert to base64 string for storage
        const result = reader.result;
        console.log("Image converted to base64:", result.substring(0, 50) + "...");
        setImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    console.log("CreatePost handleSubmit called", { content, image, currentUser });
    if (!content.trim() && !image) {
      console.log("No content or image, returning");
      return;
    }
    if (!currentUser) {
      console.log("No current user, returning");
      return;
    }

    setLoading(true)
    try {
      const postData = {
        content,
        imageUrl: image || "",
        uid: currentUser.uid
      }

      console.log("Creating post with data:", postData);
      const newPost = await createPost(postData)
      console.log("Post created successfully:", newPost);
      onCreate(newPost)
      setContent("")
      setImage(null)
    } catch (error) {
      console.error("Failed to create post:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form style={styles.container} onSubmit={(e) => {
      e.preventDefault();
      handleSubmit();
    }}>
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

      {image && (
        <img src={image} alt="preview" style={styles.preview} />
      )}

      <button 
        type="submit"
        disabled={loading || !content.trim()}
        style={{
          ...styles.button,
          opacity: (loading || !content.trim()) ? 0.6 : 1,
          cursor: (loading || !content.trim()) ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? "Posting..." : "Post"}
      </button>
    </form>
  )
}

const styles = {
  container: {
    background: "#1f1f1f",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "20px"
  },
  textarea: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "none",
    marginBottom: "10px",
    backgroundColor: "#2a2a2a",
    color: "#fff",
    fontSize: "14px",
    resize: "vertical",
    minHeight: "80px"
  },
  fileInput: {
    marginBottom: "10px",
    color: "#fff"
  },
  preview: {
    width: "100%",
    maxHeight: "200px",
    objectFit: "cover",
    marginTop: "10px",
    borderRadius: "8px"
  },
  button: {
    marginTop: "10px",
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    background: "#22c55e",
    color: "white",
    fontSize: "14px",
    fontWeight: "500"
  }
}

export default CreatePost