import type { Metadata } from "next";
import { CartProvider } from "@/context/CartContext";
import { ProductProvider } from "@/context/ProductContext";
import { CatalogProvider } from "@/context/CatalogContext";
import { OrderProvider } from "@/context/OrderContext";
import { CustomerProvider } from "@/context/CustomerContext";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.aknmotosiklet.com"),
  icons: { icon: "/brand-icon.svg" },
  title: { default: "AKN Motosiklet | Yedek Parça ve Aksesuar", template: "%s | AKN Motosiklet" },
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
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <ProductProvider>
          <CatalogProvider><CustomerProvider><OrderProvider><CartProvider>{children}</CartProvider></OrderProvider></CustomerProvider></CatalogProvider>
        </ProductProvider>
      </body>
    </html>
  );
}
