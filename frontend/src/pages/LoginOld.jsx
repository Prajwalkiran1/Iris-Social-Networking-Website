import React, { useState } from "react";
import { auth } from "../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Jost:wght@200;300;400&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  .iris-body {
    min-height: 100vh;
    background-color: #0a0a0a;
    display: flex;
    font-family: 'Jost', sans-serif;
    overflow: hidden;
  }

  .iris-left {
    width: 55%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .iris-left-bg {
    position: absolute;
    inset: 0;
    background: 
      radial-gradient(ellipse at 30% 50%, rgba(180, 150, 100, 0.15) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 20%, rgba(200, 170, 120, 0.08) 0%, transparent 50%),
      #0d0c0b;
  }

  .iris-grid {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(180,150,100,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(180,150,100,0.04) 1px, transparent 1px);
    background-size: 60px 60px;
  }

  .iris-left-content {
    position: relative;
    z-index: 2;
    padding: 60px;
  }

  .iris-wordmark {
    font-family: 'Cormorant Garamond', serif;
    font-size: 96px;
    font-weight: 300;
    color: #e8dcc8;
    letter-spacing: -2px;
    line-height: 1;
    margin-bottom: 24px;
  }

  .iris-wordmark em {
    font-style: italic;
    color: #c9a96e;
  }

  .iris-tagline {
    font-size: 12px;
    font-weight: 200;
    color: rgba(232, 220, 200, 0.4);
    letter-spacing: 4px;
    text-transform: uppercase;
    margin-bottom: 60px;
  }

  .iris-divider {
    width: 40px;
    height: 1px;
    background: rgba(201, 169, 110, 0.4);
    margin-bottom: 32px;
  }

  .iris-quote {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 18px;
    font-weight: 300;
    color: rgba(232, 220, 200, 0.35);
    line-height: 1.7;
    max-width: 340px;
  }

  .iris-right {
    width: 45%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f7f5f0;
    position: relative;
  }

  .iris-right::before {
    content: '';
    position: absolute;
    left: 0;
    top: 10%;
    bottom: 10%;
    width: 1px;
    background: linear-gradient(to bottom, transparent, rgba(180,150,100,0.3), transparent);
  }

  .iris-form-container {
    width: 100%;
    max-width: 360px;
    padding: 60px 40px;
    animation: fadeUp 0.8s ease forwards;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .iris-form-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 36px;
    font-weight: 300;
    color: #1a1814;
    margin-bottom: 8px;
    letter-spacing: -0.5px;
  }

  .iris-form-subtitle {
    font-size: 12px;
    font-weight: 200;
    color: #9a9088;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 48px;
  }

  .iris-field {
    margin-bottom: 24px;
  }

  .iris-label {
    display: block;
    font-size: 10px;
    font-weight: 300;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #9a9088;
    margin-bottom: 8px;
  }

  .iris-input {
    width: 100%;
    padding: 12px 0;
    background: transparent;
    border: none;
    border-bottom: 1px solid #d4cdc4;
    font-family: 'Jost', sans-serif;
    font-size: 15px;
    font-weight: 300;
    color: #1a1814;
    outline: none;
    transition: border-color 0.3s ease;
  }

  .iris-input:focus {
    border-bottom-color: #c9a96e;
  }

  .iris-input::placeholder {
    color: #c4bdb4;
    font-weight: 200;
  }

  .iris-error {
    font-size: 12px;
    color: #c0392b;
    margin-bottom: 20px;
    font-weight: 300;
    letter-spacing: 0.5px;
  }

  .iris-btn {
    width: 100%;
    padding: 14px;
    margin-top: 16px;
    background: #1a1814;
    color: #e8dcc8;
    border: none;
    font-family: 'Jost', sans-serif;
    font-size: 11px;
    font-weight: 300;
    letter-spacing: 4px;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .iris-btn::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background: #c9a96e;
    transition: width 0.4s ease;
  }

  .iris-btn:hover { background: #2a2520; }
  .iris-btn:hover::after { width: 100%; }
  .iris-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .iris-footer-link {
    margin-top: 32px;
    font-size: 12px;
    font-weight: 200;
    color: #9a9088;
    letter-spacing: 1px;
    text-align: center;
  }

  .iris-footer-link a {
    color: #c9a96e;
    text-decoration: none;
    border-bottom: 1px solid rgba(201,169,110,0.3);
    padding-bottom: 1px;
    transition: border-color 0.2s;
  }

  .iris-footer-link a:hover { border-color: #c9a96e; }

  .iris-ornament {
    position: absolute;
    bottom: 40px;
    right: 40px;
    font-family: 'Cormorant Garamond', serif;
    font-size: 11px;
    color: rgba(154,144,136,0.4);
    letter-spacing: 2px;
    text-transform: uppercase;
  }
`;

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) return setError("Please fill in all fields.");
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/home");
    } catch (err) {
      console.log(err);
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="iris-body">
        <div className="iris-left">
          <div className="iris-left-bg" />
          <div className="iris-grid" />
          <div className="iris-left-content">
            <div className="iris-wordmark">Ir<em>is</em></div>
            <div className="iris-tagline">Social · Network · Platform</div>
            <div className="iris-divider" />
            <p className="iris-quote">
              "Where meaningful connections find their natural light."
            </p>
          </div>
        </div>

        <div className="iris-right">
          <div className="iris-form-container">
            <h2 className="iris-form-title">Welcome back</h2>
            <p className="iris-form-subtitle">Sign in to continue</p>

            {error && <p className="iris-error">{error}</p>}

            <div className="iris-field">
              <label className="iris-label">Email Address</label>
              <input
                className="iris-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="iris-field">
              <label className="iris-label">Password</label>
              <input
                className="iris-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button className="iris-btn" onClick={handleLogin} disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <p className="iris-footer-link">
              New to Iris? <a href="/signup">Create an account</a>
            </p>
          </div>
          <span className="iris-ornament">Iris © 2026</span>
        </div>
      </div>
    </>
  );
}

export default Login;