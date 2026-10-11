import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="font-display text-xl font-black tracking-[-.04em]"
    >
      MULTI<span className="mx-0.5 rounded bg-ink px-0.5 text-lime">//</span>
      LINKS
    </Link>
  );
}
