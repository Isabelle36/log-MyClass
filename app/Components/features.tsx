const featuresList = [
  { title: "Smart Tracking", desc: "One-tap attendance marking for the entire class.", icon: "📅" },
  { title: "Auto Reports", desc: "Download monthly PDF reports with just one click.", icon: "📈" },
  { title: "Cloud Security", desc: "Your data is end-to-end encrypted and always safe.", icon: "🔒" },
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-white px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900">Why choose log-MyClass?</h2>
          <p className="text-slate-500 mt-2">Built for modern educational institutions.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-10">
          {featuresList.map((f, i) => (
            <div key={i} className="p-8 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-blue-200 transition-all cursor-default group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{f.icon}</div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{f.title}</h3>
              <p className="text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}