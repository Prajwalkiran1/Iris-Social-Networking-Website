import { useState, useEffect } from "react";
import { FiCheck as Check, FiUserPlus as UserPlus } from "react-icons/fi";
import { apiGet, apiPost } from "../services/apiClient";
import { button, transition } from "../theme";

const FollowButton = ({ targetUserId, currentUserId }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hover, setHover] = useState(false);

  const isSelf = !currentUserId || currentUserId === targetUserId;

  useEffect(() => {
    if (isSelf) return;
    let active = true;
    apiGet(`/follow/status/${targetUserId}`)
      .then((data) => active && setIsFollowing(!!data.isFollowing))
      .catch(() => active && setIsFollowing(false));
    return () => {
      active = false;
    };
  }, [targetUserId, isSelf]);

  const handleToggleFollow = async () => {
    if (isSelf || loading) return;
    setLoading(true);
    const optimistic = !isFollowing;
    setIsFollowing(optimistic);
    try {
      await apiPost("/follow", { followingUid: targetUserId });
    } catch (error) {
      console.error("Follow toggle failed:", error.message);
      setIsFollowing(!optimistic);
    } finally {
      setLoading(false);
    }
  };

  if (isSelf) return null;

  // When following, swap to a "Following" pill with a check icon, glass
  // variant. Hovering exposes the destructive "Unfollow" action.
  const variant = isFollowing ? "secondary" : "primary";
  const label = loading
    ? "..."
    : isFollowing
    ? hover
      ? "Unfollow"
      : "Following"
    : "Follow";
  const Icon = isFollowing ? (hover ? null : Check) : UserPlus;

  return (
    <button
      type="button"
      onClick={handleToggleFollow}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={loading}
      style={{
        ...button(variant, { size: "sm" }),
        opacity: loading ? 0.7 : 1,
        cursor: loading ? "not-allowed" : "pointer",
        ...(isFollowing && hover
          ? {
              color: "#ef4444",
              borderColor: "rgba(239,68,68,0.40)",
            }
          : {}),
        transition: transition([
          "transform",
          "background",
          "color",
          "border-color",
          "box-shadow",
          "opacity",
        ]),
      }}
    >
      {Icon && <Icon size={14} />}
      {label}
    </button>
  );
};

export default FollowButton;
