import React, { useState } from "react";
import { auth } from "../firebaseConfig";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Redirect if already logged in
  React.useEffect(() => {
    if (currentUser) {
      navigate("/home");
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password should be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Firebase user created:", user);
      console.log("User properties:", {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified
      });

      // Update profile with name
      await updateProfile(user, { displayName: name });
      console.log("Profile updated with name:", name);
      
      // Refresh the user object to get the updated displayName
      await user.reload();
      console.log("User after profile update:", {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      });

      // Wait a moment for auth state to update
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create user in Neo4j backend
      let neo4jSuccess = false;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (!neo4jSuccess && retryCount < maxRetries) {
        try {
          console.log(`Creating user in Neo4j (attempt ${retryCount + 1}):`, { uid: user.uid, name, email });
          
          // First test with the exact same request as the working test button
          console.log("Testing with proxy...");
          const testResponse = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              uid: 'test-user-' + Date.now(),
              name: 'Test User',
              email: 'test@example.com'
            })
          });
          
          if (testResponse.ok) {
            const testData = await testResponse.json();
            console.log("TEST REQUEST SUCCESSFUL:", testData);
          } else {
            console.log("TEST REQUEST FAILED:", testResponse.status, testResponse.statusText);
          }
          
          // Now try with the actual user data
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              uid: user.uid,
              name: name,
              email: email
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log("Neo4j user creation response:", data);
            console.log("User successfully created in Neo4j");
            neo4jSuccess = true;
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (neo4jError) {
          console.error(`Failed to create user in Neo4j (attempt ${retryCount + 1}):`, neo4jError);
          console.error("Error details:", {
            message: neo4jError.message,
            name: neo4jError.name,
            stack: neo4jError.stack
          });
          
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`Retrying in 1 second... (${retryCount}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      if (!neo4jSuccess) {
        console.warn("User created in Firebase but failed to save in Neo4j after multiple attempts.");
        console.warn("The user will still be able to use the app with local storage.");
        // Don't show an alert that blocks the user - just log it
      }

      console.log("Navigating to home...");
      navigate("/home");
    } catch (err) {
      setError("Failed to create account. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <div style={styles.branding}>
          <h1 style={styles.logo}>
            iris<em>.</em>
          </h1>
          <p style={styles.tagline}>connect through shared interests</p>
          <div style={styles.divider}></div>
          <p style={styles.quote}>
            "Where meaningful connections begin with common passions"
          </p>
        </div>
      </div>
      
      <div style={styles.rightPanel}>
        <div style={styles.formContainer}>
          <h2 style={styles.title}>Join iris</h2>
          <p style={styles.subtitle}>Create your account to get started</p>
          
          {error && <div style={styles.error}>{error}</div>}
          
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
                required
              />
            </div>
            
            <div style={styles.inputGroup}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
              />
            </div>
            
            <div style={styles.inputGroup}>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                required
              />
            </div>
            
            <div style={styles.inputGroup}>
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={styles.input}
                required
              />
            </div>
            
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>
          
          <p style={styles.switchPrompt}>
            Already have an account?{" "}
            <span 
              style={styles.link}
              onClick={() => navigate("/")}
            >
              Sign in
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    backgroundColor: "#0a0a0a",
    fontFamily: "'Jost', sans-serif"
  },
  leftPanel: {
    width: "55%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    background: `
      radial-gradient(ellipse at 30% 50%, rgba(180, 150, 100, 0.15) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 20%, rgba(200, 170, 120, 0.08) 0%, transparent 50%),
      #0d0c0b
    `,
    backgroundImage: `
      linear-gradient(rgba(180,150,100,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(180,150,100,0.04) 1px, transparent 1px)
    `,
    backgroundSize: "60px 60px"
  },
  branding: {
    padding: "60px",
    textAlign: "center"
  },
  logo: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: "96px",
    fontWeight: "300",
    color: "#e8dcc8",
    letterSpacing: "-2px",
    lineHeight: "1",
    marginBottom: "24px"
  },
  tagline: {
    fontSize: "12px",
    fontWeight: "200",
    color: "rgba(232, 220, 200, 0.4)",
    letterSpacing: "4px",
    textTransform: "uppercase",
    marginBottom: "60px"
  },
  divider: {
    width: "40px",
    height: "1px",
    background: "rgba(201, 169, 110, 0.4)",
    margin: "0 auto 32px"
  },
  quote: {
    fontFamily: "'Cormorant Garamond', serif",
    fontStyle: "italic",
    fontSize: "18px",
    fontWeight: "300",
    color: "rgba(232, 220, 200, 0.35)",
    lineHeight: "1.7",
    maxWidth: "340px",
    margin: "0 auto"
  },
  rightPanel: {
    width: "45%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f7f5f0"
  },
  formContainer: {
    width: "80%",
    maxWidth: "400px"
  },
  title: {
    fontSize: "32px",
    fontWeight: "400",
    color: "#2c2c2c",
    marginBottom: "8px"
  },
  subtitle: {
    fontSize: "16px",
    color: "#666",
    marginBottom: "32px"
  },
  error: {
    backgroundColor: "#fee",
    color: "#c33",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "16px",
    fontSize: "14px"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  inputGroup: {
    position: "relative"
  },
  input: {
    width: "100%",
    padding: "16px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "16px",
    backgroundColor: "#fff",
    transition: "border-color 0.2s"
  },
  button: {
    width: "100%",
    padding: "16px",
    backgroundColor: "#2c2c2c",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s",
    marginTop: "8px"
  },
  switchPrompt: {
    textAlign: "center",
    marginTop: "24px",
    fontSize: "14px",
    color: "#666"
  },
  link: {
    color: "#2c2c2c",
    fontWeight: "500",
    cursor: "pointer",
    textDecoration: "underline"
  }
};

export default Signup;
