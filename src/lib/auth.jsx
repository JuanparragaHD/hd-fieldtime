import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

// Demo users for prototype
export const DEMO_USERS = [
  { id: "acc1", username: "juan.parraga", password: "admin123", name: "Juan Diego Parraga", role: "accounting", company: "both", email: "juan@hdconstruction.com" },
  { id: "cm1", username: "martin.crew", password: "martin123", name: "Martin Mendez", role: "crew_manager", company: "Construction", crew: "Martin" },
  { id: "cm2", username: "omar.crew", password: "omar123", name: "Omar Cortez", role: "crew_manager", company: "Construction", crew: "Omar" },
  { id: "cm3", username: "wilson.crew", password: "wilson123", name: "Wilson Alonso", role: "crew_manager", company: "Landscape", crew: "Wilson" },
  { id: "w1", username: "jose.hernandez", password: "jose123", name: "Jose Hernandez", role: "worker", company: "Construction", crew: "Yard", workerId: 39 },
  { id: "w2", username: "alexis.morales", password: "alexis123", name: "Alexis Morales", role: "worker", company: "Construction", crew: "Waldo", workerId: 2 },
  { id: "w3", username: "delfino.gamez", password: "delfino123", name: "Delfino Gamez", role: "worker", company: "Landscape", crew: "Defino", workerId: 18 },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  const login = (username, password) => {
    const found = DEMO_USERS.find(u => u.username === username && u.password === password);
    if (found) { setUser(found); setError(""); return true; }
    setError("Invalid username or password");
    return false;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
