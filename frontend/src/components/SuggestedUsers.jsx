import React from 'react';
import FollowButton from './FollowButton';
import { useAuth } from '../contexts/AuthContext';

const SuggestedUsers = ({ users, posts, onToggleFollow }) => {
  const { currentUser } = useAuth();

  const isUserFollowed = (userId) => {
    return posts.some(
      (post) => post.author.uid === userId && post.author.isFollowing
    )
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Suggested Users</h3>

      {users.map((user) => {
        const followed = isUserFollowed(user.uid)

        return (
          <div key={user.uid} style={styles.userCard}>
            <div style={styles.userInfo}>
              <div style={styles.userName}>{user.name}</div>
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
        )
      })}
    </div>
  )
}

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
}

export default SuggestedUsers