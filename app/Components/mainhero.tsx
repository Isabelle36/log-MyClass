export default function Hero() {
  return (
    <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 leading-tight">
          Manage Classroom Attendance <br />
          <span className="text-blue-600 font-bold underline decoration-blue-200">Without Any Hassle</span>
        </h1>
        <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
          log-MyClass helps teachers track daily attendance, generate reports, and 
          manage student records in a simple, light-weight cloud platform.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button className="bg-slate-900 text-white px-8 py-4 rounded-xl font-semibold hover:bg-slate-800 transition shadow-lg">
            Start Free Trial
          </button>
          <button className="bg-white border border-slate-200 text-slate-700 px-8 py-4 rounded-xl font-semibold hover:bg-slate-50 transition shadow-sm">
            Watch Demo
          </button>
        </div>
      </div>
    </section>
  );
}