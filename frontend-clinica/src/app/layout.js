import { Lexend, Zilla_Slab } from "next/font/google";
import "./globals.css";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
  display: "swap",
});

const zilla = Zilla_Slab({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-zilla",
  display: "swap",
});


export const metadata = {
  title: "POPIM - Portal Clínica",
  description: "Sistema Web de Gestión Clínica y Control de Salud Animal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${lexend.variable} ${zilla.variable}`}>
      <body className="min-h-screen bg-popim-page font-sans text-popim-ink antialiased">
        {children}
      </body>
    </html>
  );
}