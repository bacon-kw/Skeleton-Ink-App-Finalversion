import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    // Hole den User mit passendem Namen
    const { data, error: supaError } = await supabase
      .from("users")
      .select("*")
      .eq("username", form.username)
      .maybeSingle();

    if (supaError) {
      setError("Login-Fehler.");
      setLoading(false);
      return;
    }

    if (!data) {
      setError("Benutzername existiert nicht.");
      setLoading(false);
      return;
    }

    // Achtung: Passwörter sind in Supabase aktuell **unverschlüsselt**!
    // Prüfe das Passwort 1:1 (Production: Hash benutzen!)
    if (data.password !== form.password) {
      setError("Falsches Passwort.");
      setLoading(false);
      return;
    }

    // User korrekt! Weiterleiten:
    setLoading(false);
    onLogin({
      id: data.id,
      username: data.username,
      role: data.role,
      color: data.color
    });
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-black">
      <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-8 shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold mb-8 text-pink-300 flex items-center">
          <span className="mr-2">💀</span>Skeleton Ink Login
        </h1>
        <div className="mb-4">
          <label className="block text-gray-300 mb-1">Benutzername</label>
          <input
            className="w-full p-3 rounded bg-gray-800 text-white"
            type="text"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-300 mb-1">Passwort</label>
          <input
            className="w-full p-3 rounded bg-gray-800 text-white"
            type="password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>
        {error && <div className="text-red-400 mb-4">{error}</div>}
        <button
          className="w-full bg-pink-700 hover:bg-pink-800 text-white px-5 py-3 rounded font-bold"
          type="submit"
          disabled={loading}
        >
          {loading ? "Einloggen..." : "Login"}
        </button>
      </form>
    </div>
  );
}
