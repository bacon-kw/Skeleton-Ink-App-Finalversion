import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { v4 as uuidv4 } from "uuid";

export default function Guides({ user }) {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", content: "" });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("guides").select("*").order("created_at", { ascending: false });
    setGuides(data || []);
    setLoading(false);
  }

  async function createGuide(e) {
    e.preventDefault();
    await supabase.from("guides").insert([{
      id: uuidv4(),
      title: form.title,
      content: form.content
    }]);
    setForm({ title: "", content: "" });
    load();
  }

  async function deleteGuide(id) {
    if (!window.confirm("Diese Anleitung wirklich löschen?")) return;
    await supabase.from("guides").delete().eq("id", id);
    load();
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 text-white">
      <h1 className="text-4xl font-extrabold mb-7">Anleitungen</h1>
      {user.role === "admin" && (
        <form onSubmit={createGuide} className="mb-8 space-y-3 bg-gray-800 p-4 rounded-xl">
          <input className="w-full p-2 rounded bg-gray-900 text-white" placeholder="Titel"
            value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          <textarea className="w-full p-2 rounded bg-gray-900 text-white" placeholder="Inhalt (Text, Links, URLs für Bilder/Videos möglich)"
            value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required rows={4}/>
          <button className="bg-pink-700 hover:bg-pink-800 px-4 py-2 rounded font-bold" type="submit">
            Speichern
          </button>
        </form>
      )}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Lade Anleitungen...</div>
        ) : guides.length === 0 ? (
          <div className="text-center py-8 text-gray-400">Noch keine Anleitungen.</div>
        ) : (
          guides.map(g => (
            <div key={g.id} className="bg-[#18181b] rounded-xl p-4 shadow">
              <div className="flex justify-between items-center">
                <div className="text-xl font-bold">{g.title}</div>
                {user.role === "admin" &&
                  <button className="text-red-400 font-bold px-2" onClick={() => deleteGuide(g.id)}>
                    🗑
                  </button>
                }
              </div>
              <div className="mt-3 whitespace-pre-line text-gray-200">{g.content}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
