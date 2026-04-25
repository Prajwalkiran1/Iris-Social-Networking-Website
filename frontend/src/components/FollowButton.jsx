import React, { useState, useEffect } from 'react';

const FollowButton = ({ targetUserId, currentUserId }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if already following on component mount and when dependencies change
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!currentUserId || currentUserId === targetUserId) return;
      
      console.log("Checking follow status for:", { currentUserId, targetUserId });
      
      try {
        const response = await fetch(`/api/follow/status/${currentUserId}/${targetUserId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("Follow status check result:", data);
          setIsFollowing(data.isFollowing);
        } else {
          // If status check fails, assume not following
          console.log("Follow status check failed, assuming not following");
          setIsFollowing(false);
        }
      } catch (error) {
        console.error('Follow status check error:', error);
        setIsFollowing(false);
      }
    };

    checkFollowStatus();
  }, [currentUserId, targetUserId]); // Only re-run when these IDs change

  const handleToggleFollow = async () => {
    console.log("Follow button clicked!", { targetUserId, currentUserId, isFollowing });
    if (!currentUserId || currentUserId === targetUserId) {
      console.log("Cannot follow - invalid user IDs");
      return;
    }
    
    setLoading(true);
    try {
      console.log("Sending follow request:", {
        followerUid: currentUserId,
        followingUid: targetUserId,
        currentFollowState: isFollowing
      });
      
      const response = await fetch('/api/follow/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          followerUid: currentUserId,
          followingUid: targetUserId
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Follow response:", data);
        setIsFollowing(!isFollowing);
        
        // Re-check status after toggle to verify
        setTimeout(async () => {
          try {
            const statusResponse = await fetch(`/api/follow/status/${currentUserId}/${targetUserId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              console.log("Follow status after toggle:", statusData);
              setIsFollowing(statusData.isFollowing);
            }
          } catch (error) {
            console.error("Status check after toggle failed:", error);
          }
        }, 500);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Follow toggle error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleToggleFollow();
    }}>
      <button 
        type="submit"
        disabled={loading || !currentUserId}
        style={{
          ...styles.button,
          backgroundColor: isFollowing ? '#ef4444' : '#3b82f6',
          opacity: loading ? 0.7 : 1,
          cursor: (loading || !currentUserId) ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? '...' : (isFollowing ? 'Unfollow' : 'Follow')}
      </button>
    </form>
  );
};

const styles = {
  button: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    color: "white",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s ease"
  }
};

export default FollowButton;