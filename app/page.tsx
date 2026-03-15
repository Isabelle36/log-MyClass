import { redirect } from "next/navigation";
import Navbar from "./Components/navbar";
import Hero from "./Components/mainhero";
import Features from "./Components/features";
import HowItWorks from "./Components/how-it-works";
import Footer from "./Components/footer";
import FAQ from "./Components/faq";
import Heroo from "./Components/Heroo"; 

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
        <Heroo />
        <Features />
        <HowItWorks />
        <FAQ />
        
        
        <section className="bg-blue-600 py-16 text-center text-white px-6">
          <h2 className="text-3xl font-bold mb-4">Ready to simplify your class?</h2>
          <button className="bg-white text-blue-600 px-8 py-3 rounded-full font-bold">
            Create Free Account
          </button>
        </section>
      </main>
      <Footer />
      
    </div>
  );
};

export default page;