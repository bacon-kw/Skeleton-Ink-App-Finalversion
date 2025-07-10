import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Sidebar({ user, onLogout }) {
  const location = useLocation();
  const [tattooists, setTattooists] = useState([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("users")
        .select("username, color")
        .eq("role", "tattooist");
      setTattooists(data || []);
    }
    load();
  }, []);

  // Für farbige Chips
  const colorMap = {
    gray: "bg-gray-600",
    red: "bg-red-600",
    blue: "bg-blue-600",
    pink: "bg-pink-600",
    green: "bg-green-600",
    purple: "bg-purple-600",
    orange: "bg-orange-600"
  };

  return (
    <aside className="bg-black text-white w-72 min-h-screen p-7 flex flex-col border-r border-gray-800">
      <div className="flex items-center mb-4">
        <span className="text-3xl mr-3">💀</span>
        <span className="text-3xl font-extrabold tracking-widest" style={{ letterSpacing: 1 }}>
          SKELETON INK
        </span>
      </div>
      {/* Tätowierer-Chips */}
      <div className="flex flex-wrap gap-2 mb-7">
        {tattooists.map(t => (
          <span
            key={t.username}
            className={`px-3 py-1 rounded-full text-xs font-semibold ${colorMap[t.color] || "bg-gray-600"} shadow`}
          >
            {t.username}
          </span>
        ))}
      </div>
      <nav className="flex-1">
        <div className="mb-4 font-bold text-xs text-gray-400 uppercase tracking-wide">Menü</div>
        <ul>
          <li>
            <Link
              to="/dashboard"
              className={`flex items-center py-2 px-3 mb-1 rounded-xl transition ${location.pathname === "/dashboard" ? "bg-gray-800 font-bold" : "hover:bg-gray-900"}`}>
              <span className="mr-2">🏠</span>Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/kunden"
              className={`flex items-center py-2 px-3 mb-1 rounded-xl transition ${location.pathname === "/kunden" ? "bg-gray-800 font-bold" : "hover:bg-gray-900"}`}>
              <span className="mr-2">👥</span>Kunden
            </Link>
          </li>
          <li>
            <Link
              to="/invoices"
              className={`flex items-center py-2 px-3 mb-1 rounded-xl transition ${location.pathname === "/invoices" ? "bg-gray-800 font-bold" : "hover:bg-gray-900"}`}>
              <span className="mr-2">📄</span>Rechnungen
            </Link>
          </li>
          <li>
            <Link
              to="/vouchers"
              className={`flex items-center py-2 px-3 mb-1 rounded-xl transition ${location.pathname === "/vouchers" ? "bg-gray-800 font-bold" : "hover:bg-gray-900"}`}>
              <span className="mr-2">🎟️</span>Gutscheine
            </Link>
          </li>
          <li>
            <Link
              to="/guides"
              className={`flex items-center py-2 px-3 mb-1 rounded-xl transition ${location.pathname === "/guides" ? "bg-gray-800 font-bold" : "hover:bg-gray-900"}`}>
              <span className="mr-2">📖</span>Anleitungen
            </Link>
          </li>
          <li>
            <Link
              to="/settings"
              className={`flex items-center py-2 px-3 mb-1 rounded-xl transition ${location.pathname === "/settings" ? "bg-gray-800 font-bold" : "hover:bg-gray-900"}`}>
              <span className="mr-2">💰</span>Steuern
            </Link>
          </li>
          <li>
            <Link
              to="/backup"
              className={`flex items-center py-2 px-3 mb-1 rounded-xl transition ${location.pathname === "/backup" ? "bg-gray-800 font-bold" : "hover:bg-gray-900"}`}>
              <span className="mr-2">🗄️</span>Export & Backup
            </Link>
          </li>
          {user.role === "admin" && (
            <li>
              <Link
                to="/users"
                className={`flex items-center py-2 px-3 mb-1 rounded-xl transition ${location.pathname === "/users" ? "bg-gray-800 font-bold" : "hover:bg-gray-900"}`}>
                <span className="mr-2">🔑</span>Benutzerverwaltung
              </Link>
            </li>
          )}
        </ul>
      </nav>
      <button
        onClick={onLogout}
        className="mt-auto bg-gray-900 text-red-300 px-3 py-2 rounded-xl hover:bg-gray-700 transition font-semibold"
      >
        Logout
      </button>
    </aside>
  );
}
