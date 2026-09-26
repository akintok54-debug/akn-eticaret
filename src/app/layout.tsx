import type { Metadata } from "next";
import {publicSeo} from "@/lib/site-configuration";
import { CartProvider } from "@/context/CartContext";
import { ProductProvider } from "@/context/ProductContext";
import { CatalogProvider } from "@/context/CatalogContext";
import { OrderProvider } from "@/context/OrderContext";
import { CustomerProvider } from "@/context/CustomerContext";
import "./globals.css";
import {StoreDesignProvider} from "@/context/StoreDesignContext";
import {getStoreDesign} from "@/lib/store-design-server";

export async function generateMetadata(): Promise<Metadata> {
 const seo=await publicSeo();
 return {
  metadataBase: new URL("https://www.aknmotosiklet.com"),
  icons: { icon: "/brand-icon.svg" },
  title: { default: seo.siteTitle, template: "%s | AKN Motosiklet" },
  description: seo.siteDescription,
  keywords: seo.keywords.split(",").map(v=>v.trim()).filter(Boolean),
};
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const design=await getStoreDesign();
  return (
    <html
      lang="tr"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <ProductProvider>
          <CatalogProvider><CustomerProvider><OrderProvider><CartProvider><StoreDesignProvider design={design}>{children}</StoreDesignProvider></CartProvider></OrderProvider></CustomerProvider></CatalogProvider>
        </ProductProvider>
      </body>
    </html>
  );
}
