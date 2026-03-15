import Navbar from "../Components/navbar";
import Hero from "../Components/mainhero";
import Features from "../Components/features";
import HowItWorks from "../Components/how-it-works";
import Footer from "../Components/footer";
import FAQ from "../Components/faq";

export default function Home() {
  return (
    <div className="relative">
      <Navbar />
      <main>
        <Hero />
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
}