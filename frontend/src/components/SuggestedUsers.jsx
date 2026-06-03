import React from "react";
import { FiUsers as Users } from "react-icons/fi";
import FollowButton from "./FollowButton";
import Avatar from "./Avatar";
import { useAuth } from "../contexts/AuthContext";
import {
  colors,
  glassCard,
  spacing,
  type,
  tag,
  transition,
} from "../theme";

const SuggestedUsers = ({ users = [] }) => {
  const { currentUser } = useAuth();

  return (
    <aside
      style={{
        ...glassCard({ padded: false }),
        padding: spacing.xl,
        marginBottom: spacing.xl,
      }}
    >
      <h3
        style={{
          ...type.headline,
          color: colors.text,
          marginBottom: spacing.lg,
          display: "flex",
          alignItems: "center",
          gap: spacing.sm,
        }}
      >
        People you may know
      </h3>

      {!users.length ? (
        <p style={{ ...type.footnote, color: colors.textFaint }}>
          Follow a few people and we'll suggest connections from your network.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          {users.map((user) => (
            <div
              key={user.uid}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: spacing.md,
                padding: spacing.sm,
                borderRadius: "12px",
                transition: transition(["background"]),
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = colors.glassBg)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: spacing.md,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <Avatar user={user} size={38} />
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <span
                    style={{
                      ...type.callout,
                      color: colors.text,
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {user.name}
                  </span>
                  {user.mutuals > 0 && (
                    <span
                      style={{
                        ...type.caption,
                        color: colors.primaryAlt,
                        marginTop: "2px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Users size={11} />
                      {user.mutuals} mutual connection{user.mutuals > 1 ? "s" : ""}
                    </span>
                  )}
                  {user.interests && user.interests.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        gap: "4px",
                        flexWrap: "wrap",
                        marginTop: spacing.sm,
                      }}
                    >
                      {user.interests.slice(0, 3).map((interest, i) => (
                        <span key={i} style={tag({ tone: "neutral" })}>
                          {interest}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <FollowButton
                targetUserId={user.uid}
                currentUserId={currentUser?.uid}
              />
            </div>
          ))}
        </div>
      )}
    </aside>
  );
};

export default SuggestedUsers;
