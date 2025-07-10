import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

// Optional: Falls du ein Modal zum Bearbeiten/Anlegen willst, 
// kannst du diesen Abschnitt später ergänzen

export default function TattooistCustomers() {
  const { tattooist } = useParams();
  const { user } = useContext(AuthContext);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const allCustomers = JSON.parse(localStorage.getItem("customers") || "[]") || [];
    // Zeige NUR Kunden dieses Tätowierers!
    setCustomers(allCustomers.filter(c => c.tattooist === tattooist && !c.isArchived));
  }, [tattooist]);

  // Zugriffs-Logik:
  // Tätowierer darf NUR seine eigene Seite sehen,
  // Admin darf ALLE Tätowierer-Seiten sehen!
  if (user.role !== "admin" && user.username !== tattooist) {
    return <div className="text-white">Kein Zugriff</div>;
  }

  return (
    <div className="max-w-6xl mx-auto mt-10">
      <h1 className="text-5xl font-extrabold mb-8 text-white tracking-tight">
        Kunden von {tattooist.charAt(0).toUpperCase() + tattooist.slice(1)}
      </h1>
      <div className="overflow-x-auto rounded-2xl shadow-lg">
        <table className="w-full bg-[#101010] text-white rounded-2xl overflow-hidden">
          <thead>
            <tr className="text-gray-400 text-base border-b border-gray-800">
              <th className="py-4 px-4 text-left font-semibold">Name</th>
              <th className="py-4 px-4 text-left font-semibold">Telefonnummer</th>
              <th className="py-4 px-4 text-left font-semibold">Stelle</th>
              <th className="py-4 px-4 text-left font-semibold">Tattoo</th>
              <th className="py-4 px-4 text-left font-semibold">Sitzungen</th>
              <th className="py-4 px-4 text-left font-semibold">Bisher</th>
              <th className="py-4 px-4 text-left font-semibold">Datum</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-400 text-lg">
                  Noch keine Kunden.
                </td>
              </tr>
            )}
            {customers.map(c => (
              <tr key={c.id} className="hover:bg-[#18181b] transition">
                <td className="py-4 px-4">{c.name}</td>
                <td className="py-4 px-4">{c.phone}</td>
                <td className="py-4 px-4">{c.placement}</td>
                <td className="py-4 px-4">{c.tattooName}</td>
                <td className="py-4 px-4">{c.sessions}</td>
                <td className="py-4 px-4">{c.doneSessions}</td>
                <td className="py-4 px-4">{c.date ? c.date.substring(0, 10) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 text-gray-400 text-sm px-2 pb-4">
          1–{customers.length} von {customers.length}
        </div>
      </div>
    </div>
  );
}
