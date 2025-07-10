import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { v4 as uuidv4 } from "uuid";

export default function UserManagement({ user }) {
  const [users, setUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "tattooist",
    color: "gray"
  });

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line
  }, []);

  async function loadUsers() {
    const { data } = await supabase
      .from("users")
      .select("*")
      .order("order", { ascending: true });
    setUsers(data || []);
  }

  async function saveUser(e) {
    e.preventDefault();
    if (editUser) {
      await supabase
        .from("users")
        .update({ ...form })
        .eq("id", editUser.id);
      setEditUser(null);
    } else {
      // Bestimme den maximalen aktuellen "order"-Wert für Tätowierer:
      const tattooists = users.filter(u => u.role === "tattooist");
      const maxOrder = tattooists.length > 0 ? Math.max(...tattooists.map(u => u.order || 0)) : 0;
      await supabase.from("users").insert([
        {
          id: uuidv4(),
          ...form,
          order: maxOrder + 1
        }
      ]);
    }
    setForm({ username: "", password: "", role: "tattooist", color: "gray" });
    loadUsers();
  }

  function handleEdit(u) {
    setEditUser(u);
    setForm({
      username: u.username,
      password: u.password,
      role: u.role,
      color: u.color
    });
  }

  async function deleteUser(id) {
    if (!window.confirm("Benutzer wirklich löschen?")) return;
    await supabase.from("users").delete().eq("id", id);
    loadUsers();
  }

  // Robuste Tätowierer-Sortierung (nur unter den Tätowierern!)
  async function moveTattooist(userId, direction) {
    // Filtere Tätowierer sortiert nach 'order'
    const tattooists = users.filter(u => u.role === "tattooist").sort((a, b) => a.order - b.order);
    const index = tattooists.findIndex(u => u.id === userId);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === tattooists.length - 1)
    )
      return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    const current = tattooists[index];
    const swapWith = tattooists[newIndex];

    // Vertausche deren "order"-Werte
    await supabase.from("users").update({ order: swapWith.order }).eq("id", current.id);
    await supabase.from("users").update({ order: current.order }).eq("id", swapWith.id);

    await loadUsers();
  }

  // Hilfsfunktion: Finde Position unter den Tätowierern
  function tattooistPos(id) {
    const tattooists = users.filter(u => u.role === "tattooist").sort((a, b) => a.order - b.order);
    return tattooists.findIndex(u => u.id === id);
  }

  function tattooistCount() {
    return users.filter(u => u.role === "tattooist").length;
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 text-white">
      <h1 className="text-3xl font-bold mb-6">Benutzerverwaltung</h1>

      {/* Benutzerformular */}
      <form onSubmit={saveUser} className="bg-gray-800 p-4 rounded-xl mb-8 space-y-3">
        <div className="flex gap-3">
          <input
            className="flex-1 p-3 rounded bg-gray-900 text-white"
            placeholder="Benutzername"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
            required
          />
          <input
            className="flex-1 p-3 rounded bg-gray-900 text-white"
            type="password"
            placeholder="Passwort"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>
        <div className="flex gap-3">
          <select
            className="flex-1 p-3 rounded bg-gray-900 text-white"
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
          >
            <option value="tattooist">Tätowierer</option>
            <option value="admin">Admin</option>
          </select>
          <select
            className="flex-1 p-3 rounded bg-gray-900 text-white"
            value={form.color}
            onChange={e => setForm({ ...form, color: e.target.value })}
          >
            <option value="gray">Grau</option>
            <option value="red">Rot</option>
            <option value="blue">Blau</option>
            <option value="pink">Pink</option>
            {/* Weitere Farben nach Bedarf */}
          </select>
        </div>
        <button
          type="submit"
          className="bg-pink-700 hover:bg-pink-800 text-white px-5 py-2 rounded font-bold"
        >
          {editUser ? "Speichern" : "Anlegen"}
        </button>
        {editUser && (
          <button
            type="button"
            onClick={() =>
              setEditUser(null) ||
              setForm({ username: "", password: "", role: "tattooist", color: "gray" })
            }
            className="ml-3 text-gray-400 underline"
          >
            Abbrechen
          </button>
        )}
      </form>

      {/* Benutzerliste */}
      <table className="w-full bg-[#101010] text-white rounded-2xl overflow-hidden">
        <thead>
          <tr className="text-gray-400 text-base border-b border-gray-800">
            <th className="py-4 px-4 text-left font-semibold">Benutzer</th>
            <th className="py-4 px-4 text-left font-semibold">Rolle</th>
            <th className="py-4 px-4 text-left font-semibold">Farbe</th>
            <th className="py-4 px-4 text-left font-semibold">Sortierung</th>
            <th className="py-4 px-4"></th>
          </tr>
        </thead>
        <tbody>
          {users
            .sort((a, b) => a.order - b.order)
            .map(u => (
            <tr key={u.id} className="hover:bg-[#18181b] transition">
              <td className="py-4 px-4">{u.username}</td>
              <td className="py-4 px-4">{u.role}</td>
              <td className="py-4 px-4">{u.color}</td>
              <td className="py-4 px-4">
                {u.role === "tattooist" && (
                  <>
                    <button
                      className="mr-2 bg-gray-700 px-2 py-1 rounded disabled:opacity-50"
                      disabled={tattooistPos(u.id) === 0}
                      onClick={() => moveTattooist(u.id, "up")}
                      title="Nach oben"
                    >
                      ⬆️
                    </button>
                    <button
                      className="bg-gray-700 px-2 py-1 rounded disabled:opacity-50"
                      disabled={tattooistPos(u.id) === tattooistCount() - 1}
                      onClick={() => moveTattooist(u.id, "down")}
                      title="Nach unten"
                    >
                      ⬇️
                    </button>
                  </>
                )}
              </td>
              <td className="py-4 px-4">
                <button
                  className="text-blue-400 font-bold px-2"
                  onClick={() => handleEdit(u)}
                >
                  ✏️
                </button>
                <button
                  className="text-red-400 font-bold px-2"
                  onClick={() => deleteUser(u.id)}
                >
                  🗑
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
