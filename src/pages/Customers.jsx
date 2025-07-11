// ... (imports und useState usw. wie bei dir)

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

// ... Rest wie gehabt ...

async function saveCustomer(e) {
  e.preventDefault();
  const now = new Date();
  if (editCustomer) {
    const { error } = await supabase.from("customers").update({
      ...form,
      sessions: parseInt(form.sessions),
      doneSessions: parseInt(form.doneSessions),
      lastSessionDate: form.lastSessionDate
        ? new Date(form.lastSessionDate)
        : now
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
      const customerObj = { ...form, id, sessions: parseInt(form.sessions), tattooist: form.tattooist, name: form.name, tattooName: form.tattooName, placement: form.placement };
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
        lastSessionDate: null
      });
      loadCustomers();
    }
  }
}

return (
  <div className="max-w-5xl mx-auto mt-10 text-white">
    <h1 className="text-4xl font-extrabold mb-7 tracking-tight">Kunden</h1>
    <form onSubmit={saveCustomer} className="mb-8 space-y-3 bg-gray-800 p-4 rounded-xl max-w-2xl">
      {/* ... (Inputs wie gehabt) ... */}
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
      {/* ... (Buttons wie gehabt) ... */}
    </form>
    {/* ... (Kundenliste wie gehabt) ... */}
  </div>
);

// ... Rest wie gehabt ...
