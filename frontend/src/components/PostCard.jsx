import { useState } from "react";
import { FiHeart } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import FollowButton from "./FollowButton";
import {
  colors,
  glassCard,
  radius,
  spacing,
  type,
  transition,
  avatar,
} from "../theme";

const initialOf = (name) => (name ? name.trim().charAt(0).toUpperCase() : "?");

const PostCard = ({ post, currentUserId, onLikeToggle }) => {
  const [hovered, setHovered] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);

  const handleLikeToggle = () => {
    setPulseKey((k) => k + 1);
    onLikeToggle(post.id);
  };

  return (
    <article
      style={{
        ...glassCard({ padded: false }),
        marginBottom: spacing.xl,
        padding: spacing.xl,
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
        transition: transition(["transform", "background", "box-shadow"]),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.md,
          marginBottom: spacing.md,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: spacing.md }}>
          <div style={avatar({ size: 40 })}>{initialOf(post.author.name)}</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ ...type.headline, color: colors.text }}>
              {post.author.name}
            </span>
            <span style={{ ...type.caption, color: colors.textFaint }}>
              {new Date(post.timestamp).toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
        {post.author.uid !== currentUserId && (
          <FollowButton
            targetUserId={post.author.uid}
            currentUserId={currentUserId}
          />
        )}
      </header>

      {post.content && (
        <p
          style={{
            ...type.body,
            color: colors.text,
            whiteSpace: "pre-wrap",
            marginBottom: post.imageUrl ? spacing.md : spacing.lg,
          }}
        >
          {post.content}
        </p>
      )}

      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt="post"
          style={{
            width: "100%",
            maxHeight: "440px",
            objectFit: "cover",
            borderRadius: radius.md,
            border: `1px solid ${colors.glassBorder}`,
            marginBottom: spacing.lg,
            display: "block",
          }}
        />
      )}

      <button
        type="button"
        onClick={handleLikeToggle}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: spacing.sm,
          background: "transparent",
          color: post.isLiked ? colors.danger : colors.textMuted,
          border: "none",
          padding: `${spacing.sm} ${spacing.md}`,
          marginLeft: `-${spacing.md}`,
          borderRadius: radius.pill,
          cursor: "pointer",
          transition: transition(["color", "background"]),
          fontSize: "14px",
          fontWeight: 500,
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = colors.glassBg)
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "transparent")
        }
        aria-label={post.isLiked ? "Unlike" : "Like"}
      >
        <span
          key={pulseKey}
          style={{
            display: "inline-flex",
            animation: pulseKey > 0 ? "iris-pulse 280ms ease-out" : "none",
          }}
        >
          {post.isLiked ? (
            <FaHeart size={18} color={colors.danger} />
          ) : (
            <FiHeart size={18} />
          )}
        </span>
        <span>{post.likeCount || 0}</span>
      </button>
    </article>
  );
};

export default PostCard;
