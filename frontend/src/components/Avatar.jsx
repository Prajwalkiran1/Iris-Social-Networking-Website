import { useState } from "react";
import { colors, gradients } from "../theme";

// Unified avatar: renders the user's photoURL if present, otherwise a
// brand-gradient circle with the first letter of their name. Used by:
// PostCard, SuggestedUsers, Profile, Chat, Search, Explore, HomeFeed.
//
// Props:
//   user     — { name, photoURL? } shape (photoURL optional)
//   size     — pixel diameter (default 40)
//   ring     — when true, wraps the avatar in a brand-gradient ring
//
const initialOf = (name) => (name ? name.trim().charAt(0).toUpperCase() : "?");

const Avatar = ({ user, size = 40, ring = false, style }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const hasPhoto = !!user?.photoURL && !imageFailed;

  const inner = (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: hasPhoto ? colors.surface : gradients.brand,
        color: colors.text,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: `${Math.max(11, Math.round(size * 0.4))}px`,
        flexShrink: 0,
        overflow: "hidden",
        ...(ring ? {} : style),
      }}
    >
      {hasPhoto ? (
        <img
          src={user.photoURL}
          alt={user?.name ? `${user.name}'s avatar` : "avatar"}
          onError={() => setImageFailed(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        initialOf(user?.name)
      )}
    </div>
  );

  if (!ring) return inner;

  return (
    <div
      style={{
        padding: "3px",
        borderRadius: "50%",
        background: gradients.brand,
        display: "inline-block",
        ...style,
      }}
    >
      {inner}
    </div>
  );
};

export default Avatar;
