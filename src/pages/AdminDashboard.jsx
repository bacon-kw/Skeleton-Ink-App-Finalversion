import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function AdminDashboard({ user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line
  }, []);

  async function loadUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("order", { ascending: true });
    if (!error) setUsers(data || []);
    setLoading(false);
  }

  async function moveUser(userId, direction) {
    const tattooists = users.filter(u => u.role === "tattooist");
    const index = tattooists.findIndex(u => u.id === userId);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === tattooists.length - 1)
    ) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const userA = tattooists[index];
    const userB = tattooists[newIndex];

    // Vertausche deren "order"-Werte in der Datenbank
    await supabase
      .from("users")
      .update({ order: userB.order })
      .eq("id", userA.id);
    await supabase
      .from("users")
      .update({ order: userA.order })
      .eq("id", userB.id);

    loadUsers();
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 text-white">
      <h1 className="text-3xl font-bold mb-7">Admin Dashboard</h1>
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Tätowierer-Sortierung</h2>
        {loading ? (
          <div className="text-gray-400">Lade Tätowierer...</div>
        ) : (
          <table className="w-full bg-gray-800 rounded-xl mb-6">
            <thead>
              <tr className="text-gray-400">
                <th className="py-3 px-4 text-left">Tätowierer</th>
                <th className="py-3 px-4 text-left">Farbe</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter(u => u.role === "tattooist")
                .map((u, i, arr) => (
                  <tr key={u.id} className="border-t border-gray-700">
                    <td className="py-2 px-4">{u.username}</td>
                    <td className="py-2 px-4">{u.color}</td>
                    <td className="py-2 px-4">
                      <button
                        className="mr-2 bg-gray-700 px-2 py-1 rounded disabled:opacity-50"
                        disabled={i === 0}
                        onClick={() => moveUser(u.id, "up")}
                        title="Nach oben"
                      >⬆️</button>
                      <button
                        className="bg-gray-700 px-2 py-1 rounded disabled:opacity-50"
                        disabled={i === arr.length - 1}
                        onClick={() => moveUser(u.id, "down")}
                        title="Nach unten"
                      >⬇️</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </section>
      {/* Weitere Admin-Funktionen können hier ergänzt werden */}
    </div>
  );
}
