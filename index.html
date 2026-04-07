import { useState } from "react";
import { useAuth, DEMO_USERS } from "../lib/auth";

export default function Login() {
  const { login, error } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    login(username, password);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f3", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <div style={{ width: "44px", height: "44px", background: "#2D5016", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 22V12h6v10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "18px", fontWeight: "600", color: "#2D5016", letterSpacing: "-0.3px" }}>HD Construction</div>
              <div style={{ fontSize: "12px", color: "#C45C1A", fontWeight: "500" }}>Field Time</div>
            </div>
          </div>
          <p style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>Sign in to your account</p>
        </div>

        {/* Card */}
        <div style={{ background: "#fff", borderRadius: "16px", border: "0.5px solid #e0e0d8", padding: "28px" }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "#555", marginBottom: "6px" }}>Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. jose.hernandez"
                style={{ width: "100%", padding: "10px 12px", border: "0.5px solid #ddd", borderRadius: "8px", fontSize: "14px", outline: "none", background: "#fafaf8" }}
              />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "#555", marginBottom: "6px" }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{ width: "100%", padding: "10px 12px", border: "0.5px solid #ddd", borderRadius: "8px", fontSize: "14px", outline: "none", background: "#fafaf8" }}
              />
            </div>
            {error && <div style={{ background: "#fef2f2", border: "0.5px solid #fecaca", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", color: "#dc2626", marginBottom: "16px" }}>{error}</div>}
            <button type="submit" style={{ width: "100%", padding: "11px", background: "#2D5016", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "500", cursor: "pointer" }}>
              Sign in
            </button>
          </form>
        </div>

        {/* Demo accounts */}
        <div style={{ marginTop: "20px", background: "#fff", borderRadius: "12px", border: "0.5px solid #e0e0d8", padding: "16px" }}>
          <div style={{ fontSize: "11px", fontWeight: "600", color: "#888", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "10px" }}>Demo accounts</div>
          {DEMO_USERS.slice(0,4).map(u => (
            <div key={u.id} onClick={() => { setUsername(u.username); setPassword(u.password); }}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px", borderRadius: "6px", cursor: "pointer", marginBottom: "4px", border: "0.5px solid #f0f0ea" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "500", color: "#333" }}>{u.name}</div>
                <div style={{ fontSize: "11px", color: "#999" }}>{u.username}</div>
              </div>
              <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", fontWeight: "500",
                background: u.role === "accounting" ? "#faeee6" : u.role === "crew_manager" ? "#e8f0df" : "#e0f2fe",
                color: u.role === "accounting" ? "#7a3210" : u.role === "crew_manager" ? "#2D5016" : "#0369a1" }}>
                {u.role === "accounting" ? "Accounting" : u.role === "crew_manager" ? "Crew Mgr" : "Worker"}
              </span>
            </div>
          ))}
          <p style={{ fontSize: "11px", color: "#aaa", marginTop: "8px", textAlign: "center" }}>Click any account to fill credentials</p>
        </div>
      </div>
    </div>
  );
}
