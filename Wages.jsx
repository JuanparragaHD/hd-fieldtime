import { useState } from "react";
import { useAuth } from "../lib/auth";

const navItems = {
  accounting: [
    { id: "timesheets", label: "Timesheets", icon: "⊞" },
    { id: "analytics", label: "Analytics", icon: "◈" },
    { id: "import", label: "Import / Export", icon: "⇅" },
    { id: "wages", label: "Wages", icon: "$" },
    { id: "admin", label: "Admin Panel", icon: "⚙" },
  ],
  crew_manager: [
    { id: "clockin", label: "Clock In/Out", icon: "◷" },
    { id: "crew", label: "My Crew", icon: "◉" },
  ],
  worker: [
    { id: "clockin", label: "Clock In/Out", icon: "◷" },
    { id: "myweek", label: "My Week", icon: "◈" },
  ],
};

export default function Layout({ children, activePage, setActivePage }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = navItems[user.role] || [];

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f3", display: "flex", flexDirection: "column" }}>
      {/* Topbar */}
      <div style={{ background: "#2D5016", height: "52px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={() => setMobileOpen(!mobileOpen)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: "18px", display: "none" }} className="mobile-menu-btn">☰</button>
          <div style={{ color: "#fff", fontSize: "15px", fontWeight: "500" }}>HD Construction</div>
          <span style={{ background: "#C45C1A", color: "#fff", fontSize: "11px", padding: "2px 8px", borderRadius: "20px" }}>Field Time</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "rgba(255,255,255,0.9)", fontSize: "13px", fontWeight: "500" }}>{user.name}</div>
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "11px" }}>
              {user.role === "accounting" ? "Accounting" : user.role === "crew_manager" ? `Crew Manager · ${user.crew}` : `Worker · ${user.crew}`}
            </div>
          </div>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#C45C1A", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "12px", fontWeight: "600" }}>
            {user.name.split(" ").map(n => n[0]).slice(0,2).join("")}
          </div>
          <button onClick={logout} style={{ background: "rgba(255,255,255,0.12)", border: "none", color: "rgba(255,255,255,0.8)", padding: "5px 10px", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}>Sign out</button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1 }}>
        {/* Sidebar */}
        <div style={{ width: "190px", background: "#fff", borderRight: "0.5px solid #e0e0d8", padding: "16px 0", flexShrink: 0 }}>
          <div style={{ padding: "0 12px", marginBottom: "4px" }}>
            <div style={{ fontSize: "10px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.07em", padding: "0 8px", marginBottom: "6px" }}>
              {user.role === "accounting" ? "Accounting" : user.role === "crew_manager" ? "Crew Manager" : "Worker"}
            </div>
            {items.map(item => (
              <div key={item.id} onClick={() => setActivePage(item.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "9px", padding: "8px 10px", borderRadius: "8px",
                  marginBottom: "2px", cursor: "pointer", fontSize: "13px",
                  background: activePage === item.id ? "#e8f0df" : "transparent",
                  color: activePage === item.id ? "#2D5016" : "#555",
                  fontWeight: activePage === item.id ? "500" : "400",
                  borderLeft: activePage === item.id ? "3px solid #2D5016" : "3px solid transparent",
                }}>
                <span style={{ fontSize: "14px" }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>

          {user.role === "accounting" && (
            <div style={{ padding: "0 12px", marginTop: "16px" }}>
              <div style={{ fontSize: "10px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.07em", padding: "0 8px", marginBottom: "6px" }}>Company</div>
              <div style={{ padding: "8px 10px", fontSize: "12px", color: "#555" }}>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <span style={{ background: "#faeee6", color: "#7a3210", padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: "500" }}>Construction</span>
                  <span style={{ background: "#e8f0df", color: "#2D5016", padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: "500" }}>Landscape</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: "20px", overflowX: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
