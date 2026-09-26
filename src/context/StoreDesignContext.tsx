"use client";
import { createContext, useContext, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { defaultDesign, presetThemes, themeForeground, type StoreDesign } from "@/lib/store-design";

const Context = createContext<StoreDesign>(defaultDesign);
export const useStoreDesign = () => useContext(Context);
export function StoreDesignProvider({ design, children }: { design: StoreDesign; children: React.ReactNode }) {
  const path = usePathname();
  const theme = [...presetThemes, ...design.themes].find(t => t.id === design.theme) || presetThemes[0];
  const admin = path.startsWith("/admin") || path === "/yonetici-giris";
  const style = { "--store-accent": theme.accent, "--store-on-accent": themeForeground(theme.accent), "--store-radius": theme.rounded ? "16px" : "0px" } as CSSProperties;
  return <Context.Provider value={design}>{admin ? children : <div className="store-theme" style={style}>{children}</div>}</Context.Provider>;
}
