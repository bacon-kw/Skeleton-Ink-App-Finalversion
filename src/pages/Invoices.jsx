import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { v4 as uuidv4 } from "uuid";

export default function Invoices({ user }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [tax, setTax] = useState(19);

  const [form, setForm] = useState({
    tattooist: "",
    customerName: "",
    tattooName: "",
    placement: "",
    sessions: 1,
    amount: "",
    tax: 19,
    date: new Date().toISOString().split("T")[0]
  });

  useEffect(() => {
    loadInvoices();
    loadUsers();
    loadTax();
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

  async function loadUsers() {
    const { data } = await supabase.from("users").select("username,role");
    if (data) setUsers(data);
  }

  async function loadTax() {
    const { data } = await supabase.from("settings").select("value").eq("key", "tax").single();
    setTax(data && data.value ? Number(data.value) : 19);
    setForm(f => ({ ...f, tax: data && data.value ? Number(data.value) : 19 }));
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

  async function handleAddInvoice(e) {
    e.preventDefault();
    // Rechnungsnummer generieren
    const year = new Date().getFullYear();
    const { data: yearInvoices } = await supabase
      .from("invoices")
      .select("id")
      .gte("date", `${year}-01-01`)
      .lte("date", `${year}-12-31`);
    const invoiceCount = yearInvoices ? yearInvoices.length + 1 : 1;
    const invoiceNumber = `SKE-${year}-${String(invoiceCount).padStart(3, "0")}`;

    await supabase.from("invoices").insert([{
      id: uuidv4(),
      invoiceNumber,
      date: new Date(form.date),
      tattooist: form.tattooist,
      customerName: form.customerName,
      tattooName: form.tattooName,
      placement: form.placement,
      sessions: Number(form.sessions),
      amount: Number(form.amount),
      tax: Number(form.tax),
      materialCosts: Number(form.sessions) * 500,
      tattooistWage: (form.tattooist === "Studio" ? 0 : Number(form.sessions) * 1000),
      payoutDone: false,
      isStudio: form.tattooist === "Studio",
      customerId: null
    }]);
    setShowModal(false);
    setForm({
      tattooist: "",
      customerName: "",
      tattooName: "",
      placement: "",
      sessions: 1,
      amount: "",
      tax: tax,
      date: new Date().toISOString().split("T")[0]
    });
    loadInvoices();
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 text-white">
      <h1 className="text-4xl font-extrabold mb-7 tracking-tight">Rechnungen</h1>

      {user.role === "admin" && (
        <button
          className="mb-6 bg-pink-700 hover:bg-pink-800 px-4 py-2 rounded font-bold"
          onClick={() => setShowModal(true)}
        >
          + Individuelle Rechnung anlegen
        </button>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
          <form
            className="bg-[#18181b] p-8 rounded-2xl shadow-2xl w-full max-w-lg space-y-4 relative"
            onSubmit={handleAddInvoice}
          >
            <button
              type="button"
              className="absolute top-2 right-3 text-gray-400 text-xl"
              onClick={() => setShowModal(false)}
            >✕</button>
            <h2 className="text-2xl font-bold mb-3">Individuelle Rechnung anlegen</h2>
            <select
              className="w-full p-2 rounded bg-gray-900 text-white"
              value={form.tattooist}
              onChange={e => setForm(f => ({ ...f, tattooist: e.target.value }))}
              required
            >
              <option value="">Tätowierer auswählen</option>
              {users
                .filter(u => u.role === "tattooist")
                .map(u => (
                  <option key={u.username} value={u.username}>{u.username}</option>
                ))}
              <option value="Studio">Studio</option>
            </select>
            <input
              className="w-full p-2 rounded bg-gray-900 text-white"
              placeholder="Kunde"
              value={form.customerName}
              onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
              required
            />
            <input
              className="w-full p-2 rounded bg-gray-900 text-white"
              placeholder="Tattoo"
              value={form.tattooName}
              onChange={e => setForm(f => ({ ...f, tattooName: e.target.value }))}
              required
            />
            <input
              className="w-full p-2 rounded bg-gray-900 text-white"
              placeholder="Tattoo-Stelle"
              value={form.placement}
              onChange={e => setForm(f => ({ ...f, placement: e.target.value }))}
              required
            />
            <input
              className="w-full p-2 rounded bg-gray-900 text-white"
              type="number"
              min={1}
              max={4}
              placeholder="Sitzungen"
              value={form.sessions}
              onChange={e => setForm(f => ({ ...f, sessions: e.target.value }))}
              required
            />
            <input
              className="w-full p-2 rounded bg-gray-900 text-white"
              type="number"
              min={0}
              placeholder="Betrag (inkl. Steuer) in $"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              required
            />
            <select
              className="w-full p-2 rounded bg-gray-900 text-white"
              value={form.tax}
              onChange={e => setForm(f => ({ ...f, tax: e.target.value }))}
              required
            >
              {[5, 10, 15, 20, 25].map(v => (
                <option value={v} key={v}>{v}% Steuer</option>
              ))}
            </select>
            <input
              className="w-full p-2 rounded bg-gray-900 text-white"
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              required
            />
            <button className="bg-pink-700 hover:bg-pink-800 text-white px-5 py-2 rounded font-bold" type="submit">
              Rechnung speichern
            </button>
          </form>
        </div>
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
