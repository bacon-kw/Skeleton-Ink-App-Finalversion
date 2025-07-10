import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { v4 as uuidv4 } from "uuid";

export default function Invoices({ user }) {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [tattooists, setTattooists] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    tattooist: "",
    customerName: "",
    tattooName: "",
    placement: "",
    sessions: 1,
    amount: 0,
    tax: 19,
    date: new Date().toISOString().split("T")[0],
    customText: "",
    studio: false,
  });

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  async function load() {
    // Alle Rechnungen laden
    let query = supabase.from("invoices").select("*").order("date", { ascending: false });
    if (user.role !== "admin") {
      query = query.eq("tattooist", user.username);
    }
    const { data: invoicesData } = await query;
    setInvoices(invoicesData || []);

    // Kunden für die Auswahl
    const { data: customersData } = await supabase.from("customers").select("*");
    setCustomers(customersData || []);

    // Tätowierer-Liste
    const { data: usersData } = await supabase
      .from("users")
      .select("username")
      .eq("role", "tattooist");
    setTattooists(usersData || []);
  }

  async function getTax() {
    const { data } = await supabase.from("settings").select("value").eq("key", "tax").single();
    return data && data.value ? Number(data.value) : 19;
  }

  async function handleSave(e) {
    e.preventDefault();
    // Falls Studio ausgewählt: kein Tätowierer-Lohn, Material = 0, sessions optional
    const tax = await getTax();
    const year = new Date().getFullYear();
    const { data: yearInvoices } = await supabase
      .from("invoices")
      .select("id")
      .gte("date", `${year}-01-01`)
      .lte("date", `${year}-12-31`);
    const invoiceCount = yearInvoices ? yearInvoices.length + 1 : 1;
    const invoiceNumber = `SKE-${year}-${String(invoiceCount).padStart(3, "0")}`;

    let tattooist = form.tattooist;
    let isStudio = tattooist === "Studio";
    let sessions = Number(form.sessions) || 1;
    let amount = Number(form.amount);
    let tattooistWage = isStudio ? 0 : sessions * 1000;
    let materialCosts = isStudio ? 0 : sessions * 500;

    // Optional Text, TattooName etc.
    let textBlock = form.customText || "";

    // Falls Kunde ausgewählt, Text übernehmen
    const customer = customers.find(c => c.name === form.customerName);

    await supabase.from("invoices").insert([{
      id: uuidv4(),
      invoiceNumber,
      date: form.date ? new Date(form.date) : new Date(),
      tattooist: isStudio ? null : tattooist,
      customerName: form.customerName,
      tattooName: form.tattooName,
      placement: form.placement,
      sessions: sessions,
      amount: amount,
      tax: tax,
      materialCosts: materialCosts,
      tattooistWage: tattooistWage,
      payoutDone: false,
      customText: textBlock,
      isStudio: isStudio
    }]);
    setFormOpen(false);
    setForm({
      tattooist: "",
      customerName: "",
      tattooName: "",
      placement: "",
      sessions: 1,
      amount: 0,
      tax: 19,
      date: new Date().toISOString().split("T")[0],
      customText: "",
      studio: false,
    });
    load();
  }

  function formatCurrency(n) {
    return Number(n).toLocaleString("de-DE") + " €";
  }

  return (
    <div className="max-w-5xl mx-auto mt-10 text-white">
      <h1 className="text-4xl font-extrabold mb-7 tracking-tight">Rechnungen</h1>
      {user.role === "admin" && (
        <button
          className="mb-7 bg-pink-700 hover:bg-pink-800 px-5 py-2 rounded font-bold"
          onClick={() => setFormOpen(true)}
        >
          Eigene Rechnung erstellen
        </button>
      )}

      {/* Modal */}
      {formOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <form
            onSubmit={handleSave}
            className="bg-[#18181b] p-7 rounded-2xl shadow-xl w-[380px] space-y-4 relative"
            style={{ minWidth: 340 }}
          >
            <button
              className="absolute top-3 right-4 text-xl text-gray-400"
              onClick={() => setFormOpen(false)}
              type="button"
            >✕</button>
            <h2 className="text-xl font-bold mb-4">Rechnung anlegen</h2>
            <div>
              <label className="font-semibold">Tätowierer oder Studio:</label>
              <select
                className="w-full mt-1 p-2 rounded bg-gray-900 text-white"
                value={form.tattooist}
                onChange={e => setForm({ ...form, tattooist: e.target.value })}
                required
              >
                <option value="">Auswählen...</option>
                <option value="Studio">Studio</option>
                {tattooists.map(t => (
                  <option key={t.username} value={t.username}>{t.username}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold">Kunde:</label>
              <input
                className="w-full mt-1 p-2 rounded bg-gray-900 text-white"
                value={form.customerName}
                onChange={e => setForm({ ...form, customerName: e.target.value })}
                placeholder="Name des Kunden"
              />
            </div>
            <div>
              <label className="font-semibold">Tattoo</label>
              <input
                className="w-full mt-1 p-2 rounded bg-gray-900 text-white"
                value={form.tattooName}
                onChange={e => setForm({ ...form, tattooName: e.target.value })}
                placeholder="Tattoo-Bezeichnung"
              />
            </div>
            <div>
              <label className="font-semibold">Stelle</label>
              <input
                className="w-full mt-1 p-2 rounded bg-gray-900 text-white"
                value={form.placement}
                onChange={e => setForm({ ...form, placement: e.target.value })}
                placeholder="Tattoo-Stelle"
              />
            </div>
            <div>
              <label className="font-semibold">Sitzungen</label>
              <input
                className="w-full mt-1 p-2 rounded bg-gray-900 text-white"
                type="number"
                min={1}
                value={form.sessions}
                onChange={e => setForm({ ...form, sessions: e.target.value })}
              />
            </div>
            <div>
              <label className="font-semibold">Betrag (€ inkl. Steuer)</label>
              <input
                className="w-full mt-1 p-2 rounded bg-gray-900 text-white"
                type="number"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="font-semibold">Datum</label>
              <input
                type="date"
                className="w-full mt-1 p-2 rounded bg-gray-900 text-white"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="font-semibold">Freitext (optional)</label>
              <textarea
                className="w-full mt-1 p-2 rounded bg-gray-900 text-white"
                value={form.customText}
                onChange={e => setForm({ ...form, customText: e.target.value })}
                placeholder="Rechnungstext, z.B. für Studio-Einzahlung, Kommentar etc."
              />
            </div>
            <button className="bg-pink-700 hover:bg-pink-800 px-4 py-2 rounded font-bold w-full mt-2" type="submit">
              Speichern
            </button>
          </form>
        </div>
      )}

      {/* Rechnungsübersicht */}
      <div className="overflow-x-auto rounded-2xl shadow-lg">
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-gray-400">Noch keine Rechnungen.</div>
        ) : (
          <table className="w-full bg-[#101010] text-white rounded-2xl overflow-hidden">
            <thead>
              <tr className="text-gray-400 text-base border-b border-gray-800">
                <th className="py-4 px-4">Rechnungsnummer</th>
                <th className="py-4 px-4">Datum</th>
                <th className="py-4 px-4">Tätowierer/Studio</th>
                <th className="py-4 px-4">Kunde</th>
                <th className="py-4 px-4">Tattoo</th>
                <th className="py-4 px-4">Betrag</th>
                <th className="py-4 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td className="py-4 px-4">{inv.invoiceNumber}</td>
                  <td className="py-4 px-4">{inv.date ? new Date(inv.date).toLocaleDateString("de-DE") : ""}</td>
                  <td className="py-4 px-4">{inv.isStudio ? "Studio" : inv.tattooist}</td>
                  <td className="py-4 px-4">{inv.customerName}</td>
                  <td className="py-4 px-4">{inv.tattooName}</td>
                  <td className="py-4 px-4">{formatCurrency(inv.amount)}</td>
                  <td className="py-4 px-4">
                    {/* Du kannst hier weitere Buttons wie Kopieren/Löschen ergänzen */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
