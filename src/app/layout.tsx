import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CartProvider } from "@/context/CartContext";
import { ProductProvider } from "@/context/ProductContext";
import { CatalogProvider } from "@/context/CatalogContext";
import { OrderProvider } from "@/context/OrderContext";
import { CustomerProvider } from "@/context/CustomerContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AKN Motosiklet",
  description: "Motosiklet yedek parça ve aksesuar mağazası",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ProductProvider>
          <CatalogProvider><CustomerProvider><OrderProvider><CartProvider>{children}</CartProvider></OrderProvider></CustomerProvider></CatalogProvider>
        </ProductProvider>
      </body>
    </html>
  );
}
