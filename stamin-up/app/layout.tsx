import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Stamin-Up - Encuentra profesionales para tu hogar",
  description:
    "Conectamos clientes con los mejores profesionales de servicios locales. Plomería, electricidad, limpieza, jardinería y más.",
  keywords: [
    "servicios",
    "profesionales",
    "plomería",
    "electricidad",
    "limpieza",
    "hogar",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased" suppressHydrationWarning>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
