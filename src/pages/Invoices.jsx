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
    if (user.role !== "admin") {
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

  function invoiceText(inv) {
    return `💀 Skeleton Ink Rechnung
Rechnungsnummer: ${inv.invoiceNumber}
Datum: ${formatDate(inv.date)}
Tätowierer: ${inv.tattooist}
Kunde: ${inv.customerName}
Tattoo: ${inv.placement} (${inv.tattooName})
Sitzungen: ${inv.sessions}

Rechnungsbetrag (inkl. ${inv.tax}% Steuer): ${Number(inv.amount).toLocaleString("de-DE")} $`;
  }

  async function copyInvoiceText(text) {
    try {
      await navigator.clipboard.writeText(text);
      alert("Rechnungstext kopiert!");
    } catch (err) {
      alert("Kopieren fehlgeschlagen: " + err);
    }
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
              <th className="py-4 px-4 text-left font-semibold">Betrag ($)</th>
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
                <td className="py-4 px-4">{inv.placement} ({inv.tattooName})</td>
                <td className="py-4 px-4">{inv.sessions}</td>
                <td className="py-4 px-4">{Number(inv.amount).toLocaleString("de-DE")} $</td>
                <td className="py-4 px-4 flex flex-col gap-2">
                  <pre
                    className="bg-gray-900 text-xs p-2 rounded mb-2 whitespace-pre-line break-words"
                    style={{ maxWidth: 250, fontFamily: "inherit" }}
                  >{invoiceText(inv)}</pre>
                  <button
                    onClick={() => copyInvoiceText(invoiceText(inv))}
                    className="bg-pink-700 hover:bg-pink-800 text-white text-xs rounded px-3 py-1"
                  >
                    Kopieren
                  </button>
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
