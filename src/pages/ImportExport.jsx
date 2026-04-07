import { useState, useRef } from "react";
import { useTimesheets } from "../lib/timesheets";

// Parse time string like "6:44 AM" or "07:36 PM"
function parseTimeStr(str) {
  if (!str) return "";
  str = String(str).trim();
  if (str.includes(":")) return str;
  return str;
}

// Parse CSV or TSV row
function parseRow(row) {
  // Handle quoted CSV
  const result = [];
  let cur = "", inQ = false;
  for (let i = 0; i < row.length; i++) {
    const c = row[i];
    if (c === '"') { inQ = !inQ; continue; }
    if ((c === ',' || c === '\t') && !inQ) { result.push(cur.trim()); cur = ""; continue; }
    cur += c;
  }
  result.push(cur.trim());
  return result;
}

export default function ImportExport() {
  const { entries, addEntry } = useTimesheets();
  const [tab, setTab] = useState("import");
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(0);
  const [error, setError] = useState("");
  const fileRef = useRef();

  // Expected columns (Lumber format)
  const COLUMNS = ["Name","Crew","Employee ID","Date","First Clock In","Final Clock Out","Total Hours","Total Paid Hours","Total Break","Break","Equipment","Run Time","Equipment Shared","Travel","Per Diem","Lodging","Injury","Status","Signature","Project Name","Department Name","Task","Cost Code","Cost Type"];

  const parseFile = (file) => {
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) { setError("File appears empty"); return; }

        const headers = parseRow(lines[0]);
        const rows = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = parseRow(lines[i]);
          if (cols.length < 4) continue;
          const obj = {};
          headers.forEach((h, idx) => { obj[h.trim()] = cols[idx] || ""; });

          // Map to our entry format
          const name = obj["Name"] || obj["Worker"] || "";
          const crew = obj["Crew"] || "";
          const date = obj["Date"] || "";
          const clockIn = parseTimeStr(obj["First Clock In"] || obj["Clock In"] || "");
          const clockOut = parseTimeStr(obj["Final Clock Out"] || obj["Clock Out"] || "");
          const totalHours = parseFloat(obj["Total Hours"] || obj["Total Paid Hours"] || 0);
          const project = obj["Project Name"] || obj["Project"] || "";
          const costCode = obj["Cost Code"] || "";
          const status = (obj["Status"] || "").toLowerCase() === "paid" ? "approved" : "submitted";

          if (!name || !date) continue;

          rows.push({ name, crew, date, clockIn, clockOut, totalHours, project, costCode, status, breakMins: 60 });
        }

        setPreview({ rows, headers, total: rows.length });
      } catch (err) {
        setError("Could not parse file. Make sure it's a CSV or TSV in Lumber format.");
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) parseFile(file);
  };

  const confirmImport = () => {
    setImporting(true);
    let count = 0;
    preview.rows.forEach(row => {
      // Find worker id by name
      const totalHrs = parseFloat(row.totalHours) || 0;
      const otHrs = Math.max(0, totalHrs - 10);
      addEntry({
        workerName: row.name,
        workerId: null,
        company: "Construction", // default, can be improved
        crew: row.crew,
        date: row.date,
        clockIn: row.clockIn,
        clockOut: row.clockOut,
        breakMins: row.breakMins,
        totalHours: totalHrs,
        otHours: otHrs,
        project: row.project,
        costCode: row.costCode,
        status: row.status,
        wage: null,
        otWage: null,
      });
      count++;
    });
    setImported(count);
    setPreview(null);
    setImporting(false);
  };

  // Template download
  const downloadTemplate = () => {
    const header = COLUMNS.join(",");
    const example = [
      '"Jose Hernandez","Yard","","12/30/2024","7:00 AM","6:27 PM","11:27","11:27","1:00","1:00","","","","No","FALSE","FALSE","No","Paid","Yes","Massey Oaks Village","","","13-13.006","Site Works"',
      '"Alexis Morales","Waldo","","12/30/2024","6:45 AM","4:55 PM","11:01","11:01","1:00","1:00","","","","No","FALSE","FALSE","No","Paid","Yes","Massey Oaks Village","","","99-99.999","Landscape"',
    ];
    const csv = [header, ...example].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "HD_Timesheet_Template.csv";
    a.click();
  };

  // Export current data
  const exportAll = () => {
    const headers = ["Name","Crew","Employee ID","Date","First Clock In","Final Clock Out","Total Hours","Total Paid Hours","Total Break","Break","Equipment","Run Time","Equipment Shared","Travel","Per Diem","Lodging","Injury","Status","Signature","Project Name","Department Name","Task","Cost Code","Cost Type"];
    const rows = entries.map(e => [
      e.workerName, e.crew||"", "", e.date, e.clockIn||"", e.clockOut||"",
      (e.totalHours||0).toFixed(2), (e.totalHours||0).toFixed(2), "1:00","1:00",
      "","","","No","FALSE","FALSE","No",
      e.status==="approved"?"Paid":"Pending",
      e.status==="approved"?"Yes":"No",
      e.project||"","","",e.costCode||"",""
    ]);
    const csv = [headers,...rows].map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv],{type:"text/csv"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `HD_All_Timesheets_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div>
      <div style={{ fontSize:"18px", fontWeight:"500", marginBottom:"16px" }}>Import / Export</div>

      <div style={{ display:"flex", borderBottom:"0.5px solid #ddd", marginBottom:"16px" }}>
        {[["import","Import data"],["export","Export data"],["template","Template"]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ padding:"9px 20px", fontSize:"13px", fontWeight:"500", cursor:"pointer", background:"none", border:"none", color:tab===t?"#2D5016":"#888", borderBottom:tab===t?"2px solid #2D5016":"2px solid transparent" }}>{l}</button>
        ))}
      </div>

      {/* IMPORT */}
      {tab === "import" && <div>
        <div style={{ background:"#fff", borderRadius:"12px", border:"0.5px solid #e5e5e0", padding:"24px", marginBottom:"14px" }}>
          <div style={{ fontSize:"14px", fontWeight:"500", marginBottom:"4px" }}>Upload Lumber export</div>
          <div style={{ fontSize:"12px", color:"#888", marginBottom:"16px" }}>Accepts CSV or TSV files in Lumber format. Existing entries are not overwritten.</div>

          <div
            onDrop={handleDrop}
            onDragOver={e=>{e.preventDefault();setDragOver(true);}}
            onDragLeave={()=>setDragOver(false)}
            onClick={()=>fileRef.current.click()}
            style={{ border:`2px dashed ${dragOver?"#2D5016":"#ddd"}`, borderRadius:"12px", padding:"40px 20px", textAlign:"center", cursor:"pointer", background:dragOver?"#e8f0df":"#fafaf8", transition:"all 0.2s" }}>
            <div style={{ fontSize:"32px", marginBottom:"8px" }}>📄</div>
            <div style={{ fontSize:"14px", fontWeight:"500", color:"#333", marginBottom:"4px" }}>Drop your CSV file here</div>
            <div style={{ fontSize:"12px", color:"#888" }}>or click to browse · CSV, TSV accepted</div>
            <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" onChange={handleFile} style={{ display:"none" }} />
          </div>

          {error && <div style={{ background:"#fef2f2", border:"0.5px solid #fecaca", borderRadius:"8px", padding:"10px 14px", fontSize:"13px", color:"#dc2626", marginTop:"12px" }}>{error}</div>}
        </div>

        {/* Preview */}
        {preview && <div style={{ background:"#fff", borderRadius:"12px", border:"0.5px solid #e5e5e0", overflow:"hidden" }}>
          <div style={{ padding:"12px 16px", borderBottom:"0.5px solid #eee", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:"14px", fontWeight:"500" }}>Preview — {preview.total} records found</div>
              <div style={{ fontSize:"12px", color:"#888" }}>Review before importing</div>
            </div>
            <div style={{ display:"flex", gap:"8px" }}>
              <button onClick={()=>setPreview(null)} style={{ padding:"6px 14px", background:"transparent", border:"0.5px solid #ddd", borderRadius:"8px", fontSize:"13px", cursor:"pointer" }}>Cancel</button>
              <button onClick={confirmImport} style={{ padding:"6px 14px", background:"#2D5016", color:"#fff", border:"none", borderRadius:"8px", fontSize:"13px", cursor:"pointer", fontWeight:"500" }}>
                Import {preview.total} records
              </button>
            </div>
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px" }}>
              <thead><tr style={{ background:"#fafaf8" }}>
                {["Name","Crew","Date","Clock in","Clock out","Total hrs","Project","Cost code","Status"].map(h=>(
                  <th key={h} style={{ padding:"7px 12px", textAlign:"left", color:"#888", fontWeight:"500", fontSize:"11px", borderBottom:"0.5px solid #eee", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {preview.rows.slice(0,10).map((row,i)=>(
                  <tr key={i} style={{ borderBottom:"0.5px solid #f0f0ea" }}>
                    <td style={{ padding:"7px 12px", fontWeight:"500" }}>{row.name}</td>
                    <td style={{ padding:"7px 12px", color:"#666" }}>{row.crew}</td>
                    <td style={{ padding:"7px 12px", color:"#666" }}>{row.date}</td>
                    <td style={{ padding:"7px 12px" }}>{row.clockIn}</td>
                    <td style={{ padding:"7px 12px" }}>{row.clockOut}</td>
                    <td style={{ padding:"7px 12px", fontWeight:"500" }}>{row.totalHours}</td>
                    <td style={{ padding:"7px 12px", maxWidth:"140px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{row.project}</td>
                    <td style={{ padding:"7px 12px", color:"#888" }}>{row.costCode}</td>
                    <td style={{ padding:"7px 12px" }}>
                      <span style={{ display:"inline-block", padding:"2px 7px", borderRadius:"20px", fontSize:"11px", fontWeight:"500", background:row.status==="approved"?"#e8f0df":"#dbeafe", color:row.status==="approved"?"#2D5016":"#1e40af" }}>{row.status}</span>
                    </td>
                  </tr>
                ))}
                {preview.rows.length > 10 && <tr><td colSpan={9} style={{ padding:"10px 12px", textAlign:"center", color:"#888", fontSize:"12px" }}>...and {preview.rows.length - 10} more records</td></tr>}
              </tbody>
            </table>
          </div>
        </div>}

        {imported > 0 && <div style={{ background:"#e8f0df", border:"0.5px solid #b5d1a0", borderRadius:"8px", padding:"12px 16px", fontSize:"13px", color:"#2D5016", fontWeight:"500" }}>
          ✓ Successfully imported {imported} records
        </div>}
      </div>}

      {/* EXPORT */}
      {tab === "export" && <div style={{ background:"#fff", borderRadius:"12px", border:"0.5px solid #e5e5e0", padding:"24px" }}>
        <div style={{ fontSize:"14px", fontWeight:"500", marginBottom:"4px" }}>Export timesheets</div>
        <div style={{ fontSize:"12px", color:"#888", marginBottom:"20px" }}>Download in Lumber format — same columns as your original export</div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"20px" }}>
          {[
            ["All data", `${entries.length} total entries`, "#2D5016", exportAll],
            ["Approved only", `${entries.filter(e=>e.status==="approved").length} entries`, "#3d6b1e", ()=>{}],
          ].map(([title, sub, color, fn])=>(
            <div key={title} onClick={fn} style={{ border:`0.5px solid #e5e5e0`, borderRadius:"10px", padding:"16px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:"13px", fontWeight:"500" }}>{title}</div>
                <div style={{ fontSize:"12px", color:"#888" }}>{sub}</div>
              </div>
              <button style={{ padding:"6px 14px", background:color, color:"#fff", border:"none", borderRadius:"8px", fontSize:"12px", cursor:"pointer" }}>Download</button>
            </div>
          ))}
        </div>

        <div style={{ background:"#f5f5f3", borderRadius:"8px", padding:"12px 14px", fontSize:"12px", color:"#666" }}>
          <b>Format:</b> CSV with columns: Name, Crew, Employee ID, Date, First Clock In, Final Clock Out, Total Hours, Total Paid Hours, Total Break, Break, Equipment, Run Time, Equipment Shared, Travel, Per Diem, Lodging, Injury, Status, Signature, Project Name, Department Name, Task, Cost Code, Cost Type
        </div>
      </div>}

      {/* TEMPLATE */}
      {tab === "template" && <div style={{ background:"#fff", borderRadius:"12px", border:"0.5px solid #e5e5e0", padding:"24px" }}>
        <div style={{ fontSize:"14px", fontWeight:"500", marginBottom:"4px" }}>Download template</div>
        <div style={{ fontSize:"12px", color:"#888", marginBottom:"20px" }}>Download a blank template in Lumber format with example rows</div>

        <div style={{ border:"0.5px solid #e5e5e0", borderRadius:"10px", padding:"16px", marginBottom:"16px" }}>
          <div style={{ fontSize:"13px", fontWeight:"500", marginBottom:"8px" }}>Lumber-compatible template</div>
          <div style={{ fontSize:"12px", color:"#888", marginBottom:"12px" }}>Includes all required columns with 2 example rows. Fill it in and upload via the Import tab.</div>
          <button onClick={downloadTemplate} style={{ padding:"8px 18px", background:"#2D5016", color:"#fff", border:"none", borderRadius:"8px", fontSize:"13px", cursor:"pointer", fontWeight:"500" }}>
            Download template CSV
          </button>
        </div>

        <div style={{ background:"#fafaf8", borderRadius:"8px", padding:"14px", fontSize:"12px" }}>
          <div style={{ fontWeight:"500", color:"#333", marginBottom:"8px" }}>Column guide</div>
          {[
            ["Name","Full name of the worker"],
            ["Crew","Crew name (e.g. Martin, Omar, Wilson)"],
            ["Date","MM/DD/YYYY format"],
            ["First Clock In","Time format: 7:00 AM"],
            ["Final Clock Out","Time format: 5:30 PM"],
            ["Total Hours","Decimal hours (e.g. 10.5)"],
            ["Project Name","Must match a project in the system"],
            ["Cost Code","e.g. 13-13.006"],
            ["Status","Paid or Pending"],
          ].map(([col, desc])=>(
            <div key={col} style={{ display:"flex", gap:"12px", padding:"4px 0", borderBottom:"0.5px solid #f0f0ea" }}>
              <span style={{ fontWeight:"500", color:"#2D5016", minWidth:"130px" }}>{col}</span>
              <span style={{ color:"#666" }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>}
    </div>
  );
}
