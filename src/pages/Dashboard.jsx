import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Dashboard({ user }) {
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tattooists, setTattooists] = useState([]);
  const [payout, setPayout] = useState(0);
  const [tax, setTax] = useState(19);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, []);

  async function loadData() {
    setLoading(true);

    // Lade alle Tätowierer (nur zum Zählen)
    const { data: users } = await supabase
      .from("users")
      .select("username")
      .eq("role", "tattooist");
    setTattooists(users || []);

    // Für Admin: alle Daten, für Tättowierer: nur eigene
    let custQuery = supabase.from("customers").select("*").eq("isArchived", false);
    let invQuery = supabase.from("invoices").select("*");
    if (user.role !== "admin") {
      custQuery = custQuery.eq("tattooist", user.username);
      invQuery = invQuery.eq("tattooist", user.username);
    }
    const { data: custs } = await custQuery;
    setCustomers(custs || []);

    const { data: invs } = await invQuery;
    setInvoices(invs || []);

    // Offener Lohn (nur für sich selbst)
    if (user.role !== "admin") {
      const { data: unpaid } = await supabase
        .from("invoices")
        .select("tattooistWage, payoutDone")
        .eq("tattooist", user.username)
        .eq("payoutDone", false);
      const sum = unpaid
        ? unpaid.reduce((acc, i) => acc + (Number(i.tattooistWage) || 0), 0)
        : 0;
      setPayout(sum);
    }

    // Lade Steuersatz (für Anzeige)
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

  function sumInvoiceAmounts() {
    return invoices.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
  }

  function sumTattooistWage(tattooist) {
    // Für Admin: alle Löhne pro Tätowierer
    return invoices
      .filter(i => i.tattooist === tattooist)
      .reduce((acc, i) => acc + (Number(i.tattooistWage) || 0), 0);
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

          {/* Tätowierer-Löhne */}
          {user.role === "admin" ? (
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
                  {tattooists.map(t => {
                    // Offener Lohn für diesen Tätowierer:
                    const open = invoices
                      .filter(i => i.tattooist === t.username && !i.payoutDone)
                      .reduce((acc, i) => acc + (Number(i.tattooistWage) || 0), 0);
                    return (
                      <tr key={t.username} className="border-t border-gray-700">
                        <td className="py-2 px-4">{t.username}</td>
                        <td className="py-2 px-4">{formatCurrency(sumTattooistWage(t.username))}</td>
                        <td className="py-2 px-4">{formatCurrency(open)}</td>
                        <td className="py-2 px-4">
                          {open > 0 && (
                            <button
                              className="bg-green-700 hover:bg-green-800 px-3 py-1 rounded text-white font-semibold"
                              onClick={() => payoutTattooist(t.username)}
                            >
                              Als ausgezahlt markieren
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mb-12">
              <h2 className="text-xl font-semibold mb-4">Dein Lohn</h2>
              <table className="w-full bg-gray-800 rounded-xl mb-6">
                <thead>
                  <tr className="text-gray-400">
                    <th className="py-3 px-4 text-left">Gesamter Lohn</th>
                    <th className="py-3 px-4 text-left">Offener Lohn</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2 px-4">
                      {formatCurrency(sumTattooistWage(user.username))}
                    </td>
                    <td className="py-2 px-4">{formatCurrency(payout)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
