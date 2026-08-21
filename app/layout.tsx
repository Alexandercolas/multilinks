import type { Metadata, Viewport } from "next";
import { Inter, Unbounded } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  variable: "--font-unbounded",
  display: "swap",
});

const siteUrl = "https://multilinksrd.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MultiLinks | Todos tus enlaces en un solo lugar",
    template: "%s | MultiLinks",
  },
  description: "Crea una página personal, reúne todos tus enlaces y compártela con una sola URL. Personaliza colores, foto y botones gratis.",
  keywords: ["multilinks", "enlaces en bio", "link en bio", "página de enlaces", "redes sociales"],
  authors: [{ name: "MultiLinks" }],
  creator: "MultiLinks",
  verification: {
    google: "fLPfuWtVQLcRkpuNcEx9b_o5Ttno6uADEzXjisX6Lds",
  },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_DO",
    url: siteUrl,
    siteName: "MultiLinks",
    title: "MultiLinks | Todos tus enlaces en un solo lugar",
    description: "Crea una página personal y comparte todos tus enlaces con una sola URL.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MultiLinks | Todos tus enlaces en un solo lugar",
    description: "Crea una página personal y comparte todos tus enlaces con una sola URL.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#8566ff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${inter.variable} ${unbounded.variable}`}>
      <body>{children}</body>
    </html>
  );
}
