import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Dashboard({ user }) {
  const [tattooists, setTattooists] = useState([]);
  const [payouts, setPayouts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayouts();
    // eslint-disable-next-line
  }, []);

  async function loadPayouts() {
    setLoading(true);
    // Alle offenen Rechnungen laden
    const { data, error } = await supabase
      .from("invoices")
      .select("tattooist, tattooistWage, payoutDone")
      .eq("payoutDone", false);
    if (!error) {
      // Gruppieren nach Tätowierer
      const sums = {};
      data.forEach(inv => {
        if (!sums[inv.tattooist]) sums[inv.tattooist] = 0;
        sums[inv.tattooist] += inv.tattooistWage || 0;
      });
      setPayouts(sums);
    }
    setLoading(false);
  }

  async function payoutTattooist(tattooist) {
    if (!window.confirm(`Alle offenen Auszahlungen für ${tattooist} wirklich als "ausgezahlt" markieren?`)) return;
    // Setze alle offenen Rechnungen für diesen Tätowierer auf ausgezahlt
    await supabase
      .from("invoices")
      .update({ payoutDone: true })
      .eq("tattooist", tattooist)
      .eq("payoutDone", false);
    await loadPayouts();
  }

  // ... weitere Dashboard-Logik

  return (
    <div className="max-w-4xl mx-auto mt-10 text-white">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <h2 className="text-xl font-semibold mb-4">Offene Auszahlungen</h2>
      {loading ? (
        <div className="text-gray-400">Lade...</div>
      ) : (
        <table className="w-full bg-gray-800 rounded-xl mb-6">
          <thead>
            <tr className="text-gray-400">
              <th className="py-3 px-4 text-left">Tätowierer</th>
              <th className="py-3 px-4 text-left">Offener Lohn</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(payouts).map(t => (
              <tr key={t} className="border-t border-gray-700">
                <td className="py-2 px-4">{t}</td>
                <td className="py-2 px-4">{payouts[t]} $</td>
                <td className="py-2 px-4">
                  {user.role === "admin" && payouts[t] > 0 && (
                    <button
                      className="bg-green-700 hover:bg-green-800 px-3 py-1 rounded text-white font-semibold"
                      onClick={() => payoutTattooist(t)}
                    >
                      Als ausgezahlt markieren
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* ... weitere Dashboard-Bereiche */}
    </div>
  );
}
