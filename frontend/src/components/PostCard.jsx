import FollowButton from "./FollowButton"

const PostCard = ({ post, currentUserId, onFollowToggle, onLikeToggle }) => {
  const handleLikeToggle = () => {
    onLikeToggle(post.id)
  }

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={{ margin: 0 }}>{post.author.name}</h3>
        {post.author.uid !== currentUserId && (
          <FollowButton
            targetUserId={post.author.uid}
            currentUserId={currentUserId}
          />
        )}
      </div>
      <p style={styles.content}>{post.content}</p>
      {post.imageUrl && (
        <img src={post.imageUrl} alt="post" style={styles.image} />
      )}
      <small style={styles.time}>
        {new Date(post.timestamp).toLocaleString()}
      </small>
      <div
        style={{
          ...styles.likes,
          cursor: "pointer",
          color: post.isLiked ? "red" : "white"
        }}
        onClick={handleLikeToggle}
      >
        ❤️ {post.likeCount}
      </div>
    </div>
  )
}



const styles = {
  card: {
    background: "#1f1f1f",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "20px"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  content: {
    marginTop: "10px"
  },
  time: {
    color: "gray"
  },
  likes: {
    marginTop: "10px"
  },
  image: {
    width: "100%",
    maxHeight: "400px",
    objectFit: "cover",
    marginTop: "10px",
    borderRadius: "8px",
    border: "1px solid #333"
  },
}

export default PostCard