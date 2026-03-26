import Image from "next/image";

export default function Hero() {
  return (
    <section
      className=" before:absolute before:top-0 before:left-0 before:w-full
     before:h-full before:content-[''] before:opacity-[0.01] before:z-10 before:pointer-events-none
     before:bg-[url('https://www.ui-layouts.com/noise.gif')] relative isolate overflow-hidden px-6 pb-24 pt-34 md:min-h-screen md:pt-38"
      style={{
        background:
          "linear-gradient(176deg, #4489D8 -1.69%, #93C5F7 40.02%, #FFF 90.78%)",
      }}
    >
      <Image
        src="/Clouded Bg.png"
        alt=""
        fill
        priority
        className="pointer-events-none -z-10 object-cover object-top opacity-70"
      />

      <div className="mx-auto max-w-6xl md:mt-10 text-center md:pt-6">
        <p
          className="text-xl tracking-[-0.02em] text-[#223750] md:text-[22px]"
          style={{ fontFamily: "var(--font-lora), serif" }}
        >
          #1 Attendance Maker For Universities
        </p>

        <h1
          className="mx-auto mt-3 max-w-232 text-pretty text-5xl font-medium leading-[1.14] tracking-[-0.03em] text-white md:text-[64px]"
          style={{ fontFamily: "var(--font-lora), serif" }}
        >
          Spend Less Time on Attendance
          <br />
          More Time Teaching.
        </h1>

        <p
          className="mx-auto mt-4 max-w-139.5 text-base leading-[1.09] text-[#5f5f5f] md:text-lg"
          style={{ fontFamily: "var(--font-sans), sans-serif" }}
        >
          LogMyClass replaces paper registers with a simple digital system that
          helps teachers, admins, and students track attendance instantly.
        </p>

        <div
          className="mt-14 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8"
          style={{ fontFamily: "var(--font-sans), sans-serif" }}
        >
          <button className="inline-flex items-center gap-2 rounded-[36px] border border-[rgba(61,74,224,0.66)] bg-linear-to-b from-[#6b68ff] to-[#0c29ba] px-6 py-3.75 text-[18px] font-medium tracking-[-0.02em] text-white shadow-[0_24px_24px_0_rgba(83,88,234,0.15),0_6px_13px_0_rgba(83,88,234,0.18)] transition hover:opacity-90 cursor-pointer md:px-7 md:text-[20px]">
            <span>Get Started</span>
            <Image src="/figma-arrow-right.svg" alt="" width={20} height={20} />
          </button>

          <button className="rounded-[36px] bg-[#292929] cursor-pointer px-6 py-3.75 text-[18px] font-medium tracking-[-0.02em] text-white shadow-[inset_0_-10px_18px_rgba(254,254,254,0.14),inset_0_2px_0.6px_rgba(255,255,255,0.29),inset_0_2px_0_rgba(0,0,0,0.94),inset_0_-1.3px_0_black] transition hover:bg-[#181818] md:px-7 md:text-[20px]">
            Watch Demo
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-b from-transparent to-white" />
    </section>
  );
}
