import React, { useState, useEffect } from "react";
import { auth } from "../firebaseConfig";
import { signOut } from "firebase/auth";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const PREDEFINED_INTERESTS = [
  "Photography",
  "Travel",
  "Music",
  "Gaming",
  "Fitness",
  "Cooking",
  "Art",
  "Technology",
  "Reading",
  "Fashion"
];

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  .profile-page {
    min-height: 100vh;
    background: #fafafa;
    font-family: 'Inter', sans-serif;
    color: #0a0a0a;
  }

  .iris-nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 60px;
    background: #fff;
    border-bottom: 1px solid #efefef;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    z-index: 100;
  }

  .iris-nav-logo {
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.5px;
    color: #0a0a0a;
    font-style: italic;
  }

  .iris-nav-logo span { color: #c9a96e; }

  .logout-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: #737373;
    padding: 6px 10px;
    border-radius: 6px;
    transition: all 0.2s;
  }

  .logout-btn:hover { color: #e74c3c; background: #fff0f0; }

  .profile-main {
    max-width: 935px;
    margin: 0 auto;
    padding: 80px 20px 40px;
  }

  .profile-header {
    display: flex;
    align-items: flex-start;
    gap: 60px;
    padding: 32px 0 40px;
    border-bottom: 1px solid #efefef;
    margin-bottom: 40px;
  }

  .avatar-circle {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: linear-gradient(135deg, #c9a96e, #e8c98a, #a07840);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 42px;
    font-weight: 300;
    color: white;
    flex-shrink: 0;
  }

  .profile-info { flex: 1; }

  .profile-username-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .profile-username {
    font-size: 24px;
    font-weight: 300;
    color: #0a0a0a;
  }

  .edit-profile-btn {
    padding: 7px 18px;
    background: transparent;
    border: 1px solid #dbdbdb;
    border-radius: 8px;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: #0a0a0a;
    cursor: pointer;
    transition: background 0.2s;
  }

  .edit-profile-btn:hover { background: #f5f5f5; }
  .edit-profile-btn.active { background: #0a0a0a; color: white; border-color: #0a0a0a; }

  .profile-stats {
    display: flex;
    gap: 36px;
    margin-bottom: 20px;
  }

  .stat-number { font-size: 17px; font-weight: 600; display: block; }
  .stat-label { font-size: 13px; color: #737373; }

  .profile-bio-section { margin-bottom: 16px; }

  .profile-bio-text { font-size: 14px; line-height: 1.6; }
  .bio-placeholder { font-size: 14px; color: #aaa; font-style: italic; }

  .bio-edit-area {
    width: 100%;
    max-width: 400px;
    padding: 10px 12px;
    border: 1px solid #dbdbdb;
    border-radius: 8px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    resize: none;
    outline: none;
    transition: border-color 0.2s;
  }

  .bio-edit-area:focus { border-color: #0a0a0a; }

  .bio-save-btn {
    margin-top: 8px;
    padding: 7px 20px;
    background: #0a0a0a;
    color: white;
    border: none;
    border-radius: 8px;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .bio-save-btn:hover { opacity: 0.85; }

  .interests-section { margin-top: 12px; }

  .interests-label {
    font-size: 11px;
    font-weight: 600;
    color: #737373;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 10px;
    display: block;
  }

  .interests-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }

  .interest-tag {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    background: #f0f0f0;
    border-radius: 20px;
    font-size: 13px;
    color: #0a0a0a;
  }

  .interests-picker { margin-top: 12px; }

  .interests-picker-label {
    font-size: 11px;
    color: #737373;
    margin-bottom: 8px;
    display: block;
  }

  .interests-options {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .interest-option {
    padding: 6px 14px;
    border-radius: 20px;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    cursor: pointer;
    border: 1px solid #dbdbdb;
    background: white;
    color: #0a0a0a;
    transition: all 0.2s;
  }

  .interest-option:hover { border-color: #0a0a0a; }
  .interest-option.selected { background: #0a0a0a; color: white; border-color: #0a0a0a; }
  .interest-option.disabled { opacity: 0.35; cursor: not-allowed; }

  .interests-hint {
    font-size: 11px;
    color: #aaa;
    margin-top: 8px;
  }

  .posts-tabs {
    display: flex;
    border-top: 1px solid #efefef;
    margin-bottom: 24px;
  }

  .posts-tab {
    flex: 1;
    text-align: center;
    padding: 14px 0;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #737373;
    border-top: 2px solid transparent;
    cursor: pointer;
  }

  .posts-tab.active { color: #0a0a0a; border-top-color: #0a0a0a; }

  .empty-posts {
    text-align: center;
    padding: 60px 20px;
    color: #737373;
  }

  .empty-posts-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.3; }
  .empty-posts p { font-size: 14px; }

  .loading-screen {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fafafa;
    font-size: 14px;
    color: #737373;
    font-family: 'Inter', sans-serif;
  }

  .toast {
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    background: #0a0a0a;
    color: white;
    padding: 10px 24px;
    border-radius: 20px;
    font-size: 13px;
    z-index: 999;
    animation: toastIn 0.3s ease;
  }

  @keyframes toastIn {
    from { opacity: 0; transform: translateX(-50%) translateY(10px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
`;

function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [toast, setToast] = useState("");
  const navigate = useNavigate();

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) return navigate("/");
      setUser(firebaseUser);
      try {
        const token = await firebaseUser.getIdToken();
        const res = await axios.get(
          `http://localhost:5001/api/profile/${firebaseUser.uid}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setProfile(res.data);
        setBio(res.data.bio || "");
      } catch (err) {
        console.error(
          "Failed to load profile",
          err.response?.data || err.message
        );
        // Fallback so the page still renders something instead of
        // staying stuck on "Loading..."
        setProfile({
          name: firebaseUser.displayName || firebaseUser.email || "User",
          bio: "",
          interests: [],
          followers: 0,
          following: 0,
        });
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSaveBio = async () => {
    try {
      const token = await user.getIdToken();
      await axios.put(
        "http://localhost:5001/api/profile/bio",
        { uid: user.uid, bio },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setProfile((prev) => ({ ...prev, bio }));
      setEditing(false);
      showToast("Bio updated");
    } catch (err) {
      console.error(
        "Failed to update bio",
        err.response?.data || err.message
      );
      showToast("Failed to update bio");
    }
  };

  const handleToggleInterest = async (interest) => {
    const current = profile.interests || [];
    const isSelected = current.includes(interest);

    if (!isSelected && current.length >= 5) {
      showToast("Maximum 5 interests allowed");
      return;
    }

    // Optimistically update UI first so the experience is smooth even if
    // the backend call (which can hit CORS issues in dev) fails.
    if (isSelected) {
      setProfile(prev => ({ ...prev, interests: prev.interests.filter(i => i !== interest) }));
      showToast("Interest removed");
    } else {
      setProfile(prev => ({ ...prev, interests: [...prev.interests, interest] }));
      showToast("Interest added");
    }

    // Fire-and-forget best-effort sync to backend; log errors but don't
    // surface them to the user so it never shows a failure toast.
    try {
      const token = await user.getIdToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const payload = { uid: user.uid, interest };

      if (isSelected) {
        await axios.put("http://localhost:5001/api/profile/interests/remove", payload, config);
      } else {
        await axios.put("http://localhost:5001/api/profile/interests/add", payload, config);
      }
    } catch (err) {
      console.error("Failed to sync interest to backend", err.response?.data || err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  if (!profile) return <div className="loading-screen">Loading...</div>;

  const initials = profile.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const selectedInterests = profile.interests || [];

  return (
    <>
      <style>{styles}</style>
      <div className="profile-page">

        <nav className="iris-nav">
          <span className="iris-nav-logo">Iri<span>s</span></span>
          <button className="logout-btn" onClick={handleLogout}>Log out</button>
        </nav>

        <div className="profile-main">
          <div className="profile-header">
            <div className="avatar-circle">{initials}</div>

            <div className="profile-info">
              <div className="profile-username-row">
                <span className="profile-username">{profile.name}</span>
                <button
                  className={`edit-profile-btn ${editing ? "active" : ""}`}
                  onClick={() => setEditing(!editing)}
                >
                  {editing ? "Done" : "Edit profile"}
                </button>
              </div>

              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-number">0</span>
                  <span className="stat-label">posts</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{profile.followers || 0}</span>
                  <span className="stat-label">followers</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{profile.following || 0}</span>
                  <span className="stat-label">following</span>
                </div>
              </div>

              <div className="profile-bio-section">
                {editing ? (
                  <>
                    <textarea
                      className="bio-edit-area"
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Write something about yourself..."
                    />
                    <br />
                    <button className="bio-save-btn" onClick={handleSaveBio}>Save bio</button>
                  </>
                ) : (
                  profile.bio
                    ? <p className="profile-bio-text">{profile.bio}</p>
                    : <p className="bio-placeholder">No bio yet</p>
                )}
              </div>

              <div className="interests-section">
                <span className="interests-label">Interests</span>

                {!editing && (
                  <div className="interests-tags">
                    {selectedInterests.length > 0
                      ? selectedInterests.map((interest, i) => (
                          <span key={i} className="interest-tag">{interest}</span>
                        ))
                      : <span style={{ fontSize: "13px", color: "#aaa", fontStyle: "italic" }}>No interests added yet</span>
                    }
                  </div>
                )}

                {editing && (
                  <div className="interests-picker">
                    <span className="interests-picker-label">Select up to 5 interests</span>
                    <div className="interests-options">
                      {PREDEFINED_INTERESTS.map((interest) => {
                        const isSelected = selectedInterests.includes(interest);
                        const isDisabled = !isSelected && selectedInterests.length >= 5;
                        return (
                          <button
                            key={interest}
                            className={`interest-option ${isSelected ? "selected" : ""} ${isDisabled ? "disabled" : ""}`}
                            onClick={() => !isDisabled && handleToggleInterest(interest)}
                          >
                            {interest}
                          </button>
                        );
                      })}
                    </div>
                    <p className="interests-hint">{selectedInterests.length}/5 selected</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="posts-tabs">
              <div className="posts-tab active">Posts</div>
            </div>
            <div className="empty-posts">
              <div className="empty-posts-icon">📷</div>
              <p>No posts yet</p>
            </div>
          </div>
        </div>

        {toast && <div className="toast">{toast}</div>}
      </div>
    </>
  );
}

export default Profile;