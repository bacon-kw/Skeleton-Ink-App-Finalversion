import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { v4 as uuidv4 } from "uuid";

export default function Customers({ user }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editCustomer, setEditCustomer] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    placement: "",
    tattooName: "",
    sessions: 1,
    doneSessions: 0,
    tattooist: user.role === "admin" ? "" : user.username,
    isArchived: false,
    lastSessionDate: null
  });

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
    if (!error) setCustomers(data);
    setLoading(false);
  }

  function handleEdit(customer) {
    setEditCustomer(customer);
    setForm({
      name: customer.name,
      phone: customer.phone,
      placement: customer.placement,
      tattooName: customer.tattooName,
      sessions: customer.sessions,
      doneSessions: customer.doneSessions,
      tattooist: customer.tattooist,
      isArchived: customer.isArchived,
      lastSessionDate: customer.lastSessionDate
        ? new Date(customer.lastSessionDate).toISOString().split("T")[0]
        : null
    });
  }

  async function getTax() {
    const { data } = await supabase.from("settings").select("value").eq("key", "tax").single();
    return data && data.value ? Number(data.value) : 19;
  }

  async function createInvoiceForCustomer(customerId, formValues) {
    // Rechnung nach erfolgreichem Insert für neuen Kunden anlegen
    const year = new Date().getFullYear();
    const { data: yearInvoices } = await supabase
      .from("invoices")
      .select("id")
      .gte("date", `${year}-01-01`)
      .lte("date", `${year}-12-31`);
    const invoiceCount = yearInvoices ? yearInvoices.length + 1 : 1;
    const invoiceNumber = `SKE-${year}-${String(invoiceCount).padStart(3, "0")}`;
    const tax = await getTax();
    const sessions = Number(formValues.sessions);

    const amountNet = sessions * 1500;
    const materialCosts = sessions * 500;
    const tattooistWage = sessions * 1000;
    const finalAmount = Math.round(amountNet * (1 + tax / 100));

    await supabase.from("invoices").insert([{
      id: uuidv4(),
      invoiceNumber,
      date: new Date(),
      tattooist: formValues.tattooist,
      customerName: formValues.name,
      tattooName: formValues.tattooName,
      placement: formValues.placement,
      sessions,
      amount: finalAmount,
      tax,
      customerId: customerId,
      materialCosts: materialCosts,
      tattooistWage: tattooistWage,
      payoutDone: false,
      isStudio: false
    }]);
  }

  async function saveCustomer(e) {
    e.preventDefault();
    if (editCustomer) {
      const { error } = await supabase.from("customers").update({
        ...form,
        sessions: parseInt(form.sessions),
        doneSessions: parseInt(form.doneSessions),
        lastSessionDate: form.lastSessionDate ? new Date(form.lastSessionDate) : null
      }).eq("id", editCustomer.id);
      if (!error) {
        setEditCustomer(null);
        setForm({
          name: "",
          phone: "",
          placement: "",
          tattooName: "",
          sessions: 1,
          doneSessions: 0,
          tattooist: user.role === "admin" ? "" : user.username,
          isArchived: false,
          lastSessionDate: null
        });
        loadCustomers();
      }
    } else {
      const now = new Date();
      const id = uuidv4();
      const { error } = await supabase.from("customers").insert([{
        id,
        ...form,
        sessions: parseInt(form.sessions),
        doneSessions: parseInt(form.doneSessions),
        date: now,
        isArchived: false,
        lastSessionDate: now
      }]);
      if (!error) {
        // Jetzt: Rechnung automatisch erzeugen!
        await createInvoiceForCustomer(id, { ...form, sessions: parseInt(form.sessions) });
        setForm({
          name: "",
          phone: "",
          placement: "",
          tattooName: "",
          sessions: 1,
          doneSessions: 0,
          tattooist: user.role === "admin" ? "" : user.username,
          isArchived: false,
          lastSessionDate: null
        });
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

  const aktiveKunden = customers.filter(c => !c.isArchived);
  const fertigeKunden = customers.filter(c => c.isArchived);

  return (
    <div className="max-w-5xl mx-auto mt-10 text-white">
      <h1 className="text-4xl font-extrabold mb-7 tracking-tight">Kunden</h1>
      {/* Formular ... wie gehabt ... */}
      {/* (Hier kommt dein bestehendes Formular hin) */}
      {/* Kundenlisten ... wie gehabt ... */}
    </div>
  );
}
