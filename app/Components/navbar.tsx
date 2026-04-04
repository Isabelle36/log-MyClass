import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="pointer-events-none fixed inset-x-0 top-6 z-50 flex justify-center px-4">
      <div
        className="pointer-events-auto flex w-full max-w-215 items-center justify-between rounded-[48px] bg-white px-4 py-2 shadow-[0_45px_18px_rgba(74,74,74,0.01),0_25px_15px_rgba(74,74,74,0.04),0_3px_6px_rgba(74,74,74,0.08)]"
        style={{ fontFamily: "var(--font-sans), sans-serif" }}
      >
        <Image
          src="/figma-logo.png"
          alt="Logmyclass"
          width={164}
          height={28}
          className="h-auto w-34.5 md:w-41"
          priority
        />

        <div className="hidden items-center gap-7 text-[18px] font-normal tracking-[-0.03em] text-[#605e5e] md:flex">
          <Link href="/" className="transition hover:text-[#101112]">How It Works</Link>
          <Link href="/" className="transition hover:text-[#101112]">Features</Link>
          <Link href="/" className="transition hover:text-[#101112]">Blog</Link>
          <Link href="/" className="transition hover:text-[#101112]">Pricing</Link>
          <Link href="/" className="transition hover:text-[#101112]">FAQs</Link>
        </div>

        <Link href="/sign-in">
        <button className="inline-flex items-center gap-1.5 rounded-[36px] border border-[rgba(61,74,224,0.66)] bg-linear-to-b from-[#6b68ff] to-[#0c29ba] px-3 cursor-pointer py-3 text-md font-medium tracking-[-0.02em] text-white shadow-[inset_0_-2px_6px_rgba(254,254,254,0.14),inset_0_3px_7.9px_rgba(255,255,255,0.43)] transition hover:opacity-90">
          <span>Get Started</span>
          <Image src="/figma-arrow-right.svg" alt="" width={20} height={20} />
        </button>
        </Link>
      </div>
    </nav>
  );
}