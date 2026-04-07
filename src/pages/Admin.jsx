import { useState } from "react";
import { workers as initialWorkers, crews } from "../data/workers";
import { projects as initialProjects, costCodes } from "../data/projects";

export default function Admin() {
  const [tab, setTab] = useState("workers");
  const [workerList, setWorkerList] = useState(initialWorkers);
  const [projectList, setProjectList] = useState(initialProjects);
  const [search, setSearch] = useState("");
  const [filterCompany, setFilterCompany] = useState("all");
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [newWorker, setNewWorker] = useState({ name:"", company:"Construction", crew:"", wage:"", ot_wage:"" });

  const filteredWorkers = workerList.filter(w =>
    (filterCompany === "all" || w.company === filterCompany) &&
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  const addWorker = () => {
    if (!newWorker.name) return;
    setWorkerList(prev => [...prev, { ...newWorker, id: Date.now(), wage: newWorker.wage ? parseFloat(newWorker.wage) : null, ot_wage: newWorker.ot_wage ? parseFloat(newWorker.ot_wage) : null }]);
    setNewWorker({ name:"", company:"Construction", crew:"", wage:"", ot_wage:"" });
    setShowAddWorker(false);
  };

  const tabs = ["workers","projects","cost codes","crews"];

  return (
    <div>
      <div style={{ fontSize:"18px", fontWeight:"500", marginBottom:"16px" }}>Admin Panel</div>

      <div style={{ display:"flex", borderBottom:"0.5px solid #ddd", marginBottom:"16px", background:"#fff", borderRadius:"12px 12px 0 0", overflow:"hidden", border:"0.5px solid #e5e5e0" }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding:"10px 20px", fontSize:"13px", fontWeight:"500", cursor:"pointer", background:"none",
            color: tab===t ? "#2D5016" : "#888", border:"none",
            borderBottom: tab===t ? "2px solid #2D5016" : "2px solid transparent",
          }}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
        ))}
      </div>

      {/* WORKERS */}
      {tab === "workers" && <div style={{ background:"#fff", borderRadius:"0 0 12px 12px", border:"0.5px solid #e5e5e0", borderTop:"none", overflow:"hidden" }}>
        <div style={{ display:"flex", gap:"8px", padding:"12px 16px", borderBottom:"0.5px solid #eee", flexWrap:"wrap", alignItems:"center" }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search workers..." style={{ flex:1, minWidth:"180px", padding:"7px 10px", border:"0.5px solid #ddd", borderRadius:"6px", fontSize:"13px" }} />
          <select value={filterCompany} onChange={e=>setFilterCompany(e.target.value)} style={{ fontSize:"12px", padding:"5px 8px", border:"0.5px solid #ddd", borderRadius:"6px" }}>
            <option value="all">All companies</option><option>Construction</option><option>Landscape</option>
          </select>
          <button onClick={() => setShowAddWorker(!showAddWorker)} style={{ padding:"7px 14px", background:"#2D5016", color:"#fff", border:"none", borderRadius:"8px", fontSize:"13px", cursor:"pointer", fontWeight:"500" }}>+ Add worker</button>
        </div>

        {showAddWorker && <div style={{ padding:"16px", borderBottom:"0.5px solid #eee", background:"#fafaf8" }}>
          <div style={{ fontSize:"13px", fontWeight:"500", marginBottom:"12px" }}>New worker</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"8px" }}>
            <input value={newWorker.name} onChange={e=>setNewWorker(p=>({...p,name:e.target.value}))} placeholder="Full name *" style={{ padding:"7px 10px", border:"0.5px solid #ddd", borderRadius:"6px", fontSize:"13px" }} />
            <select value={newWorker.company} onChange={e=>setNewWorker(p=>({...p,company:e.target.value}))} style={{ padding:"7px 10px", border:"0.5px solid #ddd", borderRadius:"6px", fontSize:"13px" }}>
              <option>Construction</option><option>Landscape</option>
            </select>
            <select value={newWorker.crew} onChange={e=>setNewWorker(p=>({...p,crew:e.target.value}))} style={{ padding:"7px 10px", border:"0.5px solid #ddd", borderRadius:"6px", fontSize:"13px" }}>
              <option value="">Select crew</option>
              {(crews[newWorker.company]||[]).map(c=><option key={c}>{c}</option>)}
            </select>
            <input value={newWorker.wage} onChange={e=>setNewWorker(p=>({...p,wage:e.target.value}))} placeholder="Wage ($/hr)" type="number" style={{ padding:"7px 10px", border:"0.5px solid #ddd", borderRadius:"6px", fontSize:"13px" }} />
            <input value={newWorker.ot_wage} onChange={e=>setNewWorker(p=>({...p,ot_wage:e.target.value}))} placeholder="OT wage ($/hr)" type="number" style={{ padding:"7px 10px", border:"0.5px solid #ddd", borderRadius:"6px", fontSize:"13px" }} />
            <div style={{ display:"flex", gap:"8px" }}>
              <button onClick={addWorker} style={{ flex:1, padding:"7px", background:"#2D5016", color:"#fff", border:"none", borderRadius:"6px", fontSize:"13px", cursor:"pointer" }}>Add</button>
              <button onClick={() => setShowAddWorker(false)} style={{ flex:1, padding:"7px", background:"#f0f0ea", border:"none", borderRadius:"6px", fontSize:"13px", cursor:"pointer" }}>Cancel</button>
            </div>
          </div>
        </div>}

        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px" }}>
            <thead><tr style={{ background:"#fafaf8" }}>
              {["Name","Company","Crew","Wage","OT Wage","Type","Actions"].map(h=>(
                <th key={h} style={{ padding:"7px 12px", textAlign:"left", color:"#888", fontWeight:"500", fontSize:"11px", borderBottom:"0.5px solid #eee" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filteredWorkers.map(w => (
                <tr key={w.id} style={{ borderBottom:"0.5px solid #f0f0ea" }}>
                  <td style={{ padding:"8px 12px", fontWeight:"500" }}>{w.name}</td>
                  <td style={{ padding:"8px 12px" }}>
                    <span style={{ display:"inline-block", padding:"1px 7px", borderRadius:"20px", fontSize:"10px", fontWeight:"500",
                      background:w.company==="Construction"?"#faeee6":"#e8f0df",
                      color:w.company==="Construction"?"#7a3210":"#2D5016" }}>{w.company}</span>
                  </td>
                  <td style={{ padding:"8px 12px", color:"#666" }}>{w.crew || <span style={{color:"#bbb"}}>—</span>}</td>
                  <td style={{ padding:"8px 12px", color:"#555" }}>{w.salary ? `$${(w.wage||0).toLocaleString()}/yr` : w.wage ? `$${w.wage}/hr` : <span style={{color:"#bbb"}}>TBD</span>}</td>
                  <td style={{ padding:"8px 12px", color:"#555" }}>{w.salary ? "N/A" : w.ot_wage ? `$${w.ot_wage}/hr` : <span style={{color:"#bbb"}}>TBD</span>}</td>
                  <td style={{ padding:"8px 12px" }}>
                    <span style={{ display:"inline-block", padding:"1px 7px", borderRadius:"20px", fontSize:"10px",
                      background:w.salary?"#e0f2fe":"#f0f0ea", color:w.salary?"#0369a1":"#555" }}>
                      {w.salary?"Salary":"Hourly"}
                    </span>
                  </td>
                  <td style={{ padding:"8px 12px" }}>
                    <button style={{ padding:"3px 9px", background:"transparent", border:"0.5px solid #ddd", borderRadius:"6px", fontSize:"11px", cursor:"pointer", color:"#555" }}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding:"9px 16px", fontSize:"12px", color:"#888" }}>{filteredWorkers.length} workers</div>
      </div>}

      {/* PROJECTS */}
      {tab === "projects" && <div style={{ background:"#fff", borderRadius:"0 0 12px 12px", border:"0.5px solid #e5e5e0", borderTop:"none", overflow:"hidden" }}>
        <div style={{ display:"flex", gap:"8px", padding:"12px 16px", borderBottom:"0.5px solid #eee", alignItems:"center" }}>
          <input placeholder="Search projects..." style={{ flex:1, padding:"7px 10px", border:"0.5px solid #ddd", borderRadius:"6px", fontSize:"13px" }} />
          <button style={{ padding:"7px 14px", background:"#2D5016", color:"#fff", border:"none", borderRadius:"8px", fontSize:"13px", cursor:"pointer", fontWeight:"500" }}>+ Add project</button>
        </div>
        <div style={{ maxHeight:"500px", overflowY:"auto" }}>
          {projectList.map((p,i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 16px", borderBottom:"0.5px solid #f0f0ea", fontSize:"13px" }}>
              <span>{p}</span>
              <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                <span style={{ padding:"2px 8px", borderRadius:"20px", fontSize:"11px", background:"#e8f0df", color:"#2D5016", fontWeight:"500" }}>Active</span>
                <button style={{ padding:"3px 9px", background:"transparent", border:"0.5px solid #ddd", borderRadius:"6px", fontSize:"11px", cursor:"pointer" }}>Edit</button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding:"9px 16px", fontSize:"12px", color:"#888" }}>{projectList.length} projects</div>
      </div>}

      {/* COST CODES */}
      {tab === "cost codes" && <div style={{ background:"#fff", borderRadius:"0 0 12px 12px", border:"0.5px solid #e5e5e0", borderTop:"none", overflow:"hidden" }}>
        <div style={{ padding:"12px 16px", borderBottom:"0.5px solid #eee", display:"flex", gap:"8px", alignItems:"center" }}>
          <input placeholder="Search cost codes..." style={{ flex:1, padding:"7px 10px", border:"0.5px solid #ddd", borderRadius:"6px", fontSize:"13px" }} />
          <button style={{ padding:"7px 14px", background:"#2D5016", color:"#fff", border:"none", borderRadius:"8px", fontSize:"13px", cursor:"pointer", fontWeight:"500" }}>+ Add code</button>
        </div>
        <div style={{ maxHeight:"500px", overflowY:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px" }}>
            <thead><tr style={{ background:"#fafaf8", position:"sticky", top:0 }}>
              {["Code","Type","Description","Department"].map(h=>(
                <th key={h} style={{ padding:"7px 12px", textAlign:"left", color:"#888", fontWeight:"500", fontSize:"11px", borderBottom:"0.5px solid #eee" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {costCodes.map(c=>(
                <tr key={c.code} style={{ borderBottom:"0.5px solid #f0f0ea" }}>
                  <td style={{ padding:"7px 12px", fontWeight:"500", color:"#2D5016" }}>{c.code}</td>
                  <td style={{ padding:"7px 12px", color:"#555" }}>{c.type}</td>
                  <td style={{ padding:"7px 12px" }}>{c.description}</td>
                  <td style={{ padding:"7px 12px" }}>
                    <span style={{ padding:"1px 7px", borderRadius:"20px", fontSize:"10px", background:"#f0f0ea", color:"#555" }}>{c.department}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding:"9px 16px", fontSize:"12px", color:"#888" }}>{costCodes.length} cost codes</div>
      </div>}

      {/* CREWS */}
      {tab === "crews" && <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
        {["Construction","Landscape"].map(company => (
          <div key={company} style={{ background:"#fff", borderRadius:"12px", border:"0.5px solid #e5e5e0", overflow:"hidden" }}>
            <div style={{ padding:"12px 16px", borderBottom:"0.5px solid #eee", display:"flex", justifyContent:"space-between", alignItems:"center",
              background: company==="Construction"?"#faeee6":"#e8f0df" }}>
              <div style={{ fontSize:"14px", fontWeight:"500", color: company==="Construction"?"#7a3210":"#2D5016" }}>{company}</div>
              <button style={{ padding:"4px 10px", background: company==="Construction"?"#C45C1A":"#2D5016", color:"#fff", border:"none", borderRadius:"6px", fontSize:"11px", cursor:"pointer" }}>+ Add crew</button>
            </div>
            {(crews[company]||[]).map(crew => {
              const members = initialWorkers.filter(w=>w.company===company&&w.crew===crew);
              return (
                <div key={crew} style={{ padding:"10px 16px", borderBottom:"0.5px solid #f0f0ea", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:"13px", fontWeight:"500" }}>{crew}</div>
                    <div style={{ fontSize:"11px", color:"#888" }}>{members.length} members</div>
                  </div>
                  <button style={{ padding:"3px 9px", background:"transparent", border:"0.5px solid #ddd", borderRadius:"6px", fontSize:"11px", cursor:"pointer" }}>Edit</button>
                </div>
              );
            })}
          </div>
        ))}
      </div>}
    </div>
  );
}
