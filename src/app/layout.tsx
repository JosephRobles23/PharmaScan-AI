import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PharmaScan AI | Gestión de Inventario Farmacéutico",
  description: "Aplicación de gestión de inventario farmacéutico con escaneo OCR, seguimiento de vencimientos y alertas en tiempo real.",
  keywords: ["farmacia", "inventario", "OCR", "escaneo", "vencimiento", "gestión"],
  authors: [{ name: "PharmaScan AI" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  themeColor: "#0066CC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
