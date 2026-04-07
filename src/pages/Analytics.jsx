import { useState, useMemo } from "react";
import { useTimesheets, getWeekStart, getWeekEnd, formatDate } from "../lib/timesheets";

// HD brand colors — consistent 2-color palette
const GREEN = "#2D5016";
const ORANGE = "#C45C1A";
const GREEN_LIGHT = "#e8f0df";
const GREEN_MID = "#4a7c22";

function DateRangePicker({ startDate, endDate, onChange }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"6px", background:"#fff", border:"0.5px solid #ddd", borderRadius:"8px", padding:"4px 10px" }}>
      <span style={{ fontSize:"11px", color:"#888" }}>From</span>
      <input type="date" value={startDate} onChange={e => onChange(e.target.value, endDate)}
        style={{ border:"none", fontSize:"12px", outline:"none", background:"transparent", color:"#333" }} />
      <span style={{ fontSize:"11px", color:"#888" }}>To</span>
      <input type="date" value={endDate} onChange={e => onChange(startDate, e.target.value)}
        style={{ border:"none", fontSize:"12px", outline:"none", background:"transparent", color:"#333" }} />
    </div>
  );
}

// Horizontal bar with value label
function HBar({ label, value, max, color, suffix = " hrs", subLabel }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", marginBottom:"3px" }}>
        <span style={{ color:"#555", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"58%" }}>{label}</span>
        <span style={{ fontWeight:"600", color:"#333" }}>{typeof value === "number" ? value.toFixed(2) : value}{suffix}</span>
      </div>
      <div style={{ height:"9px", background:"#f0f0ea", borderRadius:"5px", overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:"5px" }} />
      </div>
      {subLabel && <div style={{ fontSize:"10px", color:"#aaa", marginTop:"2px" }}>{subLabel}</div>}
    </div>
  );
}

// Vertical bar chart with value on top
function BarChart({ data, color = GREEN, height = 120 }) {
  if (!data || data.length === 0) return <div style={{ height, display:"flex", alignItems:"center", justifyContent:"center", color:"#bbb", fontSize:"12px" }}>No data</div>;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:"6px", height: height + 32, paddingTop:"20px" }}>
      {data.map((d, i) => {
        const barH = Math.max(2, (d.value / max) * height);
        return (
          <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"3px" }}>
            <span style={{ fontSize:"10px", fontWeight:"600", color:"#444", whiteSpace:"nowrap" }}>
              {d.value > 0 ? d.value.toFixed(1) : ""}
            </span>
            <div style={{ width:"100%", height:`${barH}px`, background:color, borderRadius:"4px 4px 0 0", minHeight:"2px" }} />
            <span style={{ fontSize:"10px", color:"#888", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:"100%", textAlign:"center" }}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// Stacked bar (regular + OT)
function StackedBarChart({ data, height = 120 }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => (d.regular || 0) + (d.ot || 0)), 1);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:"6px", height: height + 32, paddingTop:"20px" }}>
      {data.map((d, i) => {
        const total = (d.regular || 0) + (d.ot || 0);
        const totalH = Math.max(2, (total / max) * height);
        const otH = total > 0 ? (d.ot / total) * totalH : 0;
        const regH = totalH - otH;
        return (
          <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"3px" }}>
            <span style={{ fontSize:"10px", fontWeight:"600", color:"#444" }}>{total > 0 ? total.toFixed(1) : ""}</span>
            <div style={{ width:"100%", display:"flex", flexDirection:"column", borderRadius:"4px 4px 0 0", overflow:"hidden" }}>
              {otH > 0 && <div style={{ height:`${otH}px`, background:ORANGE }} />}
              {regH > 0 && <div style={{ height:`${regH}px`, background:GREEN }} />}
            </div>
            <span style={{ fontSize:"10px", color:"#888", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:"100%", textAlign:"center" }}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Analytics() {
  const { entries } = useTimesheets();
  const [company, setCompany] = useState("all");
  const [dateMode, setDateMode] = useState("4weeks");
  const [rangeStart, setRangeStart] = useState(() => { const d = getWeekStart(); d.setDate(d.getDate()-21); return d.toISOString().split("T")[0]; });
  const [rangeEnd, setRangeEnd] = useState(() => getWeekEnd(getWeekStart()).toISOString().split("T")[0]);

  const periodStart = useMemo(() => {
    if (dateMode === "range") return new Date(rangeStart + "T00:00:00");
    const now = new Date();
    if (dateMode === "week") return getWeekStart();
    if (dateMode === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
    if (dateMode === "4weeks") { const d = getWeekStart(); d.setDate(d.getDate()-21); return d; }
    if (dateMode === "quarter") return new Date(now.getFullYear(), Math.floor(now.getMonth()/3)*3, 1);
    return getWeekStart();
  }, [dateMode, rangeStart]);

  const periodEnd = useMemo(() => {
    if (dateMode === "range") return new Date(rangeEnd + "T23:59:59");
    return getWeekEnd(getWeekStart());
  }, [dateMode, rangeEnd]);

  const filtered = useMemo(() => entries.filter(e => {
    const d = new Date(e.date);
    return d >= periodStart && d <= periodEnd && (company === "all" || e.company === company);
  }), [entries, periodStart, periodEnd, company]);

  // KPIs
  const totalHrs = filtered.reduce((s,e) => s+e.totalHours, 0);
  const totalOT = filtered.reduce((s,e) => s+e.otHours, 0);
  const totalCost = filtered.reduce((s,e) => {
    const reg = Math.min(e.totalHours,10), ot = Math.max(0,e.totalHours-10);
    const w = e.wage||0, ow = e.otWage||w*1.5;
    return s + reg*w + ot*ow;
  }, 0);
  const otCost = filtered.reduce((s,e) => {
    return s + e.otHours * (e.otWage || (e.wage||0)*1.5);
  }, 0);
  const uniqueWorkers = new Set(filtered.map(e=>e.workerId)).size;
  const activeProjects = new Set(filtered.map(e=>e.project).filter(Boolean)).size;

  // By project
  const byProject = useMemo(() => {
    const map = {};
    filtered.forEach(e => { if(e.project) map[e.project] = (map[e.project]||0)+e.totalHours; });
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,10);
  }, [filtered]);

  // By crew with stacked OT
  const byCrew = useMemo(() => {
    const map = {};
    filtered.forEach(e => {
      if(!e.crew) return;
      if(!map[e.crew]) map[e.crew] = { regular:0, ot:0, workers:new Set(), cost:0 };
      map[e.crew].regular += Math.min(e.totalHours,10);
      map[e.crew].ot += e.otHours;
      map[e.crew].workers.add(e.workerId);
      const reg=Math.min(e.totalHours,10),ot=e.otHours,w=e.wage||0,ow=e.otWage||w*1.5;
      map[e.crew].cost += reg*w+ot*ow;
    });
    return Object.entries(map).sort((a,b)=>(b[1].regular+b[1].ot)-(a[1].regular+a[1].ot));
  }, [filtered]);

  // Top workers
  const topWorkers = useMemo(() => {
    const map = {};
    filtered.forEach(e => {
      if(!map[e.workerId]) map[e.workerId] = { name:e.workerName, hrs:0, ot:0 };
      map[e.workerId].hrs += e.totalHours;
      map[e.workerId].ot += e.otHours;
    });
    return Object.values(map).sort((a,b)=>b.hrs-a.hrs).slice(0,8);
  }, [filtered]);

  // Weekly trend — bar chart
  const weeklyTrend = useMemo(() => {
    const weeks = [];
    for (let i = 6; i >= 0; i--) {
      const ws = getWeekStart(); ws.setDate(ws.getDate()-i*7);
      const we = getWeekEnd(ws);
      const hrs = entries.filter(e => { const d=new Date(e.date); return d>=ws&&d<=we&&(company==="all"||e.company===company); }).reduce((s,e)=>s+e.totalHours,0);
      const ot = entries.filter(e => { const d=new Date(e.date); return d>=ws&&d<=we&&(company==="all"||e.company===company); }).reduce((s,e)=>s+e.otHours,0);
      weeks.push({ label:`W${7-i}`, value:hrs, regular:hrs-ot, ot });
    }
    return weeks;
  }, [entries, company]);

  // By cost type
  const byCostType = useMemo(() => {
    const map = {};
    filtered.forEach(e => {
      if(!e.costCode) return;
      const parts = e.costCode.split("-");
      const type = parts.length > 1 ? `${parts[0]}-${parts[1]?.split(".")[0]}` : e.costCode;
      map[type] = (map[type]||0)+e.totalHours;
    });
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,8);
  }, [filtered]);

  // Project × Cost type table
  const projectCostTable = useMemo(() => {
    const map = {};
    filtered.forEach(e => {
      if(!e.project||!e.costCode) return;
      if(!map[e.project]) map[e.project] = {};
      const t = e.costCode.split("-")[0];
      map[e.project][t] = (map[e.project][t]||0)+e.totalHours;
    });
    const allTypes = [...new Set(filtered.map(e=>e.costCode?.split("-")[0]).filter(Boolean))].sort((a,b)=>Number(a)-Number(b));
    return {
      rows: Object.entries(map).sort((a,b)=>Object.values(b[1]).reduce((s,v)=>s+v,0)-Object.values(a[1]).reduce((s,v)=>s+v,0)).slice(0,12),
      types: allTypes
    };
  }, [filtered]);

  const maxProjectHrs = byProject.length > 0 ? byProject[0][1] : 1;
  const maxWorkerHrs = topWorkers.length > 0 ? topWorkers[0].hrs : 1;
  const maxCostHrs = byCostType.length > 0 ? byCostType[0][1] : 1;

  const card = (children, extra={}) => (
    <div style={{ background:"#fff", borderRadius:"12px", border:"0.5px solid #e5e5e0", overflow:"hidden", ...extra }}>{children}</div>
  );
  const head = (title, sub) => (
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
        <div style={{ display:"flex", gap:"8px", alignItems:"center", flexWrap:"wrap" }}>
          <select value={company} onChange={e=>setCompany(e.target.value)} style={{ fontSize:"12px", padding:"6px 10px", border:"0.5px solid #ddd", borderRadius:"8px", background:"#fff" }}>
            <option value="all">All companies</option>
            <option>Construction</option>
            <option>Landscape</option>
          </select>
          {/* Period selector */}
          <div style={{ display:"flex", background:"#fff", border:"0.5px solid #ddd", borderRadius:"8px", overflow:"hidden" }}>
            {[["week","Week"],["month","Month"],["4weeks","4 weeks"],["quarter","Quarter"],["range","Custom"]].map(([v,l])=>(
              <button key={v} onClick={()=>setDateMode(v)} style={{ padding:"6px 12px", fontSize:"12px", fontWeight:"500", cursor:"pointer", border:"none", background:dateMode===v?GREEN:"transparent", color:dateMode===v?"#fff":"#888" }}>{l}</button>
            ))}
          </div>
          {dateMode === "range" && <DateRangePicker startDate={rangeStart} endDate={rangeEnd} onChange={(s,e)=>{setRangeStart(s);setRangeEnd(e);}} />}
        </div>
      </div>

      {/* KPI Cards — 6 cards, no "Regular hours" */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:"10px", marginBottom:"16px" }}>
        {[
          ["Total hours", totalHrs.toFixed(2)+" hrs", GREEN],
          ["OT hours", totalOT.toFixed(2)+" hrs", ORANGE],
          ["OT cost", `$${otCost.toLocaleString("en-US",{maximumFractionDigits:0})}`, ORANGE],
          ["Labor cost", `$${totalCost.toLocaleString("en-US",{maximumFractionDigits:0})}`, GREEN],
          ["Active projects", activeProjects, GREEN],
          ["Active workers", uniqueWorkers, GREEN_MID],
        ].map(([label,val,color])=>(
          <div key={label} style={{ background:"#fff", borderRadius:"10px", padding:"12px 14px", border:"0.5px solid #e5e5e0" }}>
            <div style={{ fontSize:"11px", color:"#888", marginBottom:"4px" }}>{label}</div>
            <div style={{ fontSize:"18px", fontWeight:"600", color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Row 1: Weekly trend (bar) + OT breakdown */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:"14px", marginBottom:"14px" }}>
        {card(<>
          {head("Weekly hours trend", "Regular vs OT")}
          <div style={{ padding:"12px 16px 4px" }}>
            <StackedBarChart data={weeklyTrend} height={100} />
            <div style={{ display:"flex", gap:"16px", justifyContent:"flex-end", marginTop:"4px" }}>
              {[["Regular",GREEN],["OT",ORANGE]].map(([l,c])=>(
                <span key={l} style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"11px", color:"#666" }}>
                  <span style={{ width:"10px", height:"10px", borderRadius:"2px", background:c, display:"inline-block" }} />{l}
                </span>
              ))}
            </div>
          </div>
        </>)}

        {card(<>
          {head("OT rate")}
          <div style={{ padding:"16px" }}>
            <div style={{ fontSize:"36px", fontWeight:"700", color:ORANGE, marginBottom:"2px" }}>
              {totalHrs > 0 ? ((totalOT/totalHrs)*100).toFixed(1) : "0.0"}%
            </div>
            <div style={{ fontSize:"12px", color:"#888", marginBottom:"14px" }}>of total hours is OT</div>
            <div style={{ height:"10px", background:"#f0f0ea", borderRadius:"5px", overflow:"hidden", marginBottom:"10px" }}>
              <div style={{ height:"100%", width:`${totalHrs>0?(totalOT/totalHrs)*100:0}%`, background:ORANGE, borderRadius:"5px" }} />
            </div>
            <div style={{ fontSize:"12px", color:"#555" }}>OT cost share</div>
            <div style={{ fontSize:"22px", fontWeight:"600", color:ORANGE }}>
              {totalCost > 0 ? ((otCost/totalCost)*100).toFixed(1) : "0.0"}%
            </div>
            <div style={{ fontSize:"11px", color:"#aaa" }}>of total labor cost</div>
          </div>
        </>)}
      </div>

      {/* Row 2: Hours by project + by crew */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px", marginBottom:"14px" }}>
        {card(<>
          {head("Hours by project", `${byProject.length} projects`)}
          <div style={{ padding:"14px 16px" }}>
            {byProject.slice(0,8).map(([proj,hrs])=>(
              <HBar key={proj} label={proj} value={hrs} max={maxProjectHrs} color={GREEN} />
            ))}
            {byProject.length === 0 && <div style={{ color:"#bbb", fontSize:"12px", textAlign:"center", padding:"20px 0" }}>No data for this period</div>}
          </div>
        </>)}

        {card(<>
          {head("Hours by crew", "Regular + OT stacked")}
          <div style={{ padding:"12px 16px 4px" }}>
            <BarChart
              data={byCrew.slice(0,8).map(([crew,d])=>({ label:crew, value:d.regular+d.ot }))}
              color={GREEN}
              height={110}
            />
          </div>
          {byCrew.length > 0 && <div style={{ padding:"0 16px 12px" }}>
            {byCrew.slice(0,5).map(([crew,d])=>(
              <div key={crew} style={{ display:"flex", justifyContent:"space-between", fontSize:"11px", color:"#666", padding:"3px 0", borderBottom:"0.5px solid #f5f5f0" }}>
                <span style={{ fontWeight:"500" }}>{crew}</span>
                <span>{d.workers.size} workers · <span style={{color:ORANGE}}>{d.ot.toFixed(2)} OT</span> · <span style={{color:"#888"}}>${d.cost.toLocaleString("en-US",{maximumFractionDigits:0})}</span></span>
              </div>
            ))}
          </div>}
        </>)}
      </div>

      {/* Row 3: Top workers + cost type */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px", marginBottom:"14px" }}>
        {card(<>
          {head("Most active workers", "By total hours")}
          <div style={{ padding:"14px 16px" }}>
            {topWorkers.map((w,i)=>(
              <HBar key={w.name} label={`${i+1}. ${w.name}`} value={w.hrs} max={maxWorkerHrs} color={GREEN}
                subLabel={w.ot > 0 ? `${w.ot.toFixed(2)} OT hrs` : undefined} />
            ))}
          </div>
        </>)}

        {card(<>
          {head("Hours by cost type")}
          <div style={{ padding:"14px 16px" }}>
            {byCostType.map(([type,hrs])=>(
              <HBar key={type} label={type} value={hrs} max={maxCostHrs} color={GREEN} />
            ))}
          </div>
        </>)}
      </div>

      {/* Project × Cost type table */}
      {card(<>
        {head("Project × Cost type breakdown", "Hours per cost type by project")}
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"11px" }}>
            <thead>
              <tr style={{ background:"#fafaf8" }}>
                <th style={{ padding:"7px 12px", textAlign:"left", color:"#888", fontWeight:"500", borderBottom:"0.5px solid #eee", whiteSpace:"nowrap", minWidth:"160px" }}>Project</th>
                <th style={{ padding:"7px 10px", textAlign:"right", color:"#888", fontWeight:"500", borderBottom:"0.5px solid #eee" }}>Total hrs</th>
                {projectCostTable.types.map(t=>(
                  <th key={t} style={{ padding:"7px 10px", textAlign:"right", color:"#888", fontWeight:"500", borderBottom:"0.5px solid #eee", whiteSpace:"nowrap" }}>{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projectCostTable.rows.map(([proj,types])=>{
                const total = Object.values(types).reduce((s,v)=>s+v,0);
                return (
                  <tr key={proj} style={{ borderBottom:"0.5px solid #f5f5f0" }}>
                    <td style={{ padding:"7px 12px", fontWeight:"500", color:"#333", maxWidth:"180px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{proj}</td>
                    <td style={{ padding:"7px 10px", textAlign:"right", fontWeight:"600", color:GREEN }}>{total.toFixed(2)}</td>
                    {projectCostTable.types.map(t=>(
                      <td key={t} style={{ padding:"7px 10px", textAlign:"right", color:types[t]?"#555":"#e0e0d8" }}>
                        {types[t] ? types[t].toFixed(2) : "—"}
                      </td>
                    ))}
                  </tr>
                );
              })}
              {projectCostTable.rows.length === 0 && <tr><td colSpan={99} style={{ padding:"20px", textAlign:"center", color:"#bbb", fontSize:"12px" }}>No data for this period</td></tr>}
            </tbody>
          </table>
        </div>
      </>, { marginBottom:"14px" })}
    </div>
  );
}
