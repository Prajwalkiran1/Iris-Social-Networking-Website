import { useState } from "react";
import { createPost } from "../services/postApi";
import { auth } from "../firebaseConfig";

const CreatePost = ({ onCreate }) => {
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);

  const user = auth.currentUser;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImage(imageUrl);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !image) return;

    if (!user) {
      console.log("❌ No user logged in");
      return;
    }

    console.log("🔥 Sending post:", {
      content,
      image,
      uid: user.uid
    });

    try {
      const newPost = await createPost({
        content,
        imageUrl: image,
        uid: user.uid
      });

      console.log("✅ API response:", newPost);

      onCreate(newPost);
      setContent("");
      setImage(null);
    } catch (err) {
      console.error("❌ API error:", err);
    }
  };

  return (
    <div style={styles.container}>
      <textarea
        placeholder="Share something..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={styles.textarea}
      />

      <input type="file" accept="image/*" onChange={handleImageChange} />

      {image && (
        <img src={image} alt="preview" style={styles.preview} />
      )}

      <button onClick={handleSubmit} style={styles.button}>
        Post
      </button>
    </div>
  );
};

const styles = {
  container: {
    background: "#1c1c1c",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "20px",
    color: "#fff"
  },
  textarea: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #333",
    background: "#111",
    color: "#fff",
    marginBottom: "10px"
  },
  preview: {
    width: "100%",
    marginTop: "10px",
    borderRadius: "8px"
  },
  button: {
    marginTop: "10px",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    background: "#c9a96e",
    color: "#000",
    fontWeight: "500"
  }
};

export default CreatePost;