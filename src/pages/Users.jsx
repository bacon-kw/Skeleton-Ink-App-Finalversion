import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { v4 as uuidv4 } from "uuid";

const COLORS = ["gray", "red", "blue", "pink", "green", "purple", "orange"];

export default function Users({ user }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: "", password: "", role: "tattooist", color: "gray" });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("users").select("*");
    setUsers(data || []);
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editId) {
      // Update
      await supabase.from("users").update(form).eq("id", editId);
      setEditId(null);
    } else {
      // Insert
      await supabase.from("users").insert([{ id: uuidv4(), ...form }]);
    }
    setForm({ username: "", password: "", role: "tattooist", color: "gray" });
    load();
  }

  async function handleEdit(u) {
    setEditId(u.id);
    setForm({
      username: u.username,
      password: u.password,
      role: u.role,
      color: u.color
    });
  }

  async function deleteUser(id) {
    if (!window.confirm("Diesen Benutzer wirklich löschen?")) return;
    await supabase.from("users").delete().eq("id", id);
    load();
  }

  function handleCancelEdit() {
    setEditId(null);
    setForm({ username: "", password: "", role: "tattooist", color: "gray" });
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 text-white">
      <h1 className="text-4xl font-extrabold mb-7">Benutzerverwaltung</h1>
      <form className="mb-8 flex flex-wrap gap-3 bg-gray-800 p-4 rounded-xl" onSubmit={handleSubmit}>
        <input className="flex-1 p-2 rounded bg-gray-900 text-white" placeholder="Benutzername"
          value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
        <input className="flex-1 p-2 rounded bg-gray-900 text-white" placeholder="Passwort"
          value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
        <select className="p-2 rounded bg-gray-900 text-white"
          value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
          <option value="tattooist">Tätowierer</option>
          <option value="admin">Admin</option>
        </select>
        <select className="p-2 rounded bg-gray-900 text-white"
          value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}>
          {COLORS.map(c => <option value={c} key={c}>{c}</option>)}
        </select>
        <button className="bg-pink-700 hover:bg-pink-800 px-4 py-2 rounded font-bold" type="submit">
          {editId ? "Aktualisieren" : "Benutzer anlegen"}
        </button>
        {editId && (
          <button className="ml-2 text-gray-400 underline" type="button" onClick={handleCancelEdit}>
            Abbrechen
          </button>
        )}
      </form>
      <div className="overflow-x-auto rounded-2xl shadow-lg">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Lade Benutzer...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-gray-400">Keine Benutzer.</div>
        ) : (
          <table className="w-full bg-[#101010] text-white rounded-2xl overflow-hidden">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="py-3 px-3">Benutzername</th>
                <th className="py-3 px-3">Rolle</th>
                <th className="py-3 px-3">Farbe</th>
                <th className="py-3 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="hover:bg-[#18181b]">
                  <td className="py-3 px-3">{u.username}</td>
                  <td className="py-3 px-3">{u.role}</td>
                  <td className="py-3 px-3">{u.color}</td>
                  <td className="py-3 px-3">
                    <button className="text-blue-400 font-bold px-2" onClick={() => handleEdit(u)}>
                      ✏️
                    </button>
                    <button className="text-red-400 font-bold px-2" onClick={() => deleteUser(u.id)}>
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
