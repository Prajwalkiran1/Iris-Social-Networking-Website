import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import FollowButton from "../components/FollowButton";

const PREDEFINED_INTERESTS = [
  "Photography", "Travel", "Music", "Gaming", "Fitness",
  "Cooking", "Art", "Technology", "Reading", "Fashion",
  "Sports", "Movies", "Nature", "Writing", "Dancing"
];

const Profile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: "",
    bio: "",
    interests: []
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadProfile();
    } else {
      navigate("/");
    }
  }, [currentUser, navigate]);

  const loadProfile = async () => {
    try {
      // Try to get profile from backend
      const response = await fetch(`/api/profile/${currentUser.uid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.log("Profile not found, using defaults");
      setProfile({
        name: currentUser.displayName || "User",
        bio: "",
        interests: []
      });
    }

    // Load followers and following lists
    await loadFollowersAndFollowing();
    setLoading(false);
  };

  const loadFollowersAndFollowing = async () => {
    try {
      // Load followers
      const followersResponse = await fetch(`/api/follow/followers/${currentUser.uid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (followersResponse.ok) {
        const followersData = await followersResponse.json();
        setFollowers(followersData);
      }

      // Load following
      const followingResponse = await fetch(`/api/follow/following/${currentUser.uid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (followingResponse.ok) {
        const followingData = await followingResponse.json();
        setFollowing(followingData);
      }
    } catch (error) {
      console.error("Error loading followers/following:", error);
    }
  };

  const saveProfile = async () => {
    console.log("Profile saveProfile called", profile);
    setSaving(true);
    try {
      const response = await fetch(`/api/profile/${currentUser.uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Profile saved successfully:", data);
        setEditing(false);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const toggleInterest = (interest) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading profile...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.profileCard}>
        <div style={styles.header}>
          <div style={styles.avatar}>
            {currentUser?.displayName?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div style={styles.userInfo}>
            <h1 style={styles.name}>{profile.name}</h1>
            <p style={styles.email}>{currentUser?.email}</p>
          </div>
          <button
            style={styles.editButton}
            onClick={() => setEditing(!editing)}
          >
            {editing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        {editing ? (
          <form style={styles.editForm} onSubmit={(e) => {
            e.preventDefault();
            saveProfile();
          }}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                style={styles.input}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Bio</label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                style={styles.textarea}
                placeholder="Tell us about yourself..."
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Interests</label>
              <div style={styles.interestsGrid}>
                {PREDEFINED_INTERESTS.map(interest => (
                  <button
                    key={interest}
                    type="button"
                    style={{
                      ...styles.interestButton,
                      backgroundColor: profile.interests.includes(interest) ? "#3b82f6" : "#2a2a2a",
                      color: profile.interests.includes(interest) ? "#fff" : "#aaa"
                    }}
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              style={styles.saveButton}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        ) : (
          <div style={styles.profileContent}>
            {profile.bio && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Bio</h3>
                <p style={styles.bio}>{profile.bio}</p>
              </div>
            )}

            {profile.interests.length > 0 && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Interests</h3>
                <div style={styles.interestsList}>
                  {profile.interests.map(interest => (
                    <span key={interest} style={styles.interestTag}>
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Followers Section */}
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Followers ({followers.length})</h3>
                <button 
                  style={styles.toggleButton}
                  onClick={() => setShowFollowers(!showFollowers)}
                >
                  {showFollowers ? 'Hide' : 'Show'}
                </button>
              </div>
              {showFollowers && (
                <div style={styles.usersList}>
                  {followers.length > 0 ? (
                    followers.map(user => (
                      <div key={user.uid} style={styles.userItem}>
                        <div style={styles.userInfo}>
                          <div style={styles.userName}>{user.name}</div>
                          <div style={styles.userEmail}>{user.email}</div>
                        </div>
                        <FollowButton
                          targetUserId={user.uid}
                          currentUserId={currentUser.uid}
                        />
                      </div>
                    ))
                  ) : (
                    <div style={styles.emptyState}>No followers yet</div>
                  )}
                </div>
              )}
            </div>

            {/* Following Section */}
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Following ({following.length})</h3>
                <button 
                  style={styles.toggleButton}
                  onClick={() => setShowFollowing(!showFollowing)}
                >
                  {showFollowing ? 'Hide' : 'Show'}
                </button>
              </div>
              {showFollowing && (
                <div style={styles.usersList}>
                  {following.length > 0 ? (
                    following.map(user => (
                      <div key={user.uid} style={styles.userItem}>
                        <div style={styles.userInfo}>
                          <div style={styles.userName}>{user.name}</div>
                          <div style={styles.userEmail}>{user.email}</div>
                        </div>
                        <FollowButton
                          targetUserId={user.uid}
                          currentUserId={currentUser.uid}
                        />
                      </div>
                    ))
                  ) : (
                    <div style={styles.emptyState}>Not following anyone yet</div>
                  )}
                </div>
              )}
            </div>

            {profile.bio === "" && profile.interests.length === 0 && (
              <div style={styles.emptyState}>
                <p>No profile information yet. Click "Edit Profile" to add details.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    marginLeft: "70px",
    padding: "40px",
    minHeight: "100vh",
    backgroundColor: "#0a0a0a"
  },
  loading: {
    color: "#fff",
    textAlign: "center",
    fontSize: "18px"
  },
  profileCard: {
    maxWidth: "800px",
    margin: "0 auto",
    backgroundColor: "#1a1a1a",
    borderRadius: "16px",
    padding: "40px",
    color: "#fff"
  },
  header: {
    display: "flex",
    alignItems: "center",
    marginBottom: "30px",
    paddingBottom: "20px",
    borderBottom: "1px solid #333"
  },
  avatar: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    backgroundColor: "#3b82f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
    fontWeight: "600",
    marginRight: "20px"
  },
  userInfo: {
    flex: 1
  },
  name: {
    fontSize: "28px",
    fontWeight: "600",
    marginBottom: "5px"
  },
  email: {
    color: "#aaa",
    fontSize: "14px"
  },
  editButton: {
    padding: "10px 20px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500"
  },
  editForm: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  label: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#aaa"
  },
  input: {
    padding: "12px",
    backgroundColor: "#2a2a2a",
    border: "1px solid #333",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "16px"
  },
  textarea: {
    padding: "12px",
    backgroundColor: "#2a2a2a",
    border: "1px solid #333",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "16px",
    minHeight: "100px",
    resize: "vertical"
  },
  interestsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
    gap: "8px"
  },
  interestButton: {
    padding: "8px 12px",
    border: "1px solid #333",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "12px",
    transition: "all 0.2s"
  },
  saveButton: {
    padding: "12px 24px",
    backgroundColor: "#22c55e",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "500",
    alignSelf: "flex-start"
  },
  profileContent: {
    display: "flex",
    flexDirection: "column",
    gap: "30px"
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#fff"
  },
  bio: {
    color: "#ccc",
    lineHeight: "1.6"
  },
  interestsList: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap"
  },
  interestTag: {
    padding: "6px 12px",
    backgroundColor: "#2a2a2a",
    borderRadius: "20px",
    fontSize: "14px",
    color: "#ccc"
  },
  emptyState: {
    textAlign: "center",
    padding: "40px",
    color: "#666"
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px"
  },
  toggleButton: {
    padding: "6px 12px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500"
  },
  usersList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  userItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px",
    backgroundColor: "#2a2a2a",
    borderRadius: "8px",
    border: "1px solid #333"
  },
  userName: {
    fontSize: "16px",
    fontWeight: "500",
    color: "#fff",
    marginBottom: "2px"
  },
  userEmail: {
    fontSize: "14px",
    color: "#aaa"
  }
};

export default Profile;
