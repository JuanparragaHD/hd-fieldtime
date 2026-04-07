import { useState, useMemo } from "react";
import { useTimesheets, getWeekStart, getWeekEnd, formatDate } from "../lib/timesheets";

const Badge = ({ status }) => {
  const map = {
    submitted: ["#dbeafe","#1e40af","Submitted"],
    approved: ["#e8f0df","#2D5016","Approved"],
    pending_crew: ["#fef3c7","#92400e","Pending crew"],
    clocked_in: ["#dcfce7","#15803d","Clocked in"],
  };
  const [bg, color, label] = map[status] || ["#f0f0ea","#666","Unknown"];
  return <span style={{ display:"inline-block", padding:"2px 8px", borderRadius:"20px", fontSize:"11px", fontWeight:"500", background:bg, color }}>{label}</span>;
};

const OTBadge = ({ hours }) => hours > 0
  ? <span style={{ display:"inline-block", padding:"2px 7px", borderRadius:"20px", fontSize:"11px", background:"#fef3c7", color:"#92400e", fontWeight:"500" }}>{hours.toFixed(2)} OT</span>
  : <span style={{ color:"#ccc" }}>—</span>;

export default function Timesheets() {
  const { entries, approveEntry, approveAll } = useTimesheets();
  const [company, setCompany] = useState("Construction");
  const [tab, setTab] = useState("daily");
  const [weekOffset, setWeekOffset] = useState(0);
  const [filterCrew, setFilterCrew] = useState("all");
  const [filterProject, setFilterProject] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const weekStart = useMemo(() => {
    const d = getWeekStart();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);
  const weekEnd = getWeekEnd(weekStart);

  const weekEntries = useMemo(() => entries.filter(e => {
    const d = new Date(e.date);
    return e.company === company && d >= weekStart && d <= weekEnd;
  }), [entries, company, weekStart, weekEnd]);

  const filtered = useMemo(() => weekEntries.filter(e =>
    (filterCrew === "all" || e.crew === filterCrew) &&
    (filterProject === "all" || e.project === filterProject) &&
    (filterStatus === "all" || e.status === filterStatus)
  ), [weekEntries, filterCrew, filterProject, filterStatus]);

  const crews = [...new Set(weekEntries.map(e => e.crew).filter(Boolean))].sort();
  const projectsList = [...new Set(weekEntries.map(e => e.project).filter(Boolean))].sort();

  // Weekly view: group by worker
  const weeklyByWorker = useMemo(() => {
    const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const map = {};
    weekEntries.forEach(e => {
      if (!map[e.workerId]) map[e.workerId] = { name: e.workerName, crew: e.crew, days: {}, total: 0, ot: 0, status: e.status };
      const d = new Date(e.date);
      const dayIdx = (d.getDay() + 6) % 7;
      map[e.workerId].days[days[dayIdx]] = e.totalHours;
      map[e.workerId].total += e.totalHours;
      map[e.workerId].ot += e.otHours;
      map[e.workerId].status = e.status;
      map[e.workerId].ids = [...(map[e.workerId].ids || []), e.id];
    });
    return Object.values(map);
  }, [weekEntries]);

  // Summary
  const summaryByProject = useMemo(() => {
    const map = {};
    weekEntries.forEach(e => { map[e.project] = (map[e.project] || 0) + e.totalHours; });
    return Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0,8);
  }, [weekEntries]);
  const summaryByCrew = useMemo(() => {
    const map = {};
    weekEntries.forEach(e => { if(e.crew) map[e.crew] = (map[e.crew] || 0) + e.totalHours; });
    return Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0,8);
  }, [weekEntries]);
  const summaryByCode = useMemo(() => {
    const map = {};
    weekEntries.forEach(e => { if(e.costCode) map[e.costCode] = (map[e.costCode] || 0) + e.totalHours; });
    return Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0,8);
  }, [weekEntries]);

  const totalHrs = weekEntries.reduce((s,e) => s + e.totalHours, 0);
  const totalOT = weekEntries.reduce((s,e) => s + e.otHours, 0);
  const pending = weekEntries.filter(e => e.status === "submitted").length;
  const approved = weekEntries.filter(e => e.status === "approved").length;

  const pendingIds = filtered.filter(e => e.status === "submitted").map(e => e.id);

  // Excel export (same format as Lumber)
  const exportExcel = () => {
    const headers = ["Name","Crew","Employee ID","Date","First Clock In","Final Clock Out","Total Hours","Total Paid Hours","Total Break","Break","Equipment","Run Time","Equipment Shared","Travel","Per Diem","Lodging","Injury","Status","Signature","Project Name","Department Name","Task","Cost Code","Cost Type"];
    const rows = weekEntries.map(e => [
      e.workerName, e.crew, "", e.date, e.clockIn, e.clockOut,
      e.totalHours.toFixed(2), e.totalHours.toFixed(2), "1:00", "1:00",
      "","","","No","FALSE","FALSE","No",
      e.status === "approved" ? "Paid" : "Pending",
      e.status === "approved" ? "Yes" : "No",
      e.project, "", "", e.costCode, ""
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `HD_Timesheet_${company}_${weekStart.toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const tabStyle = (t) => ({
    padding:"9px 18px", fontSize:"13px", fontWeight:"500", cursor:"pointer",
    color: tab===t ? "#2D5016" : "#888",
    borderBottom: tab===t ? "2px solid #2D5016" : "2px solid transparent",
    background:"none", border:"none", borderBottom: tab===t ? "2px solid #2D5016" : "2px solid transparent",
  });

  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"14px", flexWrap:"wrap", gap:"10px" }}>
        <div>
          <div style={{ fontSize:"18px", fontWeight:"500" }}>Timesheets</div>
          <div style={{ fontSize:"12px", color:"#888" }}>{formatDate(weekStart)} – {formatDate(weekEnd)}</div>
        </div>
        <div style={{ display:"flex", gap:"8px", alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"6px", background:"#fff", border:"0.5px solid #ddd", borderRadius:"8px", padding:"4px 10px" }}>
            <button onClick={() => setWeekOffset(w=>w-1)} style={{ background:"none", border:"none", cursor:"pointer", color:"#2D5016", fontSize:"16px", padding:"0 4px" }}>←</button>
            <span style={{ fontSize:"13px", fontWeight:"500", minWidth:"130px", textAlign:"center" }}>{formatDate(weekStart).replace(/, \d{4}/,"")} – {formatDate(weekEnd).replace(/, \d{4}/,"")}</span>
            <button onClick={() => setWeekOffset(w=>w+1)} style={{ background:"none", border:"none", cursor:"pointer", color:"#2D5016", fontSize:"16px", padding:"0 4px" }}>→</button>
          </div>
          <button onClick={exportExcel} style={{ padding:"7px 14px", background:"#fff", border:"0.5px solid #ddd", borderRadius:"8px", fontSize:"13px", cursor:"pointer", fontWeight:"500" }}>Export Excel</button>
          {pendingIds.length > 0 && <button onClick={() => approveAll(pendingIds)} style={{ padding:"7px 14px", background:"#2D5016", color:"#fff", border:"none", borderRadius:"8px", fontSize:"13px", cursor:"pointer", fontWeight:"500" }}>Approve all ({pendingIds.length})</button>}
        </div>
      </div>

      {/* Company toggle */}
      <div style={{ display:"flex", background:"#fff", border:"0.5px solid #ddd", borderRadius:"8px", overflow:"hidden", width:"fit-content", marginBottom:"14px" }}>
        {["Construction","Landscape"].map(c => (
          <button key={c} onClick={() => setCompany(c)} style={{
            padding:"7px 22px", fontSize:"13px", fontWeight:"500", cursor:"pointer", border:"none",
            background: company===c ? (c==="Construction" ? "#C45C1A" : "#2D5016") : "transparent",
            color: company===c ? "#fff" : "#888"
          }}>{c}</button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"10px", marginBottom:"14px" }}>
        {[
          ["Workers this week", weekEntries.length, "#2D5016"],
          ["Pending approval", pending, "#C45C1A"],
          ["Approved", approved, "#2D5016"],
          ["OT hours", totalOT.toFixed(1), "#C45C1A"],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background:"#fff", borderRadius:"8px", padding:"11px 14px", border:"0.5px solid #e5e5e0" }}>
            <div style={{ fontSize:"11px", color:"#888", marginBottom:"3px" }}>{label}</div>
            <div style={{ fontSize:"22px", fontWeight:"500", color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Main card */}
      <div style={{ background:"#fff", borderRadius:"12px", border:"0.5px solid #e5e5e0", overflow:"hidden" }}>
        <div style={{ display:"flex", borderBottom:"0.5px solid #eee" }}>
          {["daily","weekly","summary"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={tabStyle(t)}>
              {t.charAt(0).toUpperCase()+t.slice(1)} view
            </button>
          ))}
        </div>

        {/* DAILY */}
        {tab === "daily" && <>
          <div style={{ display:"flex", gap:"8px", padding:"10px 16px", borderBottom:"0.5px solid #eee", flexWrap:"wrap" }}>
            <select value={filterCrew} onChange={e=>setFilterCrew(e.target.value)} style={{ fontSize:"12px", padding:"5px 8px", border:"0.5px solid #ddd", borderRadius:"6px" }}>
              <option value="all">All crews</option>
              {crews.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={filterProject} onChange={e=>setFilterProject(e.target.value)} style={{ fontSize:"12px", padding:"5px 8px", border:"0.5px solid #ddd", borderRadius:"6px" }}>
              <option value="all">All projects</option>
              {projectsList.map(p => <option key={p}>{p}</option>)}
            </select>
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{ fontSize:"12px", padding:"5px 8px", border:"0.5px solid #ddd", borderRadius:"6px" }}>
              <option value="all">All statuses</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="pending_crew">Pending crew</option>
            </select>
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px" }}>
              <thead>
                <tr style={{ background:"#fafaf8" }}>
                  {["Name","Crew","Date","Clock in","Clock out","Break","Total hrs","OT hrs","Project","Cost code","Status",""].map(h => (
                    <th key={h} style={{ padding:"7px 10px", textAlign:"left", color:"#888", fontWeight:"500", fontSize:"11px", borderBottom:"0.5px solid #eee", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={12} style={{ padding:"20px", textAlign:"center", color:"#aaa", fontSize:"13px" }}>No entries for this week</td></tr>}
                {filtered.map(e => (
                  <tr key={e.id} style={{ borderBottom:"0.5px solid #f0f0ea" }}>
                    <td style={{ padding:"8px 10px", fontWeight:"500", whiteSpace:"nowrap" }}>{e.workerName}</td>
                    <td style={{ padding:"8px 10px", color:"#666", whiteSpace:"nowrap" }}>{e.crew}</td>
                    <td style={{ padding:"8px 10px", color:"#666", whiteSpace:"nowrap" }}>{new Date(e.date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</td>
                    <td style={{ padding:"8px 10px", whiteSpace:"nowrap" }}>{e.clockIn}</td>
                    <td style={{ padding:"8px 10px", whiteSpace:"nowrap" }}>{e.clockOut || <span style={{color:"#aaa"}}>—</span>}</td>
                    <td style={{ padding:"8px 10px", color:"#666" }}>1:00</td>
                    <td style={{ padding:"8px 10px", fontWeight:"500" }}>{e.totalHours.toFixed(2)}</td>
                    <td style={{ padding:"8px 10px" }}><OTBadge hours={e.otHours} /></td>
                    <td style={{ padding:"8px 10px", maxWidth:"130px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.project}</td>
                    <td style={{ padding:"8px 10px", color:"#888", whiteSpace:"nowrap" }}>{e.costCode}</td>
                    <td style={{ padding:"8px 10px", whiteSpace:"nowrap" }}><Badge status={e.status} /></td>
                    <td style={{ padding:"8px 10px" }}>
                      {e.status === "submitted" && <button onClick={() => approveEntry(e.id)} style={{ padding:"3px 9px", background:"#2D5016", color:"#fff", border:"none", borderRadius:"6px", fontSize:"11px", cursor:"pointer", fontWeight:"500" }}>Approve</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding:"9px 16px", fontSize:"12px", color:"#888" }}>Showing {filtered.length} entries · Total: <b>{totalHrs.toFixed(1)} hrs</b></div>
        </>}

        {/* WEEKLY */}
        {tab === "weekly" && <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px" }}>
            <thead>
              <tr style={{ background:"#fafaf8" }}>
                <th style={{ padding:"7px 10px", textAlign:"left", color:"#888", fontWeight:"500", fontSize:"11px", borderBottom:"0.5px solid #eee" }}>Name</th>
                <th style={{ padding:"7px 10px", textAlign:"left", color:"#888", fontWeight:"500", fontSize:"11px", borderBottom:"0.5px solid #eee" }}>Crew</th>
                {days.map((d,i) => {
                  const dd = new Date(weekStart); dd.setDate(dd.getDate()+i);
                  return <th key={d} style={{ padding:"7px 8px", textAlign:"center", color:"#888", fontWeight:"500", fontSize:"11px", borderBottom:"0.5px solid #eee", whiteSpace:"nowrap" }}>
                    {d}<br/><span style={{ fontWeight:"400", color:"#bbb" }}>{dd.getMonth()+1}/{dd.getDate()}</span>
                  </th>;
                })}
                <th style={{ padding:"7px 10px", textAlign:"left", color:"#888", fontWeight:"500", fontSize:"11px", borderBottom:"0.5px solid #eee" }}>Total</th>
                <th style={{ padding:"7px 10px", textAlign:"left", color:"#888", fontWeight:"500", fontSize:"11px", borderBottom:"0.5px solid #eee" }}>OT</th>
                <th style={{ padding:"7px 10px", textAlign:"left", color:"#888", fontWeight:"500", fontSize:"11px", borderBottom:"0.5px solid #eee" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {weeklyByWorker.map((w,i) => (
                <tr key={i} style={{ borderBottom:"0.5px solid #f0f0ea" }}>
                  <td style={{ padding:"8px 10px", fontWeight:"500", whiteSpace:"nowrap" }}>{w.name}</td>
                  <td style={{ padding:"8px 10px", color:"#666" }}>{w.crew}</td>
                  {days.map(d => (
                    <td key={d} style={{ padding:"8px 8px", textAlign:"center", color: w.days[d] > 10 ? "#C45C1A" : "inherit", fontWeight: w.days[d] > 10 ? "500" : "400" }}>
                      {w.days[d] ? w.days[d].toFixed(1) : <span style={{color:"#ddd"}}>—</span>}
                    </td>
                  ))}
                  <td style={{ padding:"8px 10px", fontWeight:"600" }}>{w.total.toFixed(1)}</td>
                  <td style={{ padding:"8px 10px" }}><OTBadge hours={w.ot} /></td>
                  <td style={{ padding:"8px 10px" }}><Badge status={w.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}

        {/* SUMMARY */}
        {tab === "summary" && <div>
          <div style={{ padding:"12px 16px", fontSize:"12px", color:"#888", borderBottom:"0.5px solid #eee" }}>
            {company} · {formatDate(weekStart)} – {formatDate(weekEnd)} · Total: <b style={{color:"#2D5016"}}>{totalHrs.toFixed(1)} hrs</b> · OT: <b style={{color:"#C45C1A"}}>{totalOT.toFixed(1)} hrs</b>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"14px", padding:"14px 16px" }}>
            {[
              ["By Project", summaryByProject],
              ["By Crew", summaryByCrew],
              ["By Cost Code", summaryByCode],
            ].map(([title, data]) => (
              <div key={title} style={{ border:"0.5px solid #eee", borderRadius:"8px", overflow:"hidden" }}>
                <div style={{ padding:"8px 12px", background:"#e8f0df", fontSize:"12px", fontWeight:"500", color:"#2D5016" }}>{title}</div>
                {data.map(([label, hrs]) => (
                  <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"7px 12px", borderBottom:"0.5px solid #f5f5f0", fontSize:"12px" }}>
                    <span style={{ color:"#666", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"65%" }}>{label}</span>
                    <span style={{ fontWeight:"500" }}>{hrs.toFixed(1)} hrs</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>}
      </div>
    </div>
  );
}
