import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="font-display text-xl font-black tracking-[-.04em]">
      MULTI<span className="text-grape-dark">//</span>LINKS
    </Link>
  );
}
