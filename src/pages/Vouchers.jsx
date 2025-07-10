import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { v4 as uuidv4 } from "uuid";

export default function Vouchers({ user }) {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ type: "wert", value: "", sessions: "" });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("vouchers").select("*").order("created_at", { ascending: false });
    setVouchers(data || []);
    setLoading(false);
  }

  async function createVoucher(e) {
    e.preventDefault();
    const code = "SKE-INK-" + Math.random().toString(36).substring(2, 6).toUpperCase();
    await supabase.from("vouchers").insert([{
      id: uuidv4(),
      type: form.type,
      value: form.value ? Number(form.value) : null,
      sessions: form.sessions ? Number(form.sessions) : null,
      code,
      redeemed: false
    }]);
    setForm({ type: "wert", value: "", sessions: "" });
    load();
  }

  async function deleteVoucher(id) {
    if (!window.confirm("Diesen Gutschein wirklich löschen?")) return;
    await supabase.from("vouchers").delete().eq("id", id);
    load();
  }

  async function redeemVoucher(id) {
    await supabase.from("vouchers").update({ redeemed: true }).eq("id", id);
    load();
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 text-white">
      <h1 className="text-4xl font-extrabold mb-7">Gutscheine</h1>
      {user.role === "admin" && (
        <form onSubmit={createVoucher} className="mb-8 space-y-3 bg-gray-800 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <select className="p-2 rounded bg-gray-900 text-white"
              value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="wert">Geldwert</option>
              <option value="sitzung">Sitzungsanzahl</option>
            </select>
            {form.type === "wert" ? (
              <input className="p-2 rounded bg-gray-900 text-white" type="number" min={1} placeholder="Wert (€)"
                value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} required />
            ) : (
              <input className="p-2 rounded bg-gray-900 text-white" type="number" min={1} placeholder="Sitzungen"
                value={form.sessions} onChange={e => setForm({ ...form, sessions: e.target.value })} required />
            )}
            <button className="bg-pink-700 hover:bg-pink-800 px-4 py-2 rounded font-bold" type="submit">
              Erstellen
            </button>
          </div>
        </form>
      )}
      <div className="overflow-x-auto rounded-2xl shadow-lg">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Lade Gutscheine...</div>
        ) : vouchers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">Noch keine Gutscheine.</div>
        ) : (
          <table className="w-full bg-[#101010] text-white rounded-2xl overflow-hidden">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="py-3 px-3">Code</th>
                <th className="py-3 px-3">Typ</th>
                <th className="py-3 px-3">Wert/Sitzungen</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map(v => (
                <tr key={v.id} className="hover:bg-[#18181b]">
                  <td className="py-3 px-3">{v.code}</td>
                  <td className="py-3 px-3">{v.type === "wert" ? "Geldwert" : "Sitzungen"}</td>
                  <td className="py-3 px-3">{v.type === "wert" ? `${v.value} €` : `${v.sessions} Sitzungen`}</td>
                  <td className="py-3 px-3">
                    {v.redeemed
                      ? <span className="text-green-400">Eingelöst</span>
                      : <button className="text-blue-400 underline" onClick={() => redeemVoucher(v.id)}>
                          Einlösen
                        </button>}
                  </td>
                  <td className="py-3 px-3">
                    {user.role === "admin" &&
                      <button className="text-red-400 font-bold px-2" onClick={() => deleteVoucher(v.id)}>
                        🗑
                      </button>}
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
