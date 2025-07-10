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

  async function handleDelete(id) {
    if (!window.confirm("Willst du diese Rechnung wirklich löschen?")) return;
    await supabase.from("invoices").delete().eq("id", id);
    loadInvoices();
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 text-white">
      <h1 className="text-4xl font-extrabold mb-7 tracking-tight">Rechnungen</h1>
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
              <th className="py-4 px-4 text-left font-semibold">Lohn</th>
              <th className="py-4 px-4 text-left font-semibold">Ausgezahlt</th>
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
                <td className="py-4 px-4">{inv.tattooistWage ? `${inv.tattooistWage} $` : ""}</td>
                <td className="py-4 px-4">
                  {inv.payoutDone ? (
                    <span className="bg-green-900 text-green-400 px-2 py-1 rounded text-xs">JA</span>
                  ) : (
                    <span className="bg-yellow-900 text-yellow-400 px-2 py-1 rounded text-xs">NEIN</span>
                  )}
                </td>
                <td className="py-4 px-4 flex gap-2">
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
