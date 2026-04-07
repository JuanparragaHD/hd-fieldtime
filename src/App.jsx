import { useState } from "react";
import { AuthProvider, useAuth } from "./lib/auth";
import { TimesheetProvider } from "./lib/timesheets";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Timesheets from "./pages/Timesheets";
import ClockIn from "./pages/ClockIn";
import CrewManager from "./pages/CrewManager";
import Wages from "./pages/Wages";
import Admin from "./pages/Admin";

const defaultPage = {
  accounting: "timesheets",
  crew_manager: "clockin",
  worker: "clockin",
};

function AppInner() {
  const { user } = useAuth();
  const [activePage, setActivePage] = useState(user ? defaultPage[user.role] : "");

  if (!user) return <Login />;

  const pages = {
    timesheets: <Timesheets />,
    clockin: <ClockIn />,
    crew: <CrewManager />,
    wages: <Wages />,
    admin: <Admin />,
    myweek: <ClockIn />,
    summary: <Timesheets />,
  };

  return (
    <Layout activePage={activePage} setActivePage={setActivePage}>
      {pages[activePage] || <div style={{ padding: "20px", color: "#888" }}>Select a page from the sidebar</div>}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TimesheetProvider>
        <AppInner />
      </TimesheetProvider>
    </AuthProvider>
  );
}
