import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Dashboard({ user }) {
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tattooists, setTattooists] = useState([]);
  const [payouts, setPayouts] = useState({});
  const [tax, setTax] = useState(19);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, []);

  async function loadData() {
    setLoading(true);

    // Lade Kunden
    const { data: custs } = await supabase
      .from("customers")
      .select("*")
      .eq("isArchived", false);
    setCustomers(custs || []);

    // Lade Rechnungen
    const { data: invs } = await supabase.from("invoices").select("*");
    setInvoices(invs || []);

    // Lade alle Tätowierer
    const { data: users } = await supabase
      .from("users")
      .select("*")
      .eq("role", "tattooist")
      .order("order", { ascending: true });
    setTattooists(users || []);

    // Lade offenen Lohn pro Tätowierer (nur offene, nicht ausgezahlte Rechnungen)
    const { data: unpaid } = await supabase
      .from("invoices")
      .select("tattooist, tattooistWage, payoutDone")
      .eq("payoutDone", false);
    const sums = {};
    unpaid?.forEach(inv => {
      if (!sums[inv.tattooist]) sums[inv.tattooist] = 0;
      sums[inv.tattooist] += inv.tattooistWage || 0;
    });
    setPayouts(sums);

    // Lade Steuersatz
    const { data: taxData } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "tax")
      .single();
    setTax(taxData?.value ? Number(taxData.value) : 19);

    setLoading(false);
  }

  async function handleTaxChange(e) {
    const newTax = Number(e.target.value);
    await supabase
      .from("settings")
      .update({ value: newTax })
      .eq("key", "tax");
    setTax(newTax);
    loadData();
  }

  async function payoutTattooist(tattooist) {
    if (!window.confirm(`Alle offenen Auszahlungen für ${tattooist} wirklich als "ausgezahlt" markieren?`)) return;
    await supabase
      .from("invoices")
      .update({ payoutDone: true })
      .eq("tattooist", tattooist)
      .eq("payoutDone", false);
    await loadData();
  }

  // Hilfsfunktionen
  function sumInvoiceAmounts() {
    return invoices.reduce((acc, i) => acc + (i.amount || 0), 0);
  }

  function sumTattooistWage(tattooist) {
    // Gesamtlohn (inkl. ausgezahlter)
    return invoices
      .filter(i => i.tattooist === tattooist)
      .reduce((acc, i) => acc + (i.tattooistWage || 0), 0);
  }

  function formatCurrency(n) {
    return Number(n).toLocaleString("de-DE") + " €";
  }

  return (
    <div className="max-w-5xl mx-auto mt-10 text-white">
      <h1 className="text-4xl font-extrabold mb-7 tracking-tight">Dashboard</h1>
      {loading ? (
        <div className="text-center py-8 text-gray-400">Lade Daten...</div>
      ) : (
        <>
          {/* Admin: Steuer setzen */}
          {user.role === "admin" && (
            <div className="mb-8 flex items-center gap-3">
              <span className="text-lg font-semibold">Steuersatz:</span>
              <select
                value={tax}
                onChange={handleTaxChange}
                className="bg-gray-900 p-2 rounded text-white"
              >
                {[5, 10, 15, 20, 25].map(t => (
                  <option value={t} key={t}>
                    {t} %
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Überblick */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <div className="bg-gray-800 p-7 rounded-xl shadow-lg flex flex-col items-center">
              <div className="text-2xl font-bold mb-2">Gesamtumsatz</div>
              <div className="text-4xl font-black">{formatCurrency(sumInvoiceAmounts())}</div>
            </div>
            <div className="bg-gray-800 p-7 rounded-xl shadow-lg flex flex-col items-center">
              <div className="text-2xl font-bold mb-2">Aktive Kunden</div>
              <div className="text-4xl font-black">{customers.length}</div>
            </div>
            <div className="bg-gray-800 p-7 rounded-xl shadow-lg flex flex-col items-center">
              <div className="text-2xl font-bold mb-2">Tätowierer</div>
              <div className="text-4xl font-black">{tattooists.length}</div>
            </div>
          </div>

          {/* Tätowierer-Löhne + Auszahlung */}
          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Löhne aller Tätowierer</h2>
            <table className="w-full bg-gray-800 rounded-xl mb-6">
              <thead>
                <tr className="text-gray-400">
                  <th className="py-3 px-4 text-left">Tätowierer</th>
                  <th className="py-3 px-4 text-left">Gesamter Lohn</th>
                  <th className="py-3 px-4 text-left">Offener Lohn</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {tattooists.map(t => (
                  <tr key={t.username} className="border-t border-gray-700">
                    <td className="py-2 px-4">{t.username}</td>
                    <td className="py-2 px-4">{formatCurrency(sumTattooistWage(t.username))}</td>
                    <td className="py-2 px-4">
                      {formatCurrency(payouts[t.username] || 0)}
                    </td>
                    <td className="py-2 px-4">
                      {user.role === "admin" && (payouts[t.username] || 0) > 0 && (
                        <button
                          className="bg-green-700 hover:bg-green-800 px-3 py-1 rounded text-white font-semibold"
                          onClick={() => payoutTattooist(t.username)}
                        >
                          Als ausgezahlt markieren
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
