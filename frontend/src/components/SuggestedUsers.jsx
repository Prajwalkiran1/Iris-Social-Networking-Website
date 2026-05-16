import React from 'react';
import FollowButton from './FollowButton';
import { useAuth } from '../contexts/AuthContext';

// Renders graph-native "people you may know" — each user may carry a
// `mutuals` count (shared connections) and/or `interests`.
const SuggestedUsers = ({ users = [] }) => {
  const { currentUser } = useAuth();

  if (!users.length) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>People you may know</h3>
        <p style={styles.empty}>
          Follow a few people and we'll suggest connections from your network.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>People you may know</h3>

      {users.map((user) => (
        <div key={user.uid} style={styles.userCard}>
          <div style={styles.userInfo}>
            <div style={styles.userName}>{user.name}</div>
            {user.mutuals > 0 && (
              <div style={styles.mutuals}>
                {user.mutuals} mutual connection{user.mutuals > 1 ? 's' : ''}
              </div>
            )}
            {user.interests && user.interests.length > 0 && (
              <div style={styles.interests}>
                {user.interests.slice(0, 3).map((interest, i) => (
                  <span key={i} style={styles.interestTag}>
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </div>

          <FollowButton
            targetUserId={user.uid}
            currentUserId={currentUser?.uid}
          />
        </div>
      ))}
    </div>
  );
};

const styles = {
  container: {
    background: "#1f1f1f",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "20px"
  },
  title: {
    color: "#fff",
    marginBottom: "15px",
    fontSize: "18px",
    fontWeight: "500"
  },
  empty: {
    color: "#888",
    fontSize: "13px",
    lineHeight: 1.5
  },
  userCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
    padding: "10px 0",
    borderBottom: "1px solid #333"
  },
  userInfo: {
    flex: 1,
    marginRight: "10px"
  },
  userName: {
    color: "#fff",
    fontWeight: "500",
    marginBottom: "4px"
  },
  mutuals: {
    color: "#8b5cf6",
    fontSize: "12px",
    marginBottom: "5px"
  },
  interests: {
    display: "flex",
    gap: "5px",
    flexWrap: "wrap"
  },
  interestTag: {
    padding: "2px 6px",
    backgroundColor: "#333",
    borderRadius: "10px",
    fontSize: "11px",
    color: "#aaa"
  }
};

export default SuggestedUsers;
