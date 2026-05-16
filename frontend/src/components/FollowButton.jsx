import { useState, useEffect } from "react";
import { apiGet, apiPost } from "../services/apiClient";

const FollowButton = ({ targetUserId, currentUserId }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

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
      setIsFollowing(!optimistic); // revert
    } finally {
      setLoading(false);
    }
  };

  if (isSelf) return null;

  return (
    <button
      type="button"
      onClick={handleToggleFollow}
      disabled={loading}
      style={{
        ...styles.button,
        backgroundColor: isFollowing ? "#ef4444" : "#3b82f6",
        opacity: loading ? 0.7 : 1,
        cursor: loading ? "not-allowed" : "pointer",
      }}
    >
      {loading ? "..." : isFollowing ? "Unfollow" : "Follow"}
    </button>
  );
};

const styles = {
  button: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "none",
    color: "white",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s ease",
  },
};

export default FollowButton;
