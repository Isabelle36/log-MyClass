export default function HowItWorks() {
  const steps = [
    { title: "Step 1", desc: "Enroll your class and add students." },
    { title: "Step 2", desc: "Just one click to mark your daily attendance." },
    { title: "Step 3", desc: "Generate an automatic report and share it." },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold mb-12">How Does this work?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="p-6 bg-white rounded-xl shadow-sm border">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                {index + 1}
              </div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}