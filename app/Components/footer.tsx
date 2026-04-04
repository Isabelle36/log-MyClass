export default function Footer() {
  return (
    <footer className="bg-[#0b0e14] text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-[1.3fr_0.7fr_0.7fr_0.7fr]">
          <div>
            <h2 className="text-2xl font-semibold text-white">log-MyClass</h2>
            <p className="mt-3 text-sm text-slate-400">
              The attendance platform built for modern universities, built to keep every record clean.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Product</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li>Live sessions</li>
              <li>Attendance analytics</li>
              <li>Exports & reports</li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Company</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li>About</li>
              <li>Security</li>
              <li>Contact</li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Resources</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li>Help center</li>
              <li>Setup guide</li>
              <li>Status</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-6 text-xs text-slate-500">
          © 2026 log-MyClass. All rights reserved.
        </div>
      </div>
    </footer>
  );
}