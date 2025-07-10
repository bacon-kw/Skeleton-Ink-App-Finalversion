import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

function formatNumber(num) {
  return Number(num).toLocaleString("de-DE");
}

export default function Dashboard({ user }) {
  const [stats, setStats] = useState({
    revenue: 0,
    customers: 0,
    tattooists: 0,
    wages: [],
    loading: true,
    error: null,
    tax: 19
  });

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line
  }, []);

  async function loadStats() {
    try {
      // Steuersatz laden
      let { data: settingData } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "tax")
        .single();
      let tax = settingData ? Number(settingData.value) : 19;

      // Kunden (nur nicht archiviert)
      let { count: customerCount } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("isArchived", false);

      // Tätowierer zählen
      let { count: tattooistCount } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", "tattooist");

      // Rechnungen (für Umsatz und Tätowiererlohn)
      let invoicesQuery = supabase.from("invoices").select("*");
      if (user.role === "tattooist") {
        invoicesQuery = invoicesQuery.eq("tattooist", user.username);
      }
      let { data: invoices } = await invoicesQuery;

      // Umsatz (inkl. Steuer)
      let revenue = 0;
      let wagesMap = {};
      if (invoices && invoices.length > 0) {
        for (let inv of invoices) {
          let amount = Number(inv.amount) || 0;
          let wage = (Number(inv.sessions) || 0) * 1000;
          revenue += amount;
          // Tätowiererlohn summieren
          wagesMap[inv.tattooist] = (wagesMap[inv.tattooist] || 0) + wage;
        }
      }

      // Admin sieht alle Tätowierer-Löhne, Tätowierer nur seinen eigenen
      let wages = [];
      if (user.role === "admin") {
        wages = Object.entries(wagesMap).map(([tattooist, wage]) => ({
          tattooist,
          wage
        }));
      } else {
        wages = [
          { tattooist: user.username, wage: wagesMap[user.username] || 0 }
        ];
      }

      setStats({
        revenue,
        customers: customerCount || 0,
        tattooists: tattooistCount || 0,
        wages,
        loading: false,
        error: null,
        tax
      });
    } catch (e) {
      setStats(s => ({ ...s, loading: false, error: "Fehler beim Laden der Statistik!" }));
    }
  }

  if (stats.loading) {
    return <div className="text-gray-300 text-lg">Lade Dashboard...</div>;
  }
  if (stats.error) {
    return <div className="text-red-400">{stats.error}</div>;
  }

  return (
    <div className="text-white">
      <h1 className="text-4xl font-extrabold mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
          <div className="text-gray-400 text-sm mb-2">
            Gesamtumsatz (inkl. {stats.tax}% Steuer)
          </div>
          <div className="text-3xl font-bold text-pink-300">{formatNumber(stats.revenue)} €</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
          <div className="text-gray-400 text-sm mb-2">Aktive Kunden</div>
          <div className="text-3xl font-bold text-blue-300">{formatNumber(stats.customers)}</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
          <div className="text-gray-400 text-sm mb-2">Tätowierer</div>
          <div className="text-3xl font-bold text-purple-300">{formatNumber(stats.tattooists)}</div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">
          {user.role === "admin" ? "Tätowierer-Löhne" : "Deine Auszahlung"}
        </h2>
        <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400">
                <th className="py-2">Tätowierer</th>
                <th className="py-2">Lohn (Summe)</th>
              </tr>
            </thead>
            <tbody>
              {stats.wages.length === 0 && (
                <tr>
                  <td colSpan={2} className="text-gray-500 py-4">
                    Noch keine Auszahlungen.
                  </td>
                </tr>
              )}
              {stats.wages.map(w => (
                <tr key={w.tattooist} className="border-t border-gray-800">
                  <td className="py-2 font-bold">{w.tattooist}</td>
                  <td className="py-2">{formatNumber(w.wage)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
