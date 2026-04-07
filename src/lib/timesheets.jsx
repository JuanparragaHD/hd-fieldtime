import { createContext, useContext, useState } from "react";
import { workers } from "../data/workers";

const TimesheetContext = createContext(null);

// Get Monday of a given date's week
export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0,0,0,0);
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

export function parseTime(str) {
  if (!str) return null;
  const [time, ampm] = str.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

export function calcHours(clockIn, clockOut, breakMins = 0) {
  if (!clockIn || !clockOut) return 0;
  const inMins = parseTime(clockIn);
  const outMins = parseTime(clockOut);
  if (outMins <= inMins) return 0;
  return Math.max(0, (outMins - inMins - breakMins) / 60);
}

export function calcOT(totalHours) {
  return Math.max(0, totalHours - 10);
}

// Generate seed data for the current week
function generateSeedData() {
  const entries = [];
  const weekStart = getWeekStart();
  const sampleWorkers = workers.slice(0, 20);
  const sampleProjects = ["Massey Oaks Village","Kresston Legends Pointe Park","Clopton Farms Rec Center","Candela South Landscape Improvements","Laurel Farms","Pine Island"];
  const sampleCodes = ["13-13.006","15-15.001","15-15.005","12-12.003","99-99.999","13-13.002"];
  const statuses = ["submitted","approved","pending_crew"];

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
      const fmt = (h, m) => `${h % 12 || 12}:${String(m).padStart(2,"0")} ${h < 12 ? "AM" : "PM"}`;
      entries.push({
        id: `${w.id}-${d}`,
        workerId: w.id,
        workerName: w.name,
        company: w.company,
        crew: w.crew,
        date: date.toISOString().split("T")[0],
        clockIn: fmt(clockInHour, clockInMin),
        clockOut: fmt(clockOutHour % 24, clockOutMin),
        breakMins: 60,
        totalHours: parseFloat(hours.toFixed(2)),
        otHours: parseFloat(calcOT(hours).toFixed(2)),
        project: sampleProjects[wi % sampleProjects.length],
        costCode: sampleCodes[wi % sampleCodes.length],
        status: d < 3 ? "approved" : d === 3 ? "submitted" : "pending_crew",
        wage: w.wage,
        otWage: w.ot_wage,
      });
    }
  });
  return entries;
}

export function TimesheetProvider({ children }) {
  const [entries, setEntries] = useState(generateSeedData);
  const [wages, setWages] = useState(() =>
    workers.reduce((acc, w) => {
      acc[w.id] = { wage: w.wage, ot_wage: w.ot_wage, effectiveFrom: getWeekStart().toISOString().split("T")[0] };
      return acc;
    }, {})
  );

  const addEntry = (entry) => setEntries(prev => [...prev, { ...entry, id: Date.now().toString() }]);

  const updateEntry = (id, updates) => setEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));

  const approveEntry = (id) => updateEntry(id, { status: "approved" });

  const approveAll = (ids) => setEntries(prev => prev.map(e => ids.includes(e.id) ? { ...e, status: "approved" } : e));

  const updateWage = (workerId, wage, otWage) => {
    setWages(prev => ({
      ...prev,
      [workerId]: { wage, ot_wage: otWage, effectiveFrom: getWeekStart().toISOString().split("T")[0], lastChanged: new Date().toLocaleDateString("en-US") }
    }));
  };

  const clockIn = (entry) => addEntry({ ...entry, status: "clocked_in" });

  const clockOut = (workerId, date, clockOut) => {
    setEntries(prev => prev.map(e =>
      e.workerId === workerId && e.date === date && e.status === "clocked_in"
        ? { ...e, clockOut, status: "submitted", totalHours: parseFloat(calcHours(e.clockIn, clockOut, e.breakMins).toFixed(2)), otHours: parseFloat(calcOT(calcHours(e.clockIn, clockOut, e.breakMins)).toFixed(2)) }
        : e
    ));
  };

  return (
    <TimesheetContext.Provider value={{ entries, wages, addEntry, updateEntry, approveEntry, approveAll, updateWage, clockIn, clockOut }}>
      {children}
    </TimesheetContext.Provider>
  );
}

export const useTimesheets = () => useContext(TimesheetContext);
