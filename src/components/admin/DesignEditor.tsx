"use client";
import Image from "next/image";
import { useState } from "react";
import { presetThemes, safeDesignUrl, themeForeground, type StoreDesign, type Promotion } from "@/lib/store-design";

type Props = { value: StoreDesign; change: (value: StoreDesign) => void; uploading: (busy: boolean) => void };
function ImageField({ label, value, change, setBusy }: { label: string; value: string; change: (url: string) => void; setBusy: (busy: boolean) => void }) {
 const [error, setError] = useState("");
 async function upload(file?: File) {
  if (!file) return;
  setError("");
  if (!["image/jpeg","image/png","image/webp"].includes(file.type) || file.size > 3*1024*1024) { setError("En fazla 3 MB boyutunda JPG, PNG veya WebP seçin."); return; }
  setBusy(true);
  try {
   const data = await new Promise<string>((resolve,reject) => { const reader=new FileReader(); reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error("Dosya okunamadı."));reader.readAsDataURL(file); });
   const res=await fetch("/api/admin-panel-settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({data})});
   const result=await res.json();if(!res.ok)throw Error(result.message||"Görsel yüklenemedi.");
   change(result.url);
  } catch(e) { setError(e instanceof Error ? e.message : "Görsel yüklenemedi."); } finally { setBusy(false); }
 }
 return <div className="design-image-field"><label>{label}<input type="url" value={value} placeholder="https://… veya /gorsel.webp" onChange={e=>change(e.target.value)}/></label><label className="design-upload">Bilgisayardan görsel yükle<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const file=e.target.files?.[0];e.target.value="";void upload(file);}}/></label><small>JPG, PNG, WebP · En fazla 3 MB · Yüklenen görseller otomatik optimize edilir.</small>{error&&<p role="alert" className="text-red-700">{error}</p>}{value&&safeDesignUrl(value)&&<Image className="design-image-preview" src={value} alt={label+" önizleme"} width={960} height={400} unoptimized/>}</div>;
}
export default function DesignEditor({value,change,uploading}:Props) {
 const [busy,setBusy]=useState(false);
 const setUploading=(next:boolean)=>{setBusy(next);uploading(next);};
 const themes=[...presetThemes,...value.themes];
 const selected=themes.find(t=>t.id===value.theme)||presetThemes[0];
 const custom=value.themes.some(t=>t.id===selected.id);
 function patchTheme(patch:Partial<typeof selected>){change({...value,themes:value.themes.map(t=>t.id===selected.id?{...t,...patch}:t)});}
 function patchCard(index:number,patch:Partial<Promotion>){change({...value,promotions:value.promotions.map((p,i)=>i===index?{...p,...patch}:p)});}
 function move(index:number,delta:number){const cards=[...value.promotions];[cards[index],cards[index+delta]]=[cards[index+delta],cards[index]];change({...value,promotions:cards});}
 const toggles=[["productCode","Ürün kodunu göster"],["stockStatus","Stok durumunu göster"],["showPrices","Ürün kartlarında fiyatları göster"],["quickBuy","Ürün kartında sepete ekle"]] as const;
 return <fieldset disabled={busy} className="design-editor space-y-6">
 {busy&&<p role="status" className="notice">Görsel yükleniyor…</p>}
 <section className="form-panel"><h2 className="text-xl font-bold mb-4">Temalar</h2><div className="design-theme-options">{themes.map(t=><button type="button" key={t.id} aria-pressed={value.theme===t.id} className={value.theme===t.id?"selected":""} onClick={()=>change({...value,theme:t.id})}><span style={{background:t.accent}}/>{t.name}</button>)}</div>
 <button type="button" className="button-dark my-4" disabled={value.themes.length>=8} onClick={()=>{const theme={...selected,id:crypto.randomUUID(),name:"Özel Tema "+(value.themes.length+1)};change({...value,theme:theme.id,themes:[...value.themes,theme]});}}>+ Seçili temadan özel tema oluştur</button>
 {custom&&<div className="form-grid"><label>Tema adı<input value={selected.name} maxLength={50} onChange={e=>patchTheme({name:e.target.value})}/></label><label>Vurgu rengi<input type="color" value={selected.accent} onChange={e=>patchTheme({accent:e.target.value})}/></label><label><input className="!w-auto mr-2" type="checkbox" checked={selected.rounded} onChange={e=>patchTheme({rounded:e.target.checked})}/>Yuvarlatılmış kartlar</label><button type="button" className="underline text-left" onClick={()=>change({...value,theme:"AKN",themes:value.themes.filter(t=>t.id!==selected.id)})}>Bu özel temayı kaldır</button></div>}
 <div className="design-theme-preview" style={{borderColor:selected.accent,borderRadius:selected.rounded?16:0}}><small>TEMA ÖNİZLEME</small><h3>Yolculuğun eksik parçaları.</h3><p>AKN Motosiklet · Ürünler ve tanıtım kartları</p><span style={{background:selected.accent,color:themeForeground(selected.accent),borderRadius:selected.rounded?8:0}}>Ürünleri keşfet ↗</span></div>
 </section>
 <section className="form-panel"><h2 className="text-xl font-bold mb-4">Ana sayfa üst görseli</h2><ImageField label="Ana banner görseli" value={value.hero.image} change={image=>change({...value,hero:{...value.hero,image}})} setBusy={setUploading}/><div className="form-grid mt-4"><label>Başlık<input maxLength={120} placeholder="Boşsa mevcut AKN başlığı kullanılır" value={value.hero.heading} onChange={e=>change({...value,hero:{...value.hero,heading:e.target.value}})}/></label><label>Açıklama<textarea maxLength={300} placeholder="Boşsa mevcut açıklama kullanılır" value={value.hero.description} onChange={e=>change({...value,hero:{...value.hero,description:e.target.value}})}/></label><label>Buton yazısı<input maxLength={50} value={value.hero.buttonText} onChange={e=>change({...value,hero:{...value.hero,buttonText:e.target.value}})}/></label><label>Buton bağlantısı<input value={value.hero.href} onChange={e=>change({...value,hero:{...value.hero,href:e.target.value}})}/></label></div></section>
 <section className="form-panel"><h2 className="text-xl font-bold">Reklam ve tanıtım kartları</h2><p className="text-slate-500 my-3">Ana sayfanın alt bölümlerine küçük görseller ekleyin. Aynı bölümdeki kartlar buradaki sırayla görünür. En fazla 12 kart.</p>
 <div className="space-y-5">{value.promotions.map((p,i)=><article className="design-promo-editor" key={p.id}><div className="flex flex-wrap items-center justify-between gap-3 mb-4"><h3 className="font-bold">Tanıtım {i+1}</h3><div className="flex gap-3"><button type="button" disabled={i===0} onClick={()=>move(i,-1)} aria-label={p.title+" yukarı taşı"}>↑</button><button type="button" disabled={i===value.promotions.length-1} onClick={()=>move(i,1)} aria-label={p.title+" aşağı taşı"}>↓</button><button type="button" className="underline" onClick={()=>change({...value,promotions:value.promotions.filter(x=>x.id!==p.id)})}>Kartı kaldır</button></div></div>
 <ImageField label="Tanıtım görseli" value={p.image} change={image=>patchCard(i,{image})} setBusy={setUploading}/>
 <div className="form-grid mt-4"><label>Başlık / görsel açıklaması<input maxLength={100} value={p.title} onChange={e=>patchCard(i,{title:e.target.value})}/></label><label>Kısa açıklama<input maxLength={250} value={p.description} onChange={e=>patchCard(i,{description:e.target.value})}/></label><label>Bağlantı (isteğe bağlı)<input value={p.href} placeholder="/urunler veya https://…" onChange={e=>patchCard(i,{href:e.target.value})}/></label><label>Gösterileceği bölüm<select value={p.position} onChange={e=>patchCard(i,{position:e.target.value as Promotion["position"]})}><option value="categories">Kategorilerin altında</option><option value="products">Ürünlerin altında</option><option value="bottom">Sayfanın en altında</option></select></label><label><input className="!w-auto mr-2" type="checkbox" checked={p.active} onChange={e=>patchCard(i,{active:e.target.checked})}/>Aktif / mağazada göster</label></div></article>)}</div>
 <button type="button" className="button-dark mt-4" disabled={value.promotions.length>=12} onClick={()=>change({...value,promotions:[...value.promotions,{id:crypto.randomUUID(),title:"Yeni tanıtım",description:"",image:"",href:"",position:"bottom",active:true}]})}>+ Tanıtım kartı ekle</button></section>
 <section className="form-panel"><h2 className="text-xl font-bold mb-4">Ürün listesi</h2><div className="form-grid"><label>Sayfa başına ürün<input type="number" min={4} max={200} value={value.productsPerPage} onChange={e=>change({...value,productsPerPage:Number(e.target.value)})}/></label>{toggles.map(([key,label])=><label key={key}><input className="!w-auto mr-2" type="checkbox" checked={value[key]} onChange={e=>change({...value,[key]:e.target.checked})}/>{label}</label>)}</div></section>
 <p className="text-sm text-slate-600">Önizleme taslağı gösterir. Mağazaya uygulamak için aşağıdan değişiklikleri kaydedin.</p>
 </fieldset>;
}
