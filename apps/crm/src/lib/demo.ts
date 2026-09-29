export const demoDashboard = {
  totals: [
    { label: "Današnje narudžbe", value: "4" },
    { label: "Otvoreni upiti", value: "7" },
    { label: "Aktivni proizvodi", value: "12" },
    { label: "Čeka proizvodnju", value: "5" },
  ],
  recentOrders: [
    { id: "b3f22b86-3991-46a6-b67b-0b2d696be12e", orderNumber: "DRV-104251", customer: "Amina K.", status: "Zaprimljena", amount: "98 KM", createdAt: "2026-04-25T09:00:00.000Z" },
    { id: "a7d7da0b-e3e7-4d10-bd2e-46c90b41ef48", orderNumber: "DRV-104144", customer: "Mia Studio", status: "Potvrđena", amount: "120 KM", createdAt: "2026-04-24T09:00:00.000Z" },
  ],
}

export const demoProducts = [
  { sku: "DRV-MONO-01", name: "Monogram za vjenčanje", type: "Personalizirani", status: "Aktivan", price: "45 KM+" },
  { sku: "DRV-SIGN-02", name: "Logo natpis za biznis", type: "Personalizirani", status: "Aktivan", price: "120 KM+" },
  { sku: "DRV-TOP-04", name: "Topper za tortu", type: "Standardni", status: "Aktivan", price: "18 KM" },
]

export const demoInquiries = [
  { client: "Studio Bloom", subject: "Zidni logo natpis", deadline: "2026-05-02", status: "Otvoren" },
  { client: "Lejla H.", subject: "Monogram za vjenčanje", deadline: "2026-04-30", status: "Ponuda poslana" },
]
