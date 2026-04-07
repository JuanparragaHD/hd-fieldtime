import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { workers as localWorkers } from "../data/workers";

const TimesheetContext = createContext(null);

export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
export function getWeekEnd(weekStart) {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  return d;
}
export function formatDate(d) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
export function calcOT(totalHours) {
  return Math.max(0, totalHours - 10);
}

function dbToEntry(row) {
  return {
    id: row.id, workerId: row.worker_id, workerName: row.worker_name,
    company: row.company, crew: row.crew, date: row.date,
    clockIn: row.clock_in, clockOut: row.clock_out, breakMins: row.break_mins,
    totalHours: parseFloat(row.total_hours) || 0, otHours: parseFloat(row.ot_hours) || 0,
    project: row.project, costCode: row.cost_code, status: row.status,
    wage: row.wage, otWage: row.ot_wage,
  };
}

function entryToDb(entry) {
  return {
    worker_id: entry.workerId || null, worker_name: entry.workerName,
    company: entry.company, crew: entry.crew || null, date: entry.date,
    clock_in: entry.clockIn || null, clock_out: entry.clockOut || null,
    break_mins: entry.breakMins || 60, total_hours: entry.totalHours || 0,
    ot_hours: entry.otHours || 0, project: entry.project || null,
    cost_code: entry.costCode || null, status: entry.status || "submitted",
    wage: entry.wage || null, ot_wage: entry.otWage || null,
    week_start: getWeekStart(new Date(entry.date)).toISOString().split("T")[0],
  };
}

function generateSeedData() {
  const entries = [];
  const weekStart = getWeekStart();
  const sampleWorkers = localWorkers.slice(0, 20);
  const sampleProjects = ["Massey Oaks Village","Kresston Legends Pointe Park","Clopton Farms Rec Center","Candela South Landscape Improvements","Laurel Farms","Pine Island"];
  const sampleCodes = ["13-13.006","15-15.001","15-15.005","12-12.003","99-99.999","13-13.002"];
  sampleWorkers.forEach((w, wi) => {
    for (let d = 0; d < 5; d++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + d);
      if (date > new Date()) continue;
      const hours = 8 + Math.random() * 4;
      const clockInHour = 6 + Math.floor(Math.random() * 2);
      const clockInMin = Math.floor(Math.random() * 60);
      const totalMinutes = Math.round(hours * 60);
      const clockOutHour = Math.floor((clockInHour * 60 + clockInMin + totalMinutes + 60) / 60);
      const clockOutMin = (clockInHour * 60 + clockInMin + totalMinutes + 60) % 60;
      const fmt = (h, m) => `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
      entries.push({
        id: `seed-${w.id}-${d}`, workerId: w.id, workerName: w.name,
        company: w.company, crew: w.crew,
        date: date.toISOString().split("T")[0],
        clockIn: fmt(clockInHour, clockInMin),
        clockOut: fmt(clockOutHour % 24, clockOutMin),
        breakMins: 60, totalHours: parseFloat(hours.toFixed(2)),
        otHours: parseFloat(calcOT(hours).toFixed(2)),
        project: sampleProjects[wi % sampleProjects.length],
        costCode: sampleCodes[wi % sampleCodes.length],
        status: d < 3 ? "approved" : d === 3 ? "submitted" : "pending_crew",
        wage: w.wage, otWage: w.ot_wage,
      });
    }
  });
  return entries;
}

export function TimesheetProvider({ children }) {
  const [entries, setEntries] = useState([]);
  const [workers, setWorkers] = useState(localWorkers);
  const [wages, setWages] = useState(() =>
    localWorkers.reduce((acc, w) => {
      acc[w.id] = { wage: w.wage, ot_wage: w.ot_wage, effectiveFrom: getWeekStart().toISOString().split("T")[0] };
      return acc;
    }, {})
  );
  const [loading, setLoading] = useState(true);
  const [useLocal, setUseLocal] = useState(false);

  const loadEntries = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("timesheet_entries").select("*").order("date", { ascending: false });
      if (error) throw error;
      setEntries(data && data.length > 0 ? data.map(dbToEntry) : generateSeedData());
      setUseLocal(false);
    } catch (err) {
      console.warn("Supabase not configured, using local data:", err.message);
      setEntries(generateSeedData());
      setUseLocal(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWorkers = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("workers").select("*").order("name");
      if (error) throw error;
      if (data && data.length > 0) {
        const mapped = data.map(w => ({ id: w.id, name: w.name, company: w.company, crew: w.crew, wage: w.wage, ot_wage: w.ot_wage, salary: w.salary }));
        setWorkers(mapped);
        setWages(mapped.reduce((acc, w) => {
          acc[w.id] = { wage: w.wage, ot_wage: w.ot_wage, effectiveFrom: getWeekStart().toISOString().split("T")[0] };
          return acc;
        }, {}));
      }
    } catch (err) {
      console.warn("Workers from local:", err.message);
    }
  }, []);

  useEffect(() => { loadEntries(); loadWorkers(); }, []);

  useEffect(() => {
    if (useLocal) return;
    const channel = supabase.channel("timesheet_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "timesheet_entries" }, () => loadEntries())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [useLocal, loadEntries]);

  const addEntry = async (entry) => {
    const newEntry = { ...entry, id: Date.now().toString(), otHours: calcOT(entry.totalHours || 0) };
    setEntries(prev => [newEntry, ...prev]);
    if (!useLocal) {
      try {
        const { data, error } = await supabase.from("timesheet_entries").insert([entryToDb(newEntry)]).select().single();
        if (error) throw error;
        setEntries(prev => prev.map(e => e.id === newEntry.id ? dbToEntry(data) : e));
      } catch (err) { console.error("Insert failed:", err.message); }
    }
  };

  const updateEntry = async (id, updates) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    if (!useLocal) {
      try {
        const entry = entries.find(e => e.id === id);
        if (!entry) return;
        await supabase.from("timesheet_entries").update(entryToDb({ ...entry, ...updates })).eq("id", id);
      } catch (err) { console.error("Update failed:", err.message); }
    }
  };

  const approveEntry = async (id) => updateEntry(id, { status: "approved" });

  const approveAll = async (ids) => {
    setEntries(prev => prev.map(e => ids.includes(e.id) ? { ...e, status: "approved" } : e));
    if (!useLocal) {
      try {
        await supabase.from("timesheet_entries").update({ status: "approved" }).in("id", ids);
      } catch (err) { console.error("Approve all failed:", err.message); }
    }
  };

  const updateWage = async (workerId, wage, otWage) => {
    const weekStart = getWeekStart().toISOString().split("T")[0];
    setWages(prev => ({ ...prev, [workerId]: { wage, ot_wage: otWage, effectiveFrom: weekStart, lastChanged: new Date().toLocaleDateString("en-US") } }));
    if (!useLocal) {
      try {
        await supabase.from("workers").update({ wage, ot_wage: otWage }).eq("id", workerId);
        await supabase.from("wage_history").insert([{ worker_id: workerId, wage, ot_wage: otWage, effective_from: weekStart }]);
      } catch (err) { console.error("Wage update failed:", err.message); }
    }
  };

  const clockIn = async (entry) => addEntry({ ...entry, status: "clocked_in" });

  const clockOut = async (workerId, date, clockOutTime) => {
    const entry = entries.find(e => e.workerId === workerId && e.date === date && e.status === "clocked_in");
    if (!entry) return;
    const parseT = (str) => {
      if (!str) return 0;
      const [time, ampm] = str.split(" ");
      let [h, m] = time.split(":").map(Number);
      if (ampm === "PM" && h !== 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      return h * 60 + m;
    };
    const totalH = Math.max(0, (parseT(clockOutTime) - parseT(entry.clockIn) - entry.breakMins) / 60);
    await updateEntry(entry.id, { clockOut: clockOutTime, status: "submitted", totalHours: parseFloat(totalH.toFixed(2)), otHours: parseFloat(calcOT(totalH).toFixed(2)) });
  };

  const bulkImport = async (rows) => {
    const newEntries = rows.map(row => ({ ...row, id: `import-${Date.now()}-${Math.random()}`, otHours: calcOT(parseFloat(row.totalHours) || 0) }));
    setEntries(prev => [...newEntries, ...prev]);
    if (!useLocal) {
      try {
        for (let i = 0; i < newEntries.length; i += 100) {
          const { error } = await supabase.from("timesheet_entries").insert(newEntries.slice(i, i + 100).map(entryToDb));
          if (error) throw error;
        }
        await loadEntries();
      } catch (err) { console.error("Bulk import failed:", err.message); }
    }
    return newEntries.length;
  };

  return (
    <TimesheetContext.Provider value={{ entries, workers, wages, loading, useLocal, addEntry, updateEntry, approveEntry, approveAll, updateWage, clockIn, clockOut, bulkImport, reload: loadEntries }}>
      {children}
    </TimesheetContext.Provider>
  );
}

export const useTimesheets = () => useContext(TimesheetContext);
