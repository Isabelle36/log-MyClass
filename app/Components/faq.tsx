export default function FAQ() {
  const faqs = [
    { q: "Is LogMyClass free to start?", a: "Yes. You can create a workspace and run sessions with the free tier." },
    { q: "Does it work on mobile devices?", a: "Absolutely. Teachers and students can check in from any phone or tablet." },
    { q: "How secure is attendance data?", a: "All records are encrypted and every edit is logged for auditing." },
    { q: "Can we import existing rosters?", a: "Yes. Upload CSV files or sync through a simple bulk import flow." },
  ];

  return (
    <section id="faq" className="bg-white px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">FAQ</p>
          <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">Questions, answered.</h2>
          <p className="mx-auto max-w-xl text-base text-slate-600">
            Everything you need to know before rolling out LogMyClass across campus.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-6 text-left shadow-[0_16px_30px_rgba(15,23,42,0.05)]"
            >
              <h3 className="text-lg font-semibold text-slate-900">{faq.q}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}