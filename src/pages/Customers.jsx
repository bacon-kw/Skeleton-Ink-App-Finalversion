import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { v4 as uuidv4 } from "uuid";

export default function Customers({ user }) {
  // Standard: alle Felder leer (außer Tätowierer für User ≠ Admin)
  const emptyForm = {
    name: "",
    phone: "",
    placement: "",
    tattooName: "",
    sessions: "",
    doneSessions: "",
    tattooist: user.role === "admin" ? "" : user.username,
    isArchived: false,
    lastSessionDate: null,
    discount: "",
  };
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editCustomer, setEditCustomer] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line
  }, []);

  async function loadCustomers() {
    setLoading(true);
    let query = supabase.from("customers").select("*").order("date", { ascending: false });
    if (user.role !== "admin") {
      query = query.eq("tattooist", user.username);
    }
    const { data, error } = await query;
    if (!error) {
      data.sort((a, b) => {
        if (a.isArchived === b.isArchived) {
          return new Date(b.date || b.created_at) - new Date(a.date || a.created_at);
        }
        return a.isArchived ? 1 : -1;
      });
      setCustomers(data);
    }
    setLoading(false);
  }

  function handleEdit(customer) {
    setEditCustomer(customer);
    setForm({
      name: customer.name,
      phone: customer.phone,
      placement: customer.placement,
      tattooName: customer.tattooName,
      sessions: customer.sessions || "",
      doneSessions: customer.doneSessions || "",
      tattooist: customer.tattooist,
      isArchived: customer.isArchived,
      lastSessionDate: customer.lastSessionDate
        ? new Date(customer.lastSessionDate).toISOString().split("T")[0]
        : null,
      discount: customer.discount === 0 || customer.discount ? customer.discount : "",
    });
  }

  async function getTax() {
    const { data } = await supabase.from("settings").select("value").eq("key", "tax").single();
    return data && data.value ? Number(data.value) : 19;
  }

  async function createInvoiceForCustomer(customer) {
    const { data: existing } = await supabase
      .from("invoices")
      .select("id")
      .eq("customerId", customer.id);
    if (existing && existing.length > 0) return;

    const year = new Date().getFullYear();
    const { data: yearInvoices } = await supabase
      .from("invoices")
      .select("id")
      .gte("date", `${year}-01-01`)
      .lte("date", `${year}-12-31`);
    const invoiceCount = yearInvoices ? yearInvoices.length + 1 : 1;
    const invoiceNumber = `SKE-${year}-${String(invoiceCount).padStart(3, "0")}`;
    const tax = await getTax();
    const sessions = Number(customer.sessions) || 0;
    const discount = customer.discount ? Number(customer.discount) : 0;

    let amountNet = sessions * 1500;
    if (discount > 0) {
      amountNet = amountNet * (1 - discount / 100);
    }
    const materialCosts = sessions * 500;
    const tattooistWage = sessions * 1000;
    const finalAmount = Math.round(amountNet * (1 + tax / 100));

    await supabase.from("invoices").insert([{
      id: uuidv4(),
      invoiceNumber,
      date: new Date(),
      tattooist: customer.tattooist,
      customerName: customer.name,
      tattooName: customer.tattooName,
      placement: customer.placement,
      sessions,
      amount: finalAmount,
      tax,
      discount, // Optional: Discount zur Rechnung speichern
      customerId: customer.id,
      materialCosts: materialCosts,
      tattooistWage: tattooistWage,
      payoutDone: false
    }]);
  }

  async function saveCustomer(e) {
    e.preventDefault();
    const now = new Date();
    if (editCustomer) {
      const { error } = await supabase.from("customers").update({
        ...form,
        sessions: parseInt(form.sessions) || 0,
        doneSessions: parseInt(form.doneSessions) || 0,
        discount: parseInt(form.discount) || 0,
        lastSessionDate: form.lastSessionDate
          ? new Date(form.lastSessionDate)
          : now
      }).eq("id", editCustomer.id);
      if (!error) {
        setEditCustomer(null);
        setForm(emptyForm);
        loadCustomers();
      }
    } else {
      const id = uuidv4();
      const { error } = await supabase.from("customers").insert([{
        id,
        ...form,
        sessions: parseInt(form.sessions) || 0,
        doneSessions: parseInt(form.doneSessions) || 0,
        discount: parseInt(form.discount) || 0,
        date: now,
        isArchived: false,
        lastSessionDate: now
      }]);
      if (!error) {
        const customerObj = {
          ...form,
          id,
          sessions: parseInt(form.sessions) || 0,
          discount: parseInt(form.discount) || 0,
          tattooist: form.tattooist,
          name: form.name,
          tattooName: form.tattooName,
          placement: form.placement
        };
        await createInvoiceForCustomer(customerObj);

        setForm(emptyForm);
        loadCustomers();
      }
    }
  }

  async function deleteCustomer(id) {
    if (!window.confirm("Diesen Kunden wirklich löschen?")) return;
    await supabase.from("customers").delete().eq("id", id);
    loadCustomers();
  }

  async function toggleArchive(customer) {
    await supabase.from("customers").update({ isArchived: !customer.isArchived }).eq("id", customer.id);
    loadCustomers();
  }

  function formatDate(d) {
    if (!d) return "";
    const date = new Date(d);
    return date.toLocaleDateString("de-DE");
  }

  function isHighlight(c) {
    if (!c.lastSessionDate) return false;
    const last = new Date(c.lastSessionDate);
    const now = new Date();
    const days = (now - last) / (1000 * 60 * 60 * 24);
    return days >= 2 && c.doneSessions < c.sessions && !c.isArchived;
  }

  return (
    <div className="max-w-5xl mx-auto mt-10 text-white">
      <h1 className="text-4xl font-extrabold mb-7 tracking-tight">Kunden</h1>
      {/* Kundenformular */}
      <form onSubmit={saveCustomer} className="mb-8 space-y-3 bg-gray-800 p-4 rounded-xl max-w-2xl">
        <div className="flex flex-wrap gap-3">
          <input
            className="flex-1 p-3 rounded bg-gray-900 text-white"
            placeholder="Name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="flex-1 p-3 rounded bg-gray-900 text-white"
            placeholder="Telefon"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            required
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            className="flex-1 p-3 rounded bg-gray-900 text-white"
            placeholder="Tattoo"
            value={form.tattooName}
            onChange={e => setForm({ ...form, tattooName: e.target.value })}
            required
          />
          <input
            className="flex-1 p-3 rounded bg-gray-900 text-white"
            placeholder="Tattoo-Stelle"
            value={form.placement}
            onChange={e => setForm({ ...form, placement: e.target.value })}
            required
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            className="flex-1 p-3 rounded bg-gray-900 text-white"
            type="number"
            min={1}
            max={4}
            placeholder="Sitzungen"
            value={form.sessions}
            onChange={e => setForm({ ...form, sessions: e.target.value })}
            required
          />
          <input
            className="flex-1 p-3 rounded bg-gray-900 text-white"
            type="number"
            min={0}
            max={4}
            placeholder="Bisherige Sitzungen"
            value={form.doneSessions}
            onChange={e => setForm({ ...form, doneSessions: e.target.value })}
            required
          />
          <input
            className="flex-1 p-3 rounded bg-gray-900 text-white"
            type="number"
            min={0}
            max={100}
            placeholder="Rabatt (%)"
            value={form.discount}
            onChange={e => setForm({ ...form, discount: e.target.value })}
          />
        </div>
        {user.role === "admin" && (
          <input
            className="w-full p-3 rounded bg-gray-900 text-white"
            placeholder="Tätowierer (z.B. bacon)"
            value={form.tattooist}
            onChange={e => setForm({ ...form, tattooist: e.target.value })}
            required
          />
        )}
        {editCustomer && (
          <input
            className="w-full p-3 rounded bg-gray-900 text-white"
            type="date"
            placeholder="Letzte Session (Datum)"
            value={form.lastSessionDate || ""}
            onChange={e => setForm({ ...form, lastSessionDate: e.target.value })}
          />
        )}
        <button
          type="submit"
          className="bg-pink-700 hover:bg-pink-800 text-white px-5 py-2 rounded font-bold"
        >
          {editCustomer ? "Ändern" : "Speichern"}
        </button>
        {editCustomer && (
          <button
            type="button"
            onClick={() => { setEditCustomer(null); setForm(emptyForm); }}
            className="ml-3 text-gray-400 underline"
          >
            Abbrechen
          </button>
        )}
      </form>

      {/* Kundenliste */}
      <div className="overflow-x-auto rounded-2xl shadow-lg">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Lade Kunden...</div>
        ) : customers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">Noch keine Kunden.</div>
        ) : (
          <table className="w-full bg-[#101010] text-white rounded-2xl overflow-hidden">
            <thead>
              <tr className="text-gray-400 text-base border-b border-gray-800">
                <th className="py-4 px-4 text-left font-semibold">Name</th>
                <th className="py-4 px-4 text-left font-semibold">Telefon</th>
                <th className="py-4 px-4 text-left font-semibold">Tätowierer</th>
                <th className="py-4 px-4 text-left font-semibold">Tattoo</th>
                <th className="py-4 px-4 text-left font-semibold">Stelle</th>
                <th className="py-4 px-4 text-left font-semibold">Sitzungen</th>
                <th className="py-4 px-4 text-left font-semibold">Bisherige</th>
                <th className="py-4 px-4 text-left font-semibold">Rabatt (%)</th>
                <th className="py-4 px-4 text-left font-semibold">Letzte Session</th>
                <th className="py-4 px-4 text-left font-semibold">Archiviert</th>
                <th className="py-4 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id} className={`transition ${isHighlight(c) ? "bg-green-950" : "hover:bg-[#18181b]"} ${c.isArchived ? "opacity-70" : ""}`}>
                  <td className="py-4 px-4">{c.name}</td>
                  <td className="py-4 px-4">{c.phone}</td>
                  <td className="py-4 px-4">{c.tattooist}</td>
                  <td className="py-4 px-4">{c.tattooName}</td>
                  <td className="py-4 px-4">{c.placement}</td>
                  <td className="py-4 px-4">{c.sessions}</td>
                  <td className="py-4 px-4">{c.doneSessions}</td>
                  <td className="py-4 px-4">{c.discount || 0}</td>
                  <td className="py-4 px-4">{formatDate(c.lastSessionDate)}</td>
                  <td className="py-4 px-4">
                    <button
                      className={`text-xs px-2 py-1 rounded-full ${c.isArchived ? "bg-yellow-700" : "bg-green-700"} text-white`}
                      onClick={() => toggleArchive(c)}
                    >
                      {c.isArchived ? "Archiviert" : "Aktiv"}
                    </button>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      className="text-blue-400 font-bold px-2"
                      onClick={() => handleEdit(c)}
                    >
                      ✏️
                    </button>
                    <button
                      className="text-red-400 font-bold px-2"
                      onClick={() => deleteCustomer(c.id)}
                    >
                      🗑
                    </button>
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
