import React, { useState, useEffect } from "react";
import {
  FiEdit2 as Pencil,
  FiX as X,
  FiCheck as Check,
  FiCamera as Camera,
} from "react-icons/fi";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebaseConfig";
import { useAuth } from "../contexts/AuthContext";
import { apiGet, apiPut } from "../services/apiClient";
import { useNavigate } from "react-router-dom";
import FollowButton from "../components/FollowButton";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import Avatar from "../components/Avatar";
import {
  colors,
  spacing,
  radius,
  type,
  font,
  button,
  glassCard,
  tag,
  transition,
  pageShell,
  pageContent,
} from "../theme";

const PREDEFINED_INTERESTS = [
  "Photography", "Travel", "Music", "Gaming", "Fitness",
  "Cooking", "Art", "Technology", "Reading", "Fashion",
  "Sports", "Movies", "Nature", "Writing", "Dancing",
];

const Profile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: "", bio: "", interests: [] });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  // null | "followers" | "following"
  const [openList, setOpenList] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");

  useEffect(() => {
    if (currentUser) {
      loadProfile();
    } else {
      navigate("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, navigate]);

  const loadProfile = async () => {
    try {
      const data = await apiGet(`/profile/${currentUser.uid}`);
      setProfile(data);
    } catch (error) {
      setProfile({
        name: currentUser.displayName || "User",
        bio: "",
        interests: [],
      });
    }
    await loadFollowersAndFollowing();
    setLoading(false);
  };

  const loadFollowersAndFollowing = async () => {
    try {
      const [followersData, followingData] = await Promise.all([
        apiGet(`/follow/followers/${currentUser.uid}`),
        apiGet(`/follow/following/${currentUser.uid}`),
      ]);
      setFollowers(Array.isArray(followersData) ? followersData : []);
      setFollowing(Array.isArray(followingData) ? followingData : []);
    } catch (error) {
      console.error("Error loading followers/following:", error.message);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await apiPut(`/profile/${currentUser.uid}`, profile);
      setEditing(false);
    } catch (error) {
      console.error("Failed to save profile:", error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    if (file.size > 4 * 1024 * 1024) {
      setPhotoError("Avatar must be under 4MB");
      return;
    }
    setPhotoError("");
    setUploadingPhoto(true);
    try {
      const path = `avatars/${currentUser.uid}/${Date.now()}-${file.name}`;
      const snap = await uploadBytes(ref(storage, path), file);
      const url = await getDownloadURL(snap.ref);
      setProfile((prev) => ({ ...prev, photoURL: url }));
      // Persist immediately so other surfaces (feed, chat, etc.) start
      // showing the new avatar without waiting for a full Save.
      await apiPut(`/profile/${currentUser.uid}`, {
        name: profile.name,
        bio: profile.bio,
        interests: profile.interests,
        photoURL: url,
      });
    } catch (err) {
      console.error("Avatar upload failed:", err.message);
      setPhotoError("Couldn't upload avatar. Try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const toggleInterest = (interest) => {
    setProfile((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  if (loading) {
    return (
      <div data-page-shell style={pageShell()}>
        <div style={pageContent({ maxWidth: 820 })}>
          <p style={styles.placeholder}>Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div data-page-shell style={pageShell()}>
      <div style={pageContent({ maxWidth: 820 })}>
        <section
          style={{
            ...glassCard({ padded: false }),
            padding: spacing["2xl"],
            marginBottom: spacing.xl,
          }}
        >
          <header style={styles.header}>
            <div style={{ position: "relative", display: "inline-block" }}>
              <Avatar
                user={{
                  name: profile.name || currentUser?.displayName,
                  photoURL: profile.photoURL,
                }}
                size={82}
                ring
              />
              {editing && (
                <label
                  style={styles.avatarUploadBadge}
                  title="Change avatar"
                  aria-label="Change avatar"
                >
                  {uploadingPhoto ? "…" : <Camera size={14} />}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    disabled={uploadingPhoto}
                    style={{ display: "none" }}
                  />
                </label>
              )}
              {photoError && editing && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    marginTop: "6px",
                    fontSize: "12px",
                    color: colors.danger,
                  }}
                >
                  {photoError}
                </div>
              )}
            </div>
            <div style={styles.headerInfo}>
              <h1 style={{ ...type.title1, color: colors.text }}>
                {profile.name || "Your name"}
              </h1>
              <p style={{ ...type.footnote, color: colors.textFaint, marginTop: "4px" }}>
                {currentUser?.email}
              </p>
              <div style={styles.statsRow}>
                <Stat
                  label="Followers"
                  value={followers.length}
                  onClick={() => setOpenList("followers")}
                />
                <span style={styles.statsDivider} />
                <Stat
                  label="Following"
                  value={following.length}
                  onClick={() => setOpenList("following")}
                />
                <span style={styles.statsDivider} />
                <Stat label="Interests" value={profile.interests.length} />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              style={button(editing ? "ghost" : "secondary", { size: "sm" })}
            >
              {editing ? <X size={14} /> : <Pencil size={14} />}
              {editing ? "Cancel" : "Edit"}
            </button>
          </header>

          {editing ? (
            <form
              style={styles.editForm}
              onSubmit={(e) => {
                e.preventDefault();
                saveProfile();
              }}
            >
              <Field label="Name">
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, name: e.target.value }))
                  }
                  style={styles.input}
                />
              </Field>

              <Field label="Bio">
                <textarea
                  value={profile.bio}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  style={styles.textarea}
                  placeholder="Tell us about yourself…"
                  rows={3}
                />
              </Field>

              <Field label="Interests">
                <div style={styles.interestsGrid}>
                  {PREDEFINED_INTERESTS.map((interest) => {
                    const selected = profile.interests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        style={{
                          ...styles.interestPill,
                          background: selected
                            ? colors.primarySoft
                            : colors.glassBg,
                          color: selected ? colors.text : colors.textMuted,
                          borderColor: selected
                            ? colors.primaryBorder
                            : colors.glassBorder,
                        }}
                      >
                        {selected && <Check size={12} />}
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <button
                type="submit"
                disabled={saving}
                style={{
                  ...button("primary", { size: "md" }),
                  alignSelf: "flex-start",
                  marginTop: spacing.sm,
                  opacity: saving ? 0.7 : 1,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Saving…" : "Save Profile"}
              </button>
            </form>
          ) : (
            <>
              {profile.bio && (
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>Bio</h3>
                  <p style={{ ...type.body, color: colors.textMuted, lineHeight: 1.65 }}>
                    {profile.bio}
                  </p>
                </div>
              )}

              {profile.interests.length > 0 && (
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>Interests</h3>
                  <div style={styles.tagsRow}>
                    {profile.interests.map((interest) => (
                      <span key={interest} style={tag({ tone: "neutral" })}>
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.bio === "" && profile.interests.length === 0 && (
                <div style={styles.emptyState}>
                  No profile information yet. Click <strong>Edit</strong> to add details.
                </div>
              )}
            </>
          )}
        </section>

      </div>

      <Modal
        open={openList !== null}
        onClose={() => setOpenList(null)}
        title={openList === "following" ? "Following" : "Followers"}
      >
        <UserList
          users={openList === "following" ? following : followers}
          currentUserId={currentUser.uid}
          emptyText={
            openList === "following"
              ? "You're not following anyone yet."
              : "You don't have any followers yet."
          }
        />
      </Modal>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
    <label
      style={{
        ...type.caption,
        color: colors.textMuted,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      {label}
    </label>
    {children}
  </div>
);

const Stat = ({ label, value, onClick }) => {
  const clickable = typeof onClick === "function";
  return (
    <button
      type="button"
      onClick={clickable ? onClick : undefined}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        background: "transparent",
        border: "none",
        padding: clickable ? "6px 10px" : 0,
        marginLeft: clickable ? "-10px" : 0,
        borderRadius: "10px",
        cursor: clickable ? "pointer" : "default",
        color: "inherit",
        fontFamily: "inherit",
        textAlign: "left",
        transition: transition(["background"]),
      }}
      onMouseEnter={(e) => {
        if (clickable) e.currentTarget.style.background = colors.glassBg;
      }}
      onMouseLeave={(e) => {
        if (clickable) e.currentTarget.style.background = "transparent";
      }}
    >
      <span style={{ ...type.headline, color: colors.text }}>{value}</span>
      <span style={{ ...type.caption, color: colors.textFaint, textTransform: "uppercase" }}>
        {label}
      </span>
    </button>
  );
};

const UserList = ({ users, currentUserId, emptyText }) => {
  if (!users.length) {
    return (
      <EmptyState
        title="Nothing here yet"
        body={emptyText}
      />
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
      {users.map((user) => (
        <div key={user.uid} style={styles.userItem}>
          <div style={styles.userLeft}>
            <Avatar user={user} size={38} />
            <div style={{ minWidth: 0 }}>
              <div style={{ ...type.callout, color: colors.text, fontWeight: 600 }}>
                {user.name}
              </div>
              <div style={{ ...type.footnote, color: colors.textFaint }}>
                {user.email}
              </div>
            </div>
          </div>
          <FollowButton targetUserId={user.uid} currentUserId={currentUserId} />
        </div>
      ))}
    </div>
  );
};

const styles = {
  placeholder: {
    ...type.body,
    color: colors.textFaint,
    padding: spacing["2xl"],
    textAlign: "center",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: spacing.lg,
    paddingBottom: spacing.lg,
    marginBottom: spacing.xl,
    borderBottom: `1px solid ${colors.glassBorder}`,
    flexWrap: "wrap",
  },
  avatarUploadBadge: {
    position: "absolute",
    right: "-2px",
    bottom: "-2px",
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    background: colors.primary,
    color: colors.text,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    border: `2px solid ${colors.bg}`,
    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
    transition: transition(["transform", "background"]),
  },
  headerInfo: {
    flex: 1,
    minWidth: "200px",
  },
  statsRow: {
    display: "flex",
    alignItems: "center",
    gap: spacing.lg,
    marginTop: spacing.md,
    flexWrap: "wrap",
  },
  statsDivider: {
    width: "1px",
    height: "26px",
    background: colors.glassBorder,
  },
  editForm: {
    display: "flex",
    flexDirection: "column",
    gap: spacing.lg,
  },
  input: {
    padding: `${spacing.md} ${spacing.md}`,
    background: colors.input,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    fontSize: "15px",
    fontFamily: font.family,
    outline: "none",
    transition: transition(["border-color"]),
    boxSizing: "border-box",
  },
  textarea: {
    padding: `${spacing.md} ${spacing.md}`,
    background: colors.input,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    fontSize: "15px",
    fontFamily: font.family,
    minHeight: "110px",
    resize: "vertical",
    outline: "none",
    transition: transition(["border-color"]),
    boxSizing: "border-box",
  },
  interestsGrid: {
    display: "grid",
    // auto-fit + 110px minimum lets the pills land 2-per-row on phones
    // (below ~240px content width) and 3-4 per row on tablets and up.
    gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
    gap: spacing.sm,
  },
  interestPill: {
    padding: "8px 14px",
    border: "1px solid",
    borderRadius: radius.pill,
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 500,
    transition: transition(["background", "color", "border-color"]),
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontFamily: font.family,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...type.title3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  tagsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  emptyState: {
    ...type.footnote,
    color: colors.textFaint,
    textAlign: "center",
    padding: spacing.xl,
    background: colors.glassBgSoft,
    border: `1px dashed ${colors.glassBorder}`,
    borderRadius: radius.md,
  },
  userItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    padding: spacing.md,
    background: colors.glassBgSoft,
    border: `1px solid ${colors.glassBorder}`,
    borderRadius: radius.md,
  },
  userLeft: {
    display: "flex",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
    minWidth: 0,
  },
};

export default Profile;
