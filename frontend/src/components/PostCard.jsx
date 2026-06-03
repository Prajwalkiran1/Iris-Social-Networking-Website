import { useState } from "react";
import { FiHeart } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import FollowButton from "./FollowButton";
import Avatar from "./Avatar";
import useIsMobile from "../hooks/useIsMobile";
import {
  colors,
  glassCard,
  radius,
  spacing,
  type,
  transition,
} from "../theme";

const PostCard = ({ post, currentUserId, onLikeToggle }) => {
  const [hovered, setHovered] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const isMobile = useIsMobile();

  const handleLikeToggle = () => {
    setPulseKey((k) => k + 1);
    onLikeToggle(post.id);
  };

  // On phones, drop the glass backdrop-filter (heavy + lets the brand
  // vignette show through, making cards look thin/translucent) in favor
  // of a solid surface with a single hairline border.
  const surface = isMobile
    ? {
        background: colors.surface,
        border: `1px solid ${colors.glassBorder}`,
        borderRadius: radius.lg,
        boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset",
      }
    : glassCard({ padded: false });

  return (
    <article
      style={{
        ...surface,
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
          <Avatar user={post.author} size={40} />
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
