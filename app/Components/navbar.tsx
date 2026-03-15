export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-blue-600 tracking-tight">
          log-MyClass
        </div>
        <div className="hidden md:flex gap-8 text-slate-600 font-medium">
          <a href="#features" className="hover:text-blue-600 transition">Features</a>
          <a href="#" className="hover:text-blue-600 transition">About</a>
          <a href="#" className="hover:text-blue-600 transition">Contact</a>
        </div>
        <button className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm">
          Login
        </button>
      </div>
    </nav>
  );
}