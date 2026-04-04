import { redirect } from "next/navigation";
import Navbar from "./Components/navbar";
import Hero from "./Components/mainhero";
import Features from "./Components/features";
import HowItWorks from "./Components/how-it-works";
import Footer from "./Components/footer";
import FAQ from "./Components/faq";

const page = async ({
  searchParams,
}: {
  searchParams: Promise<{
    __clerk_ticket?: string | string[];
    __clerk_status?: string | string[];
  }>;
}) => {
  
  const params = await searchParams;
  const ticketParam = params.__clerk_ticket;
  const statusParam = params.__clerk_status;
  const ticket = Array.isArray(ticketParam) ? ticketParam[0] : ticketParam;
  const status = Array.isArray(statusParam) ? statusParam[0] : statusParam;

  if (ticket) {
    const qs = new URLSearchParams({ __clerk_ticket: ticket });
    if (status) {
      qs.set("__clerk_status", status);
    }
    redirect(`/sign-up?${qs.toString()}`);
  }
  

  return (
    <div className="relative w-full min-h-screen">
      
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <FAQ />

        <section className="relative overflow-hidden bg-[#0b0e14] px-6 py-20 text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),_transparent_55%)]" />
          <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Launch in days
              </p>
              <h2 className="mt-3 text-3xl font-semibold md:text-4xl">
                Turn attendance into a background process.
              </h2>
              <p className="mt-3 max-w-lg text-sm text-slate-300">
                Start free today or schedule a walk-through for your department administrators.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(255,255,255,0.2)]">
                Create free account
              </button>
              <button className="rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-white/90 transition hover:border-slate-500">
                Book a demo
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      
    </div>
  );
};

export default page;