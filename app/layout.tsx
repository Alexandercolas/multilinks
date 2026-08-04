import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MultiLinks — Todo lo tuyo, en un link",
  description: "Crea una página personal y comparte todos tus enlaces.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
