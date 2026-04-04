const featureCards = [
  {
    title: "Geo-fenced check-ins",
    desc: "Only students inside the classroom can mark attendance. Stop location spoofing instantly.",
    eyebrow: "Accuracy",
  },
  {
    title: "Live QR sessions",
    desc: "Rotate QR codes per session and capture late arrivals with automated rules.",
    eyebrow: "Real-time",
  },
  {
    title: "Auto reports",
    desc: "Generate department-ready reports in minutes with exportable PDF and CSV logs.",
    eyebrow: "Reporting",
  },
  {
    title: "Role-based portals",
    desc: "Separate views for admins, teachers, and students with the right permissions baked in.",
    eyebrow: "Access",
  },
  {
    title: "Audit-ready logs",
    desc: "Every check-in, edit, and override is recorded for compliance and transparency.",
    eyebrow: "Governance",
  },
  {
    title: "Easy onboarding",
    desc: "Import students in bulk, assign classes, and go live in under 10 minutes.",
    eyebrow: "Setup",
  },
];

export default function Features() {
  return (
    <section id="features" className="relative overflow-hidden bg-white px-6 py-24">
      <div className="pointer-events-none absolute right-0 top-10 h-60 w-60 rounded-full bg-sky-100/70 blur-3xl" />
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Built for scale
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900 md:text-4xl">
              Everything you need to replace paper roll calls.
            </h2>
          </div>
          <p className="max-w-md text-base text-slate-600">
            From geo-verified check-ins to audit-ready exports, LogMyClass keeps attendance reliable and effortless.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {featureCards.map((feature, index) => (
            <div
              key={index}
              className="group rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-[0_20px_40px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:border-slate-300"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                {feature.eyebrow}
              </p>
              <h3 className="mt-3 text-xl font-semibold text-slate-900">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {feature.desc}
              </p>
              <div className="mt-6 h-1 w-10 rounded-full bg-linear-to-r from-sky-500 via-blue-600 to-indigo-500 opacity-70" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}