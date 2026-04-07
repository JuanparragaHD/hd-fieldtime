import { useState, useMemo } from "react";
import { useAuth } from "../lib/auth";
import { useTimesheets, getWeekStart, getWeekEnd, formatDate } from "../lib/timesheets";

const Badge = ({ status }) => {
  const map = { submitted:["#dbeafe","#1e40af","Submitted"], approved:["#e8f0df","#2D5016","Approved"], pending_crew:["#fef3c7","#92400e","Pending crew"] };
  const [bg, color, label] = map[status] || ["#f0f0ea","#666","Unknown"];
  return <span style={{ display:"inline-block", padding:"2px 8px", borderRadius:"20px", fontSize:"11px", fontWeight:"500", background:bg, color }}>{label}</span>;
};

export default function CrewManager() {
  const { user } = useAuth();
  const { entries, updateEntry, approveEntry, approveAll } = useTimesheets();
  const [weekOffset, setWeekOffset] = useState(0);
  const [editValues, setEditValues] = useState({});
  const [savedMsg, setSavedMsg] = useState("");

  const weekStart = useMemo(() => {
    const d = getWeekStart();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);
  const weekEnd = getWeekEnd(weekStart);

  const crewEntries = useMemo(() => {
    return entries.filter(e => {
      const d = new Date(e.date);
      return e.crew === user.crew && d >= weekStart && d <= weekEnd;
    });
  }, [entries, user.crew, weekStart, weekEnd]);

  // Group by worker
  const byWorker = useMemo(() => {
    const map = {};
    crewEntries.forEach(e => {
      if (!map[e.workerId]) map[e.workerId] = { name: e.workerName, entries: [], total: 0, ot: 0 };
      map[e.workerId].entries.push(e);
      map[e.workerId].total += e.totalHours;
      map[e.workerId].ot += e.otHours;
    });
    return Object.values(map);
  }, [crewEntries]);

  const pending = crewEntries.filter(e => e.status === "submitted");
  const pendingIds = pending.map(e => e.id);

  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const dayDates = days.map((d,i) => { const dd = new Date(weekStart); dd.setDate(dd.getDate()+i); return dd; });

  const getEdit = (entryId, field, fallback) => editValues[`${entryId}_${field}`] ?? fallback;
  const setEdit = (entryId, field, val) => setEditValues(prev => ({ ...prev, [`${entryId}_${field}`]: val }));

  const saveEntry = (e) => {
    const newClockIn = getEdit(e.id, "clockIn", e.clockIn);
    const newClockOut = getEdit(e.id, "clockOut", e.clockOut);
    const newBreak = getEdit(e.id, "break", e.breakMins);
    // Recalculate
    const parseT = (str) => {
      if (!str) return 0;
      const [time, ampm] = str.split(" ");
      let [h,m] = time.split(":").map(Number);
      if (ampm==="PM" && h!==12) h+=12;
      if (ampm==="AM" && h===12) h=0;
      return h*60+m;
    };
    const inM = parseT(newClockIn), outM = parseT(newClockOut);
    const totalH = Math.max(0, (outM - inM - Number(newBreak)) / 60);
    const otH = Math.max(0, totalH - 10);
    updateEntry(e.id, { clockIn: newClockIn, clockOut: newClockOut, breakMins: Number(newBreak), totalHours: parseFloat(totalH.toFixed(2)), otHours: parseFloat(otH.toFixed(2)) });
    setSavedMsg("Saved!");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"14px", flexWrap:"wrap", gap:"10px" }}>
        <div>
          <div style={{ fontSize:"18px", fontWeight:"500" }}>My Crew — {user.crew}</div>
          <div style={{ fontSize:"12px", color:"#888" }}>{formatDate(weekStart)} – {formatDate(weekEnd)}</div>
        </div>
        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"6px", background:"#fff", border:"0.5px solid #ddd", borderRadius:"8px", padding:"4px 10px" }}>
            <button onClick={() => setWeekOffset(w=>w-1)} style={{ background:"none", border:"none", cursor:"pointer", color:"#2D5016", fontSize:"16px" }}>←</button>
            <span style={{ fontSize:"13px", fontWeight:"500" }}>{formatDate(weekStart).replace(/, \d{4}/,"")} – {formatDate(weekEnd).replace(/, \d{4}/,"")}</span>
            <button onClick={() => setWeekOffset(w=>w+1)} style={{ background:"none", border:"none", cursor:"pointer", color:"#2D5016", fontSize:"16px" }}>→</button>
          </div>
          {pendingIds.length > 0 && <button onClick={() => approveAll(pendingIds)} style={{ padding:"7px 14px", background:"#2D5016", color:"#fff", border:"none", borderRadius:"8px", fontSize:"13px", cursor:"pointer", fontWeight:"500" }}>Approve all ({pendingIds.length})</button>}
        </div>
      </div>

      {savedMsg && <div style={{ background:"#e8f0df", borderRadius:"8px", padding:"8px 14px", marginBottom:"12px", fontSize:"13px", color:"#2D5016", fontWeight:"500" }}>{savedMsg}</div>}

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"10px", marginBottom:"14px" }}>
        {[
          ["Crew members", byWorker.length, "#2D5016"],
          ["Pending approval", pending.length, "#C45C1A"],
          ["Total hours", crewEntries.reduce((s,e)=>s+e.totalHours,0).toFixed(1), "#2D5016"],
        ].map(([l,v,c]) => (
          <div key={l} style={{ background:"#fff", borderRadius:"8px", padding:"11px 14px", border:"0.5px solid #e5e5e0" }}>
            <div style={{ fontSize:"11px", color:"#888", marginBottom:"3px" }}>{l}</div>
            <div style={{ fontSize:"22px", fontWeight:"500", color:c }}>{v}</div>
          </div>
        ))}
      </div>

      {byWorker.map(worker => (
        <div key={worker.name} style={{ background:"#fff", borderRadius:"12px", border:"0.5px solid #e5e5e0", overflow:"hidden", marginBottom:"14px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderBottom:"0.5px solid #eee", background:"#fafaf8" }}>
            <div>
              <div style={{ fontSize:"14px", fontWeight:"500" }}>{worker.name}</div>
              <div style={{ fontSize:"12px", color:"#888" }}>
                Total: <b>{worker.total.toFixed(1)} hrs</b>
                {worker.ot > 0 && <span style={{ marginLeft:"8px", padding:"1px 7px", borderRadius:"20px", fontSize:"11px", background:"#fef3c7", color:"#92400e" }}>{worker.ot.toFixed(1)} OT</span>}
              </div>
            </div>
            <div style={{ display:"flex", gap:"8px" }}>
              {worker.entries.some(e=>e.status==="submitted") && (
                <button onClick={() => approveAll(worker.entries.filter(e=>e.status==="submitted").map(e=>e.id))}
                  style={{ padding:"5px 12px", background:"#2D5016", color:"#fff", border:"none", borderRadius:"6px", fontSize:"12px", cursor:"pointer", fontWeight:"500" }}>
                  Approve all
                </button>
              )}
            </div>
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px" }}>
              <thead>
                <tr style={{ background:"#fafaf8" }}>
                  {["Date","Clock in","Clock out","Break (min)","Total hrs","OT","Project","Cost code","Status",""].map(h => (
                    <th key={h} style={{ padding:"6px 10px", textAlign:"left", color:"#888", fontWeight:"500", fontSize:"11px", borderBottom:"0.5px solid #eee", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {worker.entries.sort((a,b) => a.date.localeCompare(b.date)).map(e => (
                  <tr key={e.id} style={{ borderBottom:"0.5px solid #f0f0ea" }}>
                    <td style={{ padding:"7px 10px", color:"#666", whiteSpace:"nowrap" }}>{new Date(e.date).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</td>
                    <td style={{ padding:"7px 10px" }}>
                      <input value={getEdit(e.id,"clockIn",e.clockIn)} onChange={ev=>setEdit(e.id,"clockIn",ev.target.value)}
                        style={{ padding:"4px 7px", border:"0.5px solid #ddd", borderRadius:"6px", fontSize:"12px", width:"90px" }} />
                    </td>
                    <td style={{ padding:"7px 10px" }}>
                      <input value={getEdit(e.id,"clockOut",e.clockOut||"")} onChange={ev=>setEdit(e.id,"clockOut",ev.target.value)}
                        style={{ padding:"4px 7px", border:"0.5px solid #ddd", borderRadius:"6px", fontSize:"12px", width:"90px" }} />
                    </td>
                    <td style={{ padding:"7px 10px" }}>
                      <input value={getEdit(e.id,"break",e.breakMins)} onChange={ev=>setEdit(e.id,"break",ev.target.value)}
                        style={{ padding:"4px 7px", border:"0.5px solid #ddd", borderRadius:"6px", fontSize:"12px", width:"60px" }} />
                    </td>
                    <td style={{ padding:"7px 10px", fontWeight:"500" }}>{e.totalHours.toFixed(2)}</td>
                    <td style={{ padding:"7px 10px" }}>{e.otHours > 0 ? <span style={{padding:"2px 7px",borderRadius:"20px",fontSize:"11px",background:"#fef3c7",color:"#92400e"}}>{e.otHours.toFixed(2)}</span> : <span style={{color:"#ccc"}}>—</span>}</td>
                    <td style={{ padding:"7px 10px", maxWidth:"110px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.project}</td>
                    <td style={{ padding:"7px 10px", color:"#888" }}>{e.costCode}</td>
                    <td style={{ padding:"7px 10px" }}><Badge status={e.status} /></td>
                    <td style={{ padding:"7px 10px", display:"flex", gap:"6px" }}>
                      <button onClick={() => saveEntry(e)} style={{ padding:"3px 9px", background:"#f0f0ea", border:"0.5px solid #ddd", borderRadius:"6px", fontSize:"11px", cursor:"pointer" }}>Save</button>
                      {e.status === "submitted" && <button onClick={() => approveEntry(e.id)} style={{ padding:"3px 9px", background:"#2D5016", color:"#fff", border:"none", borderRadius:"6px", fontSize:"11px", cursor:"pointer" }}>Approve</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {byWorker.length === 0 && (
        <div style={{ background:"#fff", borderRadius:"12px", border:"0.5px solid #e5e5e0", padding:"40px", textAlign:"center", color:"#aaa", fontSize:"13px" }}>
          No entries for this week
        </div>
      )}
    </div>
  );
}
