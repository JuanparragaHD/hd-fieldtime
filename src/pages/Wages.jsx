import { useState, useMemo } from "react";
import { useTimesheets, getWeekStart } from "../lib/timesheets";
import { workers } from "../data/workers";

export default function Wages() {
  const { wages, updateWage } = useTimesheets();
  const [filterCompany, setFilterCompany] = useState("all");
  const [filterCrew, setFilterCrew] = useState("all");
  const [editVals, setEditVals] = useState({});
  const [savedMsg, setSavedMsg] = useState("");

  const filtered = useMemo(() => workers.filter(w =>
    (filterCompany === "all" || w.company === filterCompany) &&
    (filterCrew === "all" || w.crew === filterCrew)
  ), [filterCompany, filterCrew]);

  const crews = [...new Set(workers.filter(w => filterCompany === "all" || w.company === filterCompany).map(w=>w.crew).filter(Boolean))].sort();

  const getVal = (id, field, fallback) => editVals[`${id}_${field}`] ?? fallback;
  const setVal = (id, field, val) => setEditVals(prev => ({ ...prev, [`${id}_${field}`]: val }));

  const save = (w) => {
    const wage = parseFloat(getVal(w.id, "wage", wages[w.id]?.wage || ""));
    const otWage = parseFloat(getVal(w.id, "ot_wage", wages[w.id]?.ot_wage || ""));
    updateWage(w.id, isNaN(wage) ? null : wage, isNaN(otWage) ? null : otWage);
    setSavedMsg(`Saved wages for ${w.name}`);
    setTimeout(() => setSavedMsg(""), 2500);
  };

  return (
    <div>
      <div style={{ fontSize:"18px", fontWeight:"500", marginBottom:"4px" }}>Wages</div>
      <div style={{ fontSize:"12px", color:"#888", marginBottom:"16px" }}>Accounting only · Changes apply from next Monday · Past timesheets keep their original rates</div>

      {savedMsg && <div style={{ background:"#e8f0df", borderRadius:"8px", padding:"8px 14px", marginBottom:"12px", fontSize:"13px", color:"#2D5016", fontWeight:"500" }}>{savedMsg}</div>}

      <div style={{ background:"#fff", borderRadius:"12px", border:"0.5px solid #e5e5e0", overflow:"hidden" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderBottom:"0.5px solid #eee", flexWrap:"wrap", gap:"8px" }}>
          <div style={{ fontSize:"14px", fontWeight:"500" }}>Worker wages</div>
          <div style={{ display:"flex", gap:"8px" }}>
            <select value={filterCompany} onChange={e=>{setFilterCompany(e.target.value);setFilterCrew("all");}} style={{ fontSize:"12px", padding:"5px 8px", border:"0.5px solid #ddd", borderRadius:"6px" }}>
              <option value="all">All companies</option>
              <option>Construction</option>
              <option>Landscape</option>
            </select>
            <select value={filterCrew} onChange={e=>setFilterCrew(e.target.value)} style={{ fontSize:"12px", padding:"5px 8px", border:"0.5px solid #ddd", borderRadius:"6px" }}>
              <option value="all">All crews</option>
              {crews.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px" }}>
            <thead>
              <tr style={{ background:"#fafaf8" }}>
                {["Name","Company","Crew","Type","Regular wage","OT wage","Effective from","Last changed",""].map(h=>(
                  <th key={h} style={{ padding:"7px 12px", textAlign:"left", color:"#888", fontWeight:"500", fontSize:"11px", borderBottom:"0.5px solid #eee", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(w => {
                const wageData = wages[w.id] || {};
                const isSalary = w.salary;
                return (
                  <tr key={w.id} style={{ borderBottom:"0.5px solid #f0f0ea" }}>
                    <td style={{ padding:"8px 12px", fontWeight:"500", whiteSpace:"nowrap" }}>{w.name}</td>
                    <td style={{ padding:"8px 12px" }}>
                      <span style={{ display:"inline-block", padding:"1px 7px", borderRadius:"20px", fontSize:"10px", fontWeight:"500",
                        background: w.company==="Construction" ? "#faeee6" : "#e8f0df",
                        color: w.company==="Construction" ? "#7a3210" : "#2D5016" }}>
                        {w.company}
                      </span>
                    </td>
                    <td style={{ padding:"8px 12px", color:"#666" }}>{w.crew || <span style={{color:"#bbb"}}>—</span>}</td>
                    <td style={{ padding:"8px 12px" }}>
                      <span style={{ display:"inline-block", padding:"1px 7px", borderRadius:"20px", fontSize:"10px", fontWeight:"500",
                        background: isSalary ? "#e0f2fe" : "#f0f0ea",
                        color: isSalary ? "#0369a1" : "#555" }}>
                        {isSalary ? "Salary" : "Hourly"}
                      </span>
                    </td>
                    <td style={{ padding:"8px 12px" }}>
                      {isSalary
                        ? <span style={{ color:"#888", fontSize:"12px" }}>${(wageData.wage||w.wage||0).toLocaleString()}/yr</span>
                        : <input value={getVal(w.id,"wage", wageData.wage||w.wage||"")} onChange={e=>setVal(w.id,"wage",e.target.value)}
                            style={{ padding:"5px 8px", border:"0.5px solid #ddd", borderRadius:"6px", fontSize:"12px", width:"80px" }}
                            placeholder="$0.00" />
                      }
                    </td>
                    <td style={{ padding:"8px 12px" }}>
                      {isSalary
                        ? <span style={{ color:"#bbb", fontSize:"12px" }}>N/A</span>
                        : <input value={getVal(w.id,"ot_wage", wageData.ot_wage||w.ot_wage||"")} onChange={e=>setVal(w.id,"ot_wage",e.target.value)}
                            style={{ padding:"5px 8px", border:"0.5px solid #ddd", borderRadius:"6px", fontSize:"12px", width:"80px" }}
                            placeholder="$0.00" />
                      }
                    </td>
                    <td style={{ padding:"8px 12px", color:"#888", fontSize:"12px" }}>{wageData.effectiveFrom || getWeekStart().toLocaleDateString("en-US")}</td>
                    <td style={{ padding:"8px 12px", color:"#888", fontSize:"12px" }}>{wageData.lastChanged || "—"}</td>
                    <td style={{ padding:"8px 12px" }}>
                      {!isSalary && <button onClick={()=>save(w)} style={{ padding:"4px 10px", background:"#2D5016", color:"#fff", border:"none", borderRadius:"6px", fontSize:"11px", cursor:"pointer", fontWeight:"500" }}>Save</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding:"9px 16px", fontSize:"12px", color:"#888" }}>Showing {filtered.length} of {workers.length} workers</div>
      </div>
    </div>
  );
}
