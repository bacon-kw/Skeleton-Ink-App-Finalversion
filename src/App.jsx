import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Users from "./pages/Users";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Invoices from "./pages/Invoices";
import Vouchers from "./pages/Vouchers";
import Guides from "./pages/Guides";
import Settings from "./pages/Settings";
import Backup from "./pages/Backup";

function App() {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  });

  function handleLogin(u) {
    setUser(u);
    localStorage.setItem("user", JSON.stringify(u));
  }

  function handleLogout() {
    setUser(null);
    localStorage.removeItem("user");
  }

  if (!user) return <Login onLogin={handleLogin} />;
  return (
    <Router>
      <div className="flex min-h-screen bg-[#09090b]">
        <Sidebar user={user} onLogout={handleLogout} />
        <main className="flex-1 p-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
			<Route path="/users" element={<Users user={user} />} />
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route path="/kunden" element={<Customers user={user} />} />
            <Route path="/invoices" element={<Invoices user={user} />} />
            <Route path="/vouchers" element={<Vouchers user={user} />} />
            <Route path="/guides" element={<Guides user={user} />} />
            <Route path="/settings" element={<Settings user={user} />} />
            <Route path="/backup" element={<Backup user={user} />} />
            <Route path="*" element={<div className="text-white text-2xl">Seite nicht gefunden</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
export default App;
