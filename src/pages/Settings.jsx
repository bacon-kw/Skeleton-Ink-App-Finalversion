import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Settings({ user }) {
  const [tax, setTax] = useState("19");
  const [msg, setMsg] = useState("");
  const allowedRates = ["5", "10", "15", "20", "25"];

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("settings").select("value").eq("key", "tax").single();
      if (data && allowedRates.includes(data.value)) setTax(data.value);
      setMsg("");
    }
    load();
  }, []);

  async function updateTax(e) {
    e.preventDefault();
    // Upsert mit conflictTarget!
    const { error } = await supabase
      .from("settings")
      .upsert([{ key: "tax", value: tax }], { onConflict: ["key"] });
    setMsg(error ? "Fehler beim Speichern." : "Steuersatz gespeichert!");
  }

  if (user.role !== "admin") {
    return <div className="text-white text-xl">Kein Zugriff.</div>;
  }

  return (
    <div className="max-w-xl mx-auto mt-12 text-white">
      <h1 className="text-4xl font-extrabold mb-6">Steuereinstellungen</h1>
      <form className="space-y-5 bg-gray-900 rounded-xl p-6 shadow" onSubmit={updateTax}>
        <label className="block font-bold mb-1">Steuersatz (%)</label>
        <select
          className="w-full p-3 rounded bg-gray-800 text-white mb-3"
          value={tax}
          onChange={e => setTax(e.target.value)}
        >
          {allowedRates.map(rate => (
            <option value={rate} key={rate}>{rate} %</option>
          ))}
        </select>
        <button className="bg-pink-700 hover:bg-pink-800 text-white py-3 px-5 rounded font-bold">
          Speichern
        </button>
        {msg && <div className="mt-2 text-green-400">{msg}</div>}
      </form>
    </div>
  );
}
