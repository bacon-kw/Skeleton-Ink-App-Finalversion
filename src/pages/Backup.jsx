import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function Backup({ user }) {
  const [jsonData, setJsonData] = useState("");
  const [importMsg, setImportMsg] = useState("");

  // Hilfsfunktion für CSV Export
  function toCSV(arr) {
    if (!arr.length) return "";
    const header = Object.keys(arr[0]).join(";");
    const rows = arr.map(obj => Object.values(obj).map(v => `"${String(v).replace(/"/g, '""')}"`).join(";"));
    return [header, ...rows].join("\r\n");
  }

  async function exportTable(table) {
    const { data } = await supabase.from(table).select("*");
    if (!data) return;
    const csv = toCSV(data);
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${table}.csv`;
    a.click();
  }

  async function exportAllJSON() {
    const [customers, vouchers, invoices, guides, settings] = await Promise.all([
      supabase.from("customers").select("*"),
      supabase.from("vouchers").select("*"),
      supabase.from("invoices").select("*"),
      supabase.from("guides").select("*"),
      supabase.from("settings").select("*"),
    ]);
    const backup = {
      customers: customers.data || [],
      vouchers: vouchers.data || [],
      invoices: invoices.data || [],
      guides: guides.data || [],
      settings: settings.data || []
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "skeleton-ink-backup.json";
    a.click();
  }

  async function importAllJSON() {
    if (!jsonData) return;
    let data;
    try { data = JSON.parse(jsonData); } catch { setImportMsg("Ungültiges JSON!"); return; }
    if (!window.confirm("Bestehende Daten werden überschrieben. Fortfahren?")) return;
    // Lösche und schreibe alle Tabellen (Achtung: Nur für Demo, nicht für große Datenmengen empfohlen!)
    for (const table of ["customers", "vouchers", "invoices", "guides", "settings"]) {
      await supabase.from(table).delete().neq("id", "");
      if (Array.isArray(data[table])) {
        for (const row of data[table]) {
          await supabase.from(table).insert([row]);
        }
      }
    }
    setImportMsg("Backup erfolgreich importiert!");
  }

  if (user.role !== "admin") {
    return <div className="text-white text-xl">Kein Zugriff.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 text-white">
      <h1 className="text-4xl font-extrabold mb-7">Export & Backup</h1>
      <div className="bg-gray-900 rounded-xl p-6 shadow-lg text-gray-200">
        <div className="mb-4">
          <button className="bg-pink-700 hover:bg-pink-800 px-5 py-2 rounded font-bold mr-3"
            onClick={exportAllJSON}>
            JSON-Backup herunterladen
          </button>
          <button className="bg-blue-700 hover:bg-blue-800 px-5 py-2 rounded font-bold"
            onClick={() => exportTable("customers")}>
            Kunden als CSV
          </button>
          <button className="bg-blue-700 hover:bg-blue-800 px-5 py-2 rounded font-bold ml-2"
            onClick={() => exportTable("invoices")}>
            Rechnungen als CSV
          </button>
          <button className="bg-blue-700 hover:bg-blue-800 px-5 py-2 rounded font-bold ml-2"
            onClick={() => exportTable("vouchers")}>
            Gutscheine als CSV
          </button>
        </div>
        <div className="mt-8">
          <h2 className="font-bold text-lg mb-2">Wiederherstellung aus JSON</h2>
          <textarea className="w-full h-32 p-2 bg-gray-800 text-white rounded mb-2"
            value={jsonData}
            onChange={e => setJsonData(e.target.value)}
            placeholder="Füge hier ein JSON-Backup ein..."
          />
          <button className="bg-green-700 hover:bg-green-800 px-5 py-2 rounded font-bold"
            onClick={importAllJSON}>
            Wiederherstellen
          </button>
          {importMsg && <div className="text-green-400 mt-2">{importMsg}</div>}
        </div>
      </div>
    </div>
  );
}
