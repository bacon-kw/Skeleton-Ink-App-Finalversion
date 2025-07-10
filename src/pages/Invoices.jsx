import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Invoices({ user }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
    // eslint-disable-next-line
  }, []);

  async function loadInvoices() {
    setLoading(true);
    let query = supabase.from("invoices").select("*").order("date", { ascending: false });
    if (user.role === "tattooist") {
      query = query.eq("tattooist", user.username);
    }
    const { data, error } = await query;
    if (!error) setInvoices(data);
    setLoading(false);
  }

  function formatDate(d) {
    if (!d) return "";
    const date = new Date(d);
    return date.toLocaleDateString("de-DE");
  }

  function exportCSV() {
    if (invoices.length === 0) return;
    const header = [
      "Rechnungsnummer",
      "Datum",
      "Tätowierer",
      "Kunde",
      "Tattoo",
      "Stelle",
      "Sitzungen",
      "Betrag",
      "Steuer",
      "Rabatt",
      "Custom-Betrag",
      "Materialkosten",
      "Tätowiererlohn"
    ].join(";");
    const rows = invoices.map(inv =>
      [
        inv.invoiceNumber,
        formatDate(inv.date),
        inv.tattooist,
        inv.customerName,
        inv.tattooName,
        inv.placement,
        inv.sessions,
        inv.amount,
        inv.tax,
        inv.discount || "",
        inv.customAmount || "",
        inv.materialCosts || 500,
        inv.tattooistWage || ""
      ].join(";")
    );
    const csvContent = [header, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rechnungen.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete(id) {
    if (!window.confirm("Willst du diese Rechnung wirklich löschen?")) return;
    await supabase.from("invoices").delete().eq("id", id);
    loadInvoices();
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 text-white">
      <h1 className="text-4xl font-extrabold mb-7 tracking-tight">Rechnungen</h1>
      {user.role === "admin" && (
        <button
          onClick={exportCSV}
          className="mb-5 bg-green-700 hover:bg-green-800 text-white px-5 py-2 rounded font-bold"
        >
          Export als CSV
        </button>
      )}
      {loading ? (
        <div className="text-center py-8 text-gray-400">Lade Rechnungen...</div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-8 text-gray-400">Noch keine Rechnungen.</div>
      ) : (
        <table className="w-full bg-[#101010] text-white rounded-2xl overflow-hidden">
          <thead>
            <tr className="text-gray-400 text-base border-b border-gray-800">
              <th className="py-4 px-4 text-left font-semibold">Nr</th>
              <th className="py-4 px-4 text-left font-semibold">Datum</th>
              <th className="py-4 px-4 text-left font-semibold">Tätowierer</th>
              <th className="py-4 px-4 text-left font-semibold">Kunde</th>
              <th className="py-4 px-4 text-left font-semibold">Tattoo (Stelle)</th>
              <th className="py-4 px-4 text-left font-semibold">Sitzungen</th>
              <th className="py-4 px-4 text-left font-semibold">Betrag (€)</th>
              <th className="py-4 px-4 text-left font-semibold">Rabatt</th>
              <th className="py-4 px-4 text-left font-semibold">Custom</th>
              <th className="py-4 px-4 text-left font-semibold">Material</th>
              <th className="py-4 px-4 text-left font-semibold">Lohn</th>
              <th className="py-4 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id} className="hover:bg-[#18181b] transition">
                <td className="py-4 px-4">{inv.invoiceNumber}</td>
                <td className="py-4 px-4">{formatDate(inv.date)}</td>
                <td className="py-4 px-4">{inv.tattooist}</td>
                <td className="py-4 px-4">{inv.customerName}</td>
                <td className="py-4 px-4">
                  {inv.placement} ({inv.tattooName})
                </td>
                <td className="py-4 px-4">{inv.sessions}</td>
                <td className="py-4 px-4">{Number(inv.amount).toLocaleString("de-DE")} €</td>
                <td className="py-4 px-4">{inv.discount ? `${inv.discount} $` : ""}</td>
                <td className="py-4 px-4">{inv.customAmount ? `${inv.customAmount} $` : ""}</td>
                <td className="py-4 px-4">{inv.materialCosts ? `${inv.materialCosts} $` : "500 $"}</td>
                <td className="py-4 px-4">{inv.tattooistWage ? `${inv.tattooistWage} $` : ""}</td>
                <td className="py-4 px-4 flex gap-2">
                  {/* Kopieren-Button */}
                  <button
                    className="bg-gray-700 hover:bg-gray-800 text-white text-xs rounded px-3 py-1"
                    onClick={() => {
                      const text = `🌙 Midnight Tattoo Rechnung\nRechnungsnummer: ${inv.invoiceNumber}\nDatum: ${formatDate(inv.date)}\nTätowierer: ${inv.tattooist}\nKunde: ${inv.customerName}\nTattoo: ${inv.placement} (${inv.tattooName})\nSitzungen: ${inv.sessions}\nRabatt: ${inv.discount ? inv.discount + " $" : "-"}\nCustom-Betrag: ${inv.customAmount ? inv.customAmount + " $" : "-"}\nMaterialkosten: ${inv.materialCosts ? inv.materialCosts + " $" : "500 $"}\nTätowiererlohn: ${inv.tattooistWage ? inv.tattooistWage + " $" : "-"}\nRechnungsbetrag (inkl. ${inv.tax}% Steuer): ${Number(inv.amount).toLocaleString("de-DE")} €`;
                      navigator.clipboard.writeText(text);
                    }}
                  >
                    Kopieren
                  </button>
                  {/* Löschen nur für Admin */}
                  {user.role === "admin" && (
                    <button
                      className="bg-red-700 hover:bg-red-800 text-white text-xs rounded px-3 py-1"
                      onClick={() => handleDelete(inv.id)}
                    >
                      Löschen
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
