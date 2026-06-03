import React, { useState, useEffect } from "react";
import {
  FiEdit2 as Pencil,
  FiX as X,
  FiCheck as Check,
  FiChevronDown as ChevronDown,
  FiChevronUp as ChevronUp,
} from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import { apiGet, apiPut } from "../services/apiClient";
import { useNavigate } from "react-router-dom";
import FollowButton from "../components/FollowButton";
import {
  colors,
  spacing,
  radius,
  type,
  font,
  button,
  glassCard,
  tag,
  gradients,
  transition,
  pageShell,
  pageContent,
} from "../theme";

const PREDEFINED_INTERESTS = [
  "Photography", "Travel", "Music", "Gaming", "Fitness",
  "Cooking", "Art", "Technology", "Reading", "Fashion",
  "Sports", "Movies", "Nature", "Writing", "Dancing",
];

const initialOf = (name) => (name ? name.trim().charAt(0).toUpperCase() : "U");

const Profile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: "", bio: "", interests: [] });
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
            <div style={styles.avatarWrap}>
              <div style={styles.avatar}>
                {initialOf(profile.name || currentUser?.displayName)}
              </div>
            </div>
            <div style={styles.headerInfo}>
              <h1 style={{ ...type.title1, color: colors.text }}>
                {profile.name || "Your name"}
              </h1>
              <p style={{ ...type.footnote, color: colors.textFaint, marginTop: "4px" }}>
                {currentUser?.email}
              </p>
              <div style={styles.statsRow}>
                <Stat label="Followers" value={followers.length} />
                <span style={styles.statsDivider} />
                <Stat label="Following" value={following.length} />
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

        {/* Followers */}
        <CollapsibleList
          title="Followers"
          users={followers}
          open={showFollowers}
          onToggle={() => setShowFollowers((v) => !v)}
          emptyText="No followers yet"
          currentUserId={currentUser.uid}
        />

        {/* Following */}
        <CollapsibleList
          title="Following"
          users={following}
          open={showFollowing}
          onToggle={() => setShowFollowing((v) => !v)}
          emptyText="Not following anyone yet"
          currentUserId={currentUser.uid}
        />
      </div>
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

const Stat = ({ label, value }) => (
  <div style={{ display: "flex", flexDirection: "column" }}>
    <span style={{ ...type.headline, color: colors.text }}>{value}</span>
    <span style={{ ...type.caption, color: colors.textFaint, textTransform: "uppercase" }}>
      {label}
    </span>
  </div>
);

const CollapsibleList = ({ title, users, open, onToggle, emptyText, currentUserId }) => (
  <section
    style={{
      ...glassCard({ padded: false }),
      padding: spacing.xl,
      marginBottom: spacing.xl,
    }}
  >
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <h3 style={{ ...type.title3, color: colors.text }}>
        {title} <span style={{ color: colors.textFaint, fontWeight: 500 }}>({users.length})</span>
      </h3>
      <button
        type="button"
        onClick={onToggle}
        style={button("ghost", { size: "sm" })}
      >
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {open ? "Hide" : "Show"}
      </button>
    </header>
    {open && (
      <div style={{ marginTop: spacing.lg, display: "flex", flexDirection: "column", gap: spacing.sm }}>
        {users.length > 0 ? (
          users.map((user) => (
            <div key={user.uid} style={styles.userItem}>
              <div style={styles.userLeft}>
                <div style={styles.smallAvatar}>{initialOf(user.name)}</div>
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
          ))
        ) : (
          <div style={styles.emptyState}>{emptyText}</div>
        )}
      </div>
    )}
  </section>
);

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
  avatarWrap: {
    padding: "3px",
    borderRadius: "50%",
    background: gradients.brand,
    flexShrink: 0,
  },
  avatar: {
    width: "82px",
    height: "82px",
    borderRadius: "50%",
    background: colors.surface,
    color: colors.text,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    fontWeight: 700,
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
    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
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
  smallAvatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: gradients.brand,
    color: colors.text,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "14px",
    flexShrink: 0,
  },
};

export default Profile;
