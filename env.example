import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { useTimesheets, getWeekStart, getWeekEnd, formatDate } from "../lib/timesheets";
import { projects } from "../data/projects";
import { costCodes } from "../data/projects";

export default function ClockIn() {
  const { user } = useAuth();
  const { entries, clockIn, clockOut } = useTimesheets();
  const [now, setNow] = useState(new Date());
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedCode, setSelectedCode] = useState("");
  const [breakActive, setBreakActive] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const today = now.toISOString().split("T")[0];
  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd(weekStart);

  const todayEntry = entries.find(e => e.workerId === user.workerId && e.date === today && e.status === "clocked_in");
  const isClockedIn = !!todayEntry;

  const weekEntries = entries.filter(e => {
    const d = new Date(e.date);
    return e.workerId === user.workerId && d >= weekStart && d <= weekEnd;
  });

  const weekTotal = weekEntries.reduce((s,e) => s + e.totalHours, 0);
  const weekOT = weekEntries.reduce((s,e) => s + e.otHours, 0);

  const formatTime = (d) => d.toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit", second:"2-digit" });
  const formatTimeShort = (d) => d.toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit" });

  const handleClockIn = () => {
    if (!selectedProject) { setMsg("Please select a project first"); return; }
    if (!selectedCode) { setMsg("Please select a cost code first"); return; }
    clockIn({
      workerId: user.workerId,
      workerName: user.name,
      company: user.company,
      crew: user.crew,
      date: today,
      clockIn: formatTimeShort(now),
      breakMins: 0,
      totalHours: 0,
      otHours: 0,
      project: selectedProject,
      costCode: selectedCode,
    });
    setMsg("Clocked in successfully!");
    setTimeout(() => setMsg(""), 3000);
  };

  const handleClockOut = () => {
    clockOut(user.workerId, today, formatTimeShort(now));
    setMsg("Clocked out successfully!");
    setTimeout(() => setMsg(""), 3000);
  };

  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const dayDates = days.map((d,i) => { const dd = new Date(weekStart); dd.setDate(dd.getDate()+i); return dd; });

  return (
    <div>
      <div style={{ fontSize:"18px", fontWeight:"500", marginBottom:"16px" }}>Clock In / Out</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", maxWidth:"900px" }}>

        {/* Clock card */}
        <div style={{ background:"#fff", borderRadius:"12px", border:"0.5px solid #e5e5e0", padding:"20px" }}>
          <div style={{ fontSize:"13px", color:"#888" }}>Good {now.getHours() < 12 ? "morning" : now.getHours() < 17 ? "afternoon" : "evening"},</div>
          <div style={{ fontSize:"16px", fontWeight:"500", margin:"2px 0 4px" }}>{user.name}</div>
          <div style={{ fontSize:"34px", fontWeight:"500", color:"#2D5016", margin:"6px 0 2px", fontVariantNumeric:"tabular-nums" }}>{formatTime(now)}</div>
          <div style={{ fontSize:"12px", color:"#888", marginBottom:"16px" }}>{now.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginBottom:"14px" }}>
            {[
              ["Company", user.company],
              ["Crew", user.crew || "—"],
              ["Week total", `${weekTotal.toFixed(1)} hrs`],
              ["OT this week", weekOT > 0 ? `${weekOT.toFixed(1)} hrs` : "—"],
            ].map(([l,v]) => (
              <div key={l} style={{ background:"#f5f5f3", borderRadius:"6px", padding:"8px 10px" }}>
                <div style={{ fontSize:"10px", color:"#888", marginBottom:"2px" }}>{l}</div>
                <div style={{ fontSize:"13px", fontWeight:"500" }}>{v}</div>
              </div>
            ))}
          </div>

          {!isClockedIn && <>
            <select value={selectedProject} onChange={e=>setSelectedProject(e.target.value)}
              style={{ width:"100%", fontSize:"13px", padding:"8px 10px", border:"0.5px solid #ddd", borderRadius:"6px", marginBottom:"8px" }}>
              <option value="">Select project...</option>
              {projects.map(p => <option key={p}>{p}</option>)}
            </select>
            <select value={selectedCode} onChange={e=>setSelectedCode(e.target.value)}
              style={{ width:"100%", fontSize:"13px", padding:"8px 10px", border:"0.5px solid #ddd", borderRadius:"6px", marginBottom:"14px" }}>
              <option value="">Select cost code...</option>
              {costCodes.map(c => <option key={c.code} value={c.code}>{c.code} — {c.type}: {c.description}</option>)}
            </select>
          </>}

          {isClockedIn && <div style={{ background:"#e8f0df", borderRadius:"8px", padding:"10px 12px", marginBottom:"14px", fontSize:"13px", color:"#2D5016" }}>
            <b>Clocked in at {todayEntry.clockIn}</b><br/>
            <span style={{ fontSize:"12px", opacity:"0.8" }}>{todayEntry.project} · {todayEntry.costCode}</span>
          </div>}

          {msg && <div style={{ background:"#e8f0df", borderRadius:"8px", padding:"8px 12px", marginBottom:"12px", fontSize:"13px", color:"#2D5016" }}>{msg}</div>}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
            <button onClick={handleClockIn} disabled={isClockedIn}
              style={{ padding:"11px", background: isClockedIn ? "#e0e0d8" : "#2D5016", color: isClockedIn ? "#aaa" : "#fff", border:"none", borderRadius:"8px", fontSize:"13px", fontWeight:"500", cursor: isClockedIn ? "not-allowed" : "pointer" }}>
              Clock In
            </button>
            <button onClick={handleClockOut} disabled={!isClockedIn}
              style={{ padding:"11px", background: !isClockedIn ? "#e0e0d8" : "#C45C1A", color: !isClockedIn ? "#aaa" : "#fff", border:"none", borderRadius:"8px", fontSize:"13px", fontWeight:"500", cursor: !isClockedIn ? "not-allowed" : "pointer" }}>
              Clock Out
            </button>
            <button onClick={() => setBreakActive(!breakActive)}
              style={{ gridColumn:"span 2", padding:"10px", background:"#f0f0ea", color:"#555", border:"none", borderRadius:"8px", fontSize:"13px", fontWeight:"500", cursor:"pointer" }}>
              {breakActive ? "End Break" : "Start Break"}
            </button>
          </div>
        </div>

        {/* Week history */}
        <div style={{ background:"#fff", borderRadius:"12px", border:"0.5px solid #e5e5e0", padding:"20px" }}>
          <div style={{ fontSize:"14px", fontWeight:"500", marginBottom:"12px" }}>My week — {formatDate(weekStart)} to {formatDate(weekEnd)}</div>
          {dayDates.map((dd, i) => {
            const dateStr = dd.toISOString().split("T")[0];
            const entry = weekEntries.find(e => e.date === dateStr);
            const isToday = dateStr === today;
            return (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"0.5px solid #f0f0ea" }}>
                <span style={{ color: isToday ? "#2D5016" : "#888", fontSize:"12px", fontWeight: isToday ? "600" : "400", minWidth:"80px" }}>
                  {days[i]} {dd.getMonth()+1}/{dd.getDate()}
                </span>
                {entry ? <>
                  <span style={{ fontSize:"12px", color:"#555" }}>{entry.clockIn} – {entry.clockOut || "..."}</span>
                  <span style={{ fontSize:"12px", fontWeight:"500", color: entry.totalHours > 10 ? "#C45C1A" : "inherit" }}>{entry.totalHours.toFixed(1)} hrs</span>
                </> : <span style={{ fontSize:"12px", color:"#ccc" }}>No entry</span>}
              </div>
            );
          })}
          <div style={{ marginTop:"12px", paddingTop:"10px", borderTop:"0.5px solid #eee", display:"flex", justifyContent:"space-between", fontSize:"13px" }}>
            <span style={{ color:"#888" }}>Week total</span>
            <span style={{ fontWeight:"500" }}>
              {weekTotal.toFixed(1)} hrs
              {weekOT > 0 && <span style={{ marginLeft:"8px", padding:"2px 7px", borderRadius:"20px", fontSize:"11px", background:"#fef3c7", color:"#92400e", fontWeight:"500" }}>{weekOT.toFixed(1)} OT</span>}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
