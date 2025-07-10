import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Invoices({ user }) {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  async function load() {
    let query = supabase.from("invoices").select("*").order("date", { ascending: false });
    if (user.role !== "admin") {
      query = query.eq("tattooist", user.username);
    }
    const { data } = await query;
    setInvoices(data || []);
  }

  async function deleteInvoice(id) {
    if (!window.confirm("Diese Rechnung wirklich löschen?")) return;
    await supabase.from("invoices").delete().eq("id", id);
    load();
  }

  function formatCurrency(n) {
    return Number(n).toLocaleString("de-DE") + " €";
  }

  return (
    <div className="max-w-5xl mx-auto mt-10 text-white">
      <h1 className="text-4xl font-extrabold mb-7 tracking-tight">Rechnungen</h1>
      <div className="overflow-x-auto rounded-2xl shadow-lg">
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-gray-400">Noch keine Rechnungen.</div>
        ) : (
          <table className="w-full bg-[#101010] text-white rounded-2xl overflow-hidden">
            <thead>
              <tr className="text-gray-400 text-base border-b border-gray-800">
                <th className="py-4 px-4 text-left font-semibold">Rechnungsnr.</th>
                <th className="py-4 px-4 text-left font-semibold">Datum</th>
                <th className="py-4 px-4 text-left font-semibold">Tätowierer</th>
                <th className="py-4 px-4 text-left font-semibold">Kunde</th>
                <th className="py-4 px-4 text-left font-semibold">Tattoo</th>
                <th className="py-4 px-4 text-left font-semibold">Sitzungen</th>
                <th className="py-4 px-4 text-left font-semibold">Betrag</th>
                {user.role === "admin" && (
                  <th className="py-4 px-4"></th>
                )}
              </tr>
            </thead>
            <tbody>
              {invoices.map(i => (
                <tr key={i.id}>
                  <td className="py-4 px-4">{i.invoiceNumber}</td>
                  <td className="py-4 px-4">{new Date(i.date).toLocaleDateString("de-DE")}</td>
                  <td className="py-4 px-4">{i.tattooist}</td>
                  <td className="py-4 px-4">{i.customerName}</td>
                  <td className="py-4 px-4">{i.tattooName}</td>
                  <td className="py-4 px-4">{i.sessions}</td>
                  <td className="py-4 px-4">{formatCurrency(i.amount)}</td>
                  {user.role === "admin" && (
                    <td className="py-4 px-4">
                      <button className="text-red-400 font-bold px-2" onClick={() => deleteInvoice(i.id)}>🗑</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
