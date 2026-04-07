import { useState, useMemo } from "react";
import { useTimesheets, getWeekStart, getWeekEnd, formatDate } from "../lib/timesheets";
import { workers } from "../data/workers";

const COLORS = ["#2D5016","#C45C1A","#4a7c22","#e07520","#6aaa2a","#f09030","#3d6b1e","#d06818","#8bc34a","#ff8c42"];

function Bar({ label, value, max, color, suffix="" }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
        <span style={{ color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>{label}</span>
        <span style={{ fontWeight: "500", color: "#333" }}>{typeof value === "number" ? value.toLocaleString("en-US", { maximumFractionDigits: 1 }) : value}{suffix}</span>
      </div>
      <div style={{ height: "8px", background: "#f0f0ea", borderRadius: "4px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "4px", transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

function MiniDonut({ regular, ot }) {
  const total = regular + ot;
  const otPct = total > 0 ? (ot / total) * 100 : 0;
  const regPct = 100 - otPct;
  const r = 36, cx = 44, cy = 44, stroke = 12;
  const circ = 2 * Math.PI * r;
  const regDash = (regPct / 100) * circ;
  const otDash = (otPct / 100) * circ;
  return (
    <svg width="88" height="88" viewBox="0 0 88 88">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0f0ea" strokeWidth={stroke} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#2D5016" strokeWidth={stroke}
        strokeDasharray={`${regDash} ${circ}`} strokeDashoffset={circ * 0.25} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#C45C1A" strokeWidth={stroke}
        strokeDasharray={`${otDash} ${circ}`} strokeDashoffset={circ * 0.25 - regDash} strokeLinecap="round" />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="#333">{otPct.toFixed(1)}%</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="#888">OT</text>
    </svg>
  );
}

function LineChart({ data, color = "#2D5016" }) {
  if (!data || data.length < 2) return <div style={{ height: "80px", display: "flex", alignItems: "center", justifyContent: "center", color: "#bbb", fontSize: "12px" }}>Not enough data</div>;
  const max = Math.max(...data.map(d => d.value), 1);
  const min = 0;
  const W = 280, H = 80, pad = 8;
  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = H - pad - ((d.value - min) / (max - min)) * (H - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: "80px" }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => {
        const x = pad + (i / (data.length - 1)) * (W - pad * 2);
        const y = H - pad - ((d.value - min) / (max - min)) * (H - pad * 2);
        return <circle key={i} cx={x} cy={y} r="3" fill={color} />;
      })}
      {data.map((d, i) => {
        const x = pad + (i / (data.length - 1)) * (W - pad * 2);
        return <text key={i} x={x} y={H - 1} textAnchor="middle" fontSize="8" fill="#aaa">{d.label}</text>;
      })}
    </svg>
  );
}

export default function Analytics() {
  const { entries } = useTimesheets();
  const [period, setPeriod] = useState("4weeks");
  const [company, setCompany] = useState("all");

  const periodStart = useMemo(() => {
    const now = new Date();
    if (period === "week") return getWeekStart();
    if (period === "month") { const d = new Date(now.getFullYear(), now.getMonth(), 1); return d; }
    if (period === "4weeks") { const d = getWeekStart(); d.setDate(d.getDate() - 21); return d; }
    if (period === "quarter") { const d = new Date(now.getFullYear(), Math.floor(now.getMonth()/3)*3, 1); return d; }
    return getWeekStart();
  }, [period]);

  const filtered = useMemo(() => entries.filter(e => {
    const d = new Date(e.date);
    return d >= periodStart && (company === "all" || e.company === company);
  }), [entries, periodStart, company]);

  // KPIs
  const totalHrs = filtered.reduce((s,e) => s+e.totalHours, 0);
  const totalOT = filtered.reduce((s,e) => s+e.otHours, 0);
  const totalRegular = totalHrs - totalOT;
  const totalCost = filtered.reduce((s,e) => {
    const reg = Math.min(e.totalHours, 10);
    const ot = Math.max(0, e.totalHours - 10);
    const w = e.wage || 0;
    const ow = e.otWage || w * 1.5;
    return s + (reg * w) + (ot * ow);
  }, 0);
  const otCost = filtered.reduce((s,e) => {
    const ot = e.otHours || 0;
    const ow = e.otWage || (e.wage||0) * 1.5;
    return s + ot * ow;
  }, 0);
  const uniqueWorkers = new Set(filtered.map(e=>e.workerId)).size;

  // By project
  const byProject = useMemo(() => {
    const map = {};
    filtered.forEach(e => {
      if (!map[e.project]) map[e.project] = { hrs: 0, cost: 0, costTypes: {} };
      map[e.project].hrs += e.totalHours;
      const reg = Math.min(e.totalHours,10), ot = Math.max(0,e.totalHours-10);
      const w = e.wage||0, ow = e.otWage||w*1.5;
      map[e.project].cost += reg*w + ot*ow;
      if (e.costCode) {
        const type = e.costCode.split("-")[0];
        map[e.project].costTypes[type] = (map[e.project].costTypes[type]||0) + e.totalHours;
      }
    });
    return Object.entries(map).sort((a,b)=>b[1].hrs-a[1].hrs);
  }, [filtered]);

  // By crew
  const byCrew = useMemo(() => {
    const map = {};
    filtered.forEach(e => {
      if (!e.crew) return;
      if (!map[e.crew]) map[e.crew] = { hrs: 0, ot: 0, workers: new Set(), cost: 0 };
      map[e.crew].hrs += e.totalHours;
      map[e.crew].ot += e.otHours;
      map[e.crew].workers.add(e.workerId);
      const reg=Math.min(e.totalHours,10),ot=Math.max(0,e.totalHours-10),w=e.wage||0,ow=e.otWage||w*1.5;
      map[e.crew].cost += reg*w+ot*ow;
    });
    return Object.entries(map).sort((a,b)=>b[1].hrs-a[1].hrs);
  }, [filtered]);

  // Top workers
  const topWorkers = useMemo(() => {
    const map = {};
    filtered.forEach(e => {
      if (!map[e.workerId]) map[e.workerId] = { name: e.workerName, hrs: 0, ot: 0 };
      map[e.workerId].hrs += e.totalHours;
      map[e.workerId].ot += e.otHours;
    });
    return Object.values(map).sort((a,b)=>b.hrs-a.hrs).slice(0,8);
  }, [filtered]);

  // By cost code type
  const byCostType = useMemo(() => {
    const map = {};
    filtered.forEach(e => {
      if (!e.costCode) return;
      const parts = e.costCode.split("-");
      const type = parts.length > 1 ? `${parts[0]} - ${parts[1]?.split(".")[0]}` : e.costCode;
      map[type] = (map[type]||0) + e.totalHours;
    });
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,8);
  }, [filtered]);

  // Weekly trend (last 7 weeks)
  const weeklyTrend = useMemo(() => {
    const weeks = [];
    for (let i = 6; i >= 0; i--) {
      const ws = getWeekStart();
      ws.setDate(ws.getDate() - i*7);
      const we = getWeekEnd(ws);
      const hrs = entries.filter(e => {
        const d = new Date(e.date);
        return d >= ws && d <= we && (company==="all"||e.company===company);
      }).reduce((s,e)=>s+e.totalHours,0);
      weeks.push({ label: `W${7-i}`, value: hrs });
    }
    return weeks;
  }, [entries, company]);

  // Project × Cost Type table
  const projectCostTable = useMemo(() => {
    const map = {};
    filtered.forEach(e => {
      if (!e.project || !e.costCode) return;
      if (!map[e.project]) map[e.project] = {};
      const typeNum = e.costCode.split("-")[0];
      map[e.project][typeNum] = (map[e.project][typeNum]||0) + e.totalHours;
    });
    const allTypes = [...new Set(filtered.map(e=>e.costCode?.split("-")[0]).filter(Boolean))].sort((a,b)=>Number(a)-Number(b));
    return { rows: Object.entries(map).sort((a,b)=>Object.values(b[1]).reduce((s,v)=>s+v,0)-Object.values(a[1]).reduce((s,v)=>s+v,0)).slice(0,12), types: allTypes };
  }, [filtered]);

  const maxProjectHrs = byProject.length > 0 ? byProject[0][1].hrs : 1;
  const maxCrewHrs = byCrew.length > 0 ? byCrew[0][1].hrs : 1;
  const maxWorkerHrs = topWorkers.length > 0 ? topWorkers[0].hrs : 1;

  const kpiCards = [
    { label: "Total hours", value: totalHrs.toFixed(1), suffix: " hrs", color: "#2D5016" },
    { label: "Regular hours", value: totalRegular.toFixed(1), suffix: " hrs", color: "#3d6b1e" },
    { label: "OT hours", value: totalOT.toFixed(1), suffix: " hrs", color: "#C45C1A" },
    { label: "Labor cost", value: `$${totalCost.toLocaleString("en-US",{maximumFractionDigits:0})}`, suffix: "", color: "#2D5016" },
    { label: "OT cost", value: `$${otCost.toLocaleString("en-US",{maximumFractionDigits:0})}`, suffix: "", color: "#C45C1A" },
    { label: "Active workers", value: uniqueWorkers, suffix: "", color: "#2D5016" },
  ];

  const card = (children, style={}) => (
    <div style={{ background:"#fff", borderRadius:"12px", border:"0.5px solid #e5e5e0", overflow:"hidden", ...style }}>
      {children}
    </div>
  );

  const cardHead = (title, sub) => (
    <div style={{ padding:"11px 16px", borderBottom:"0.5px solid #eee", display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
      <div style={{ fontSize:"13px", fontWeight:"500" }}>{title}</div>
      {sub && <div style={{ fontSize:"11px", color:"#aaa" }}>{sub}</div>}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px", flexWrap:"wrap", gap:"10px" }}>
        <div style={{ fontSize:"18px", fontWeight:"500" }}>Analytics</div>
        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
          <select value={company} onChange={e=>setCompany(e.target.value)} style={{ fontSize:"12px", padding:"6px 10px", border:"0.5px solid #ddd", borderRadius:"8px", background:"#fff" }}>
            <option value="all">All companies</option>
            <option>Construction</option>
            <option>Landscape</option>
          </select>
          <div style={{ display:"flex", background:"#fff", border:"0.5px solid #ddd", borderRadius:"8px", overflow:"hidden" }}>
            {[["week","This week"],["month","This month"],["4weeks","Last 4 weeks"],["quarter","Quarter"]].map(([v,l])=>(
              <button key={v} onClick={()=>setPeriod(v)} style={{ padding:"6px 14px", fontSize:"12px", fontWeight:"500", cursor:"pointer", border:"none", background:period===v?"#2D5016":"transparent", color:period===v?"#fff":"#888" }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:"10px", marginBottom:"16px" }}>
        {kpiCards.map(k => (
          <div key={k.label} style={{ background:"#fff", borderRadius:"10px", padding:"12px 14px", border:"0.5px solid #e5e5e0" }}>
            <div style={{ fontSize:"11px", color:"#888", marginBottom:"4px" }}>{k.label}</div>
            <div style={{ fontSize:"20px", fontWeight:"600", color:k.color }}>{k.value}{k.suffix}</div>
          </div>
        ))}
      </div>

      {/* Row 1: OT donut + weekly trend + OT % */}
      <div style={{ display:"grid", gridTemplateColumns:"200px 1fr 200px", gap:"14px", marginBottom:"14px" }}>
        {card(<>
          {cardHead("OT breakdown")}
          <div style={{ padding:"16px", display:"flex", flexDirection:"column", alignItems:"center", gap:"10px" }}>
            <MiniDonut regular={totalRegular} ot={totalOT} />
            <div style={{ width:"100%" }}>
              {[["Regular",totalRegular,"#2D5016"],["OT",totalOT,"#C45C1A"]].map(([l,v,c])=>(
                <div key={l} style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", marginBottom:"4px" }}>
                  <span style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                    <span style={{ width:"8px", height:"8px", borderRadius:"50%", background:c, display:"inline-block" }} />
                    {l}
                  </span>
                  <span style={{ fontWeight:"500" }}>{v.toFixed(1)} hrs</span>
                </div>
              ))}
            </div>
          </div>
        </>)}

        {card(<>
          {cardHead("Hours trend", "Last 7 weeks")}
          <div style={{ padding:"12px 16px 8px" }}>
            <LineChart data={weeklyTrend} color="#2D5016" />
          </div>
        </>, { gridColumn:"span 1" })}

        {card(<>
          {cardHead("OT rate")}
          <div style={{ padding:"16px" }}>
            <div style={{ fontSize:"32px", fontWeight:"600", color:"#C45C1A", marginBottom:"4px" }}>
              {totalHrs > 0 ? ((totalOT/totalHrs)*100).toFixed(1) : 0}%
            </div>
            <div style={{ fontSize:"12px", color:"#888", marginBottom:"12px" }}>of total hours</div>
            <div style={{ fontSize:"12px", color:"#555" }}>OT cost share:</div>
            <div style={{ fontSize:"18px", fontWeight:"600", color:"#C45C1A" }}>
              {totalCost > 0 ? ((otCost/totalCost)*100).toFixed(1) : 0}%
            </div>
            <div style={{ fontSize:"11px", color:"#aaa" }}>of labor cost</div>
          </div>
        </>)}
      </div>

      {/* Row 2: Hours by project + by crew */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px", marginBottom:"14px" }}>
        {card(<>
          {cardHead("Hours by project", `${byProject.length} projects`)}
          <div style={{ padding:"14px 16px" }}>
            {byProject.slice(0,8).map(([proj, data], i) => (
              <Bar key={proj} label={proj} value={data.hrs} max={maxProjectHrs} color={COLORS[i%COLORS.length]} suffix=" hrs" />
            ))}
            {byProject.length === 0 && <div style={{ color:"#bbb", fontSize:"12px", textAlign:"center", padding:"20px 0" }}>No data for this period</div>}
          </div>
        </>)}

        {card(<>
          {cardHead("Productivity by crew")}
          <div style={{ padding:"14px 16px" }}>
            {byCrew.slice(0,8).map(([crew, data], i) => (
              <div key={crew} style={{ marginBottom:"10px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", marginBottom:"3px" }}>
                  <span style={{ color:"#555", fontWeight:"500" }}>{crew}</span>
                  <span style={{ color:"#888" }}>{data.workers.size} workers · <span style={{ color:"#C45C1A" }}>{data.ot.toFixed(1)} OT</span></span>
                </div>
                <div style={{ height:"8px", background:"#f0f0ea", borderRadius:"4px", overflow:"hidden", display:"flex" }}>
                  <div style={{ height:"100%", width:`${((data.hrs-data.ot)/maxCrewHrs)*100}%`, background:"#2D5016" }} />
                  <div style={{ height:"100%", width:`${(data.ot/maxCrewHrs)*100}%`, background:"#C45C1A" }} />
                </div>
                <div style={{ fontSize:"11px", color:"#888", marginTop:"2px" }}>{data.hrs.toFixed(1)} total hrs · ${data.cost.toLocaleString("en-US",{maximumFractionDigits:0})} labor cost</div>
              </div>
            ))}
          </div>
        </>)}
      </div>

      {/* Row 3: Top workers + cost by type */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px", marginBottom:"14px" }}>
        {card(<>
          {cardHead("Most active workers", "By total hours")}
          <div style={{ padding:"14px 16px" }}>
            {topWorkers.map((w,i) => (
              <Bar key={w.name} label={`${i+1}. ${w.name}`} value={w.hrs} max={maxWorkerHrs} color={i < 3 ? "#2D5016" : "#6aaa2a"} suffix=" hrs" />
            ))}
          </div>
        </>)}

        {card(<>
          {cardHead("Hours by cost type")}
          <div style={{ padding:"14px 16px" }}>
            {byCostType.map(([type, hrs], i) => (
              <Bar key={type} label={type} value={hrs} max={byCostType[0]?.[1]||1} color={COLORS[i%COLORS.length]} suffix=" hrs" />
            ))}
          </div>
        </>)}
      </div>

      {/* Row 4: Project × Cost Type table */}
      {card(<>
        {cardHead("Project × Cost type breakdown", "Hours per cost type by project")}
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"11px" }}>
            <thead>
              <tr style={{ background:"#fafaf8" }}>
                <th style={{ padding:"7px 12px", textAlign:"left", color:"#888", fontWeight:"500", borderBottom:"0.5px solid #eee", whiteSpace:"nowrap", minWidth:"160px" }}>Project</th>
                <th style={{ padding:"7px 10px", textAlign:"right", color:"#888", fontWeight:"500", borderBottom:"0.5px solid #eee" }}>Total hrs</th>
                {projectCostTable.types.map(t => (
                  <th key={t} style={{ padding:"7px 10px", textAlign:"right", color:"#888", fontWeight:"500", borderBottom:"0.5px solid #eee", whiteSpace:"nowrap" }}>{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projectCostTable.rows.map(([proj, types]) => {
                const total = Object.values(types).reduce((s,v)=>s+v,0);
                return (
                  <tr key={proj} style={{ borderBottom:"0.5px solid #f5f5f0" }}>
                    <td style={{ padding:"7px 12px", fontWeight:"500", color:"#333", maxWidth:"180px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{proj}</td>
                    <td style={{ padding:"7px 10px", textAlign:"right", fontWeight:"600", color:"#2D5016" }}>{total.toFixed(1)}</td>
                    {projectCostTable.types.map(t => (
                      <td key={t} style={{ padding:"7px 10px", textAlign:"right", color: types[t] ? "#555" : "#e0e0d8" }}>
                        {types[t] ? types[t].toFixed(1) : "—"}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>, { marginBottom:"14px" })}
    </div>
  );
}
