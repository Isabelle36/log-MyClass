export default function FAQ() {
  const faqs = [
    { q: "Is this tool free?", a: "Yes! Basic features will always be free." },
    { q: "Will it work on mobile?", a: "Absolutely, You can use it on any phone or tablet." },
    { q: "Is the data safe?", a: "Yes! the data is secure,." }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="p-6 border rounded-lg hover:bg-gray-50 transition">
              <h3 className="font-bold text-lg text-blue-600">Q: {faq.q}</h3>
              <p className="mt-2 text-gray-600 font-medium">A: {faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}