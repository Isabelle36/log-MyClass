export default function HowItWorks() {
  const steps = [
    {
      title: "Create your campus",
      desc: "Import departments, classes, and student rosters in minutes.",
    },
    {
      title: "Run live sessions",
      desc: "Launch QR check-ins with automatic late rules and geo-verification.",
    },
    {
      title: "Automate reporting",
      desc: "Share attendance analytics with admins and export compliance-ready PDFs.",
    },
  ];

  return (
    <section id="how-it-works" className="relative overflow-hidden bg-slate-50 px-6 py-24">
      <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-indigo-100/60 blur-3xl" />
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.45fr_0.55fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Workflow
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900 md:text-4xl">
            From setup to insights in three clean steps.
          </h2>
          <p className="mt-4 text-base text-slate-600">
            LogMyClass keeps the flow simple for teachers and transparent for administrators.
          </p>
        </div>

        <ol className="flex flex-col gap-6">
          {steps.map((step, index) => (
            <li key={index} className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_20px_40px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                  0{index + 1}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{step.desc}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}