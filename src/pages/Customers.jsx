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
    lastSessionDate: null,
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
        : null,
    });
  }

  async function getTax() {
    const { data } = await supabase.from("settings").select("value").eq("key", "tax").single();
    return data && data.value ? Number(data.value) : 19;
  }

  async function createInvoiceForCustomer(customer) {
    // Prüfe, ob schon eine Rechnung für diesen Kunden existiert!
    const { data: existing } = await supabase
      .from("invoices")
      .select("id")
      .eq("customerId", customer.id);

    if (existing && existing.length > 0) return; // Schon Rechnung vorhanden

    const year = new Date().getFullYear();
    const { data: yearInvoices } = await supabase
      .from("invoices")
      .select("id")
      .gte("date", `${year}-01-01`)
      .lte("date", `${year}-12-31`);
    const invoiceCount = yearInvoices ? yearInvoices.length + 1 : 1;
    const invoiceNumber = `SKE-${year}-${String(invoiceCount).padStart(3, "0")}`;
    const tax = await getTax();
    const sessions = Number(customer.sessions);

    const amountNet = sessions * 1500;
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
      customerId: customer.id,
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
        lastSessionDate: form.lastSessionDate ? new Date(form.lastSessionDate) : null,
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
          lastSessionDate: null,
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
        lastSessionDate: now,
      }]);
      if (!error) {
        // Nach erfolgreichem Anlegen automatisch eine Rechnung für diesen Kunden erstellen!
        const customerObj = {
          ...form,
          id,
          sessions: parseInt(form.sessions),
          tattooist: form.tattooist,
          name: form.name,
          tattooName: form.tattooName,
          placement: form.placement,
        };
        await createInvoiceForCustomer(customerObj);

        setForm({
          name: "",
          phone: "",
          placement: "",
          tattooName: "",
          sessions: 1,
          doneSessions: 0,
          tattooist: user.role === "admin" ? "" : user.username,
          isArchived: false,
          lastSessionDate: null,
        });
        loadCustomers();
      }
    }
  }

  // ...Rest (Archivierte Kunden, Tabellen usw. wie gehabt)
  // (Siehe vorherigen Code oder frage nochmal nach, wenn du den gesamten Block brauchst)
}
