"use client";
import Link from "next/link";
import { useState } from "react";
import { useProducts } from "@/context/ProductContext";
import { useOrders } from "@/context/OrderContext";
import { money } from "@/lib/store";

const shortcuts = [
 ["Ürünler", "Ürün, fiyat ve stok yönetimi", "/admin/urunler", "01"],
 ["Müşteriler", "Üye ve bayi kayıtları", "/admin/musteriler", "02"],
 ["Bayi Başvuruları", "Başvuruları değerlendirin", "/admin/bayiler", "03"],
 ["Kuponlar", "İndirim ve kampanya yönetimi", "/admin/hediye-cekleri", "04"],
 ["Destek Talepleri", "Müşterilerinize cevap verin", "/admin/destek-talepleri", "05"],
 ["Mağaza Ayarları", "Havale, ödeme ve kargo", "/admin/ayarlar", "06"],
];
export default function AdminPage() {
 const {products,loaded:productsLoaded,error:productError,refreshProducts} = useProducts();
 const {orders,loaded,error,hasMore,refreshOrders} = useOrders();
 const [days,setDays] = useState(30);
 const [now] = useState(()=>new Date());
 const start = new Date(now.getFullYear(),now.getMonth(),now.getDate()-days+1);
 const filtered = orders.filter(order=>new Date(order.createdAt)>=start && new Date(order.createdAt)<=now && order.status!=="Taslak");
 const valid = filtered.filter(order=>!["İptal","İade"].includes(order.status));
 const critical = products.filter(product=>product.active && product.stock<=product.criticalStock).sort((a,b)=>a.stock-b.stock);
 const buckets = Array.from({length:days},(_,index)=>{const date=new Date(start);date.setDate(date.getDate()+index);return {date,count:filtered.filter(order=>new Date(order.createdAt).toLocaleDateString("tr-TR")===date.toLocaleDateString("tr-TR")).length};});
 const maximum = Math.max(1,...buckets.map(bucket=>bucket.count));
 const orderReady = loaded && !error;
 const productReady = productsLoaded && !productError;
 return <main className="akn-dashboard">
  <div className="akn-page-heading"><div><p className="akn-eyebrow">MAĞAZANIZIN KONTROL MERKEZİ</p><h1>Hoş geldiniz</h1><p>Mağazanızın durumunu takip edin, günlük işlemlerinizi yönetin.</p></div><label className="akn-period">Dönem<select value={days} onChange={event=>setDays(Number(event.target.value))}><option value={7}>Son 7 gün</option><option value={30}>Son 30 gün</option><option value={90}>Son 90 gün</option></select></label></div>
  {(error||productError) && <div className="akn-error" role="alert"><p>{error || productError}</p><button type="button" onClick={()=>{void refreshOrders();void refreshProducts();}}>Tekrar dene</button></div>}
  <div className="akn-metrics">
   {[
    {label:"SİPARİŞ TUTARI",value:orderReady?money(valid.reduce((total,order)=>total+order.total,0)):"—",note:"İptal ve iadeler hariç",icon:"₺",color:"mint"},
    {label:"TOPLAM SİPARİŞ",value:orderReady?filtered.length:"—",note:"Seçili dönemde",icon:"↗",color:"blue"},
    {label:"YENİ SİPARİŞ",value:orderReady?filtered.filter(order=>order.status==="Yeni").length:"—",note:"İşlem bekleyen",icon:"◷",color:"orange"},
    {label:"AKTİF ÜRÜN",value:productReady?products.filter(product=>product.active).length:"—",note:"Güncel katalog",icon:"◇",color:"violet"},
   ].map(metric=><div className="akn-panel akn-metric" key={metric.label}><p>{metric.label}</p><div><span className={"akn-metric-icon "+metric.color} aria-hidden="true">{metric.icon}</span><strong>{metric.value}</strong></div><small>{metric.note}</small></div>)}
  </div>
  <div className="akn-overview-grid">
   <section className="akn-panel akn-chart-panel"><div className="akn-panel-heading"><h2>Sipariş hareketleri</h2><span>Son {days} gün</span></div>
    {!orderReady ? <div className="akn-empty">{error ? "Sipariş verisi alınamadı." : "Siparişler yükleniyor…"}</div> : <><div className="akn-chart" role="img" aria-label={"Son "+days+" günde "+filtered.length+" sipariş. Günlük en yüksek sipariş sayısı: "+Math.max(...buckets.map(bucket=>bucket.count))+"."}>{buckets.map((bucket,index)=><div className="akn-chart-column" key={index}><span style={{height:(bucket.count/maximum*100)+"%"}} title={bucket.date.toLocaleDateString("tr-TR")+": "+bucket.count+" sipariş"}/></div>)}{!filtered.length && <p>Bu dönemde sipariş kaydı bulunmuyor.</p>}</div><div className="akn-chart-dates"><span>{start.toLocaleDateString("tr-TR")}</span><span>{now.toLocaleDateString("tr-TR")}</span></div><details className="akn-chart-details"><summary>Günlük sayıları görüntüle</summary><div>{buckets.map((bucket,index)=><p key={index}><span>{bucket.date.toLocaleDateString("tr-TR")}</span><strong>{bucket.count}</strong></p>)}</div></details></>}
    <div className="akn-chart-footer"><span><i/> Sipariş adedi</span><Link href="/admin/istatistikler/siparis">İstatistiklere git ↗</Link></div>
   </section>
   <section className="akn-panel akn-stock-panel"><div className="akn-panel-heading"><h2>Stok takibi</h2><span className="akn-badge">Güncel</span></div><strong className="akn-stock-number">{productReady?critical.length:"—"}</strong><p>Kritik stok seviyesindeki aktif ürün</p><div className="akn-stock-list">{!productReady?<p>{productError?"Stok verisi alınamadı.":"Stoklar yükleniyor…"}</p>:critical.length?critical.slice(0,4).map(product=><div key={product.id}><span>{product.name}</span><strong>{product.stock} adet</strong></div>):<p>Kritik seviyede ürün bulunmuyor.</p>}</div><Link className="akn-outline-link" href="/admin/urunler">Ürün ve stok yönetimi ↗</Link></section>
  </div>
  <section className="akn-panel akn-recent"><div className="akn-panel-heading"><h2>Son siparişler</h2><Link href="/admin/siparisler">Tüm siparişler ↗</Link></div><div className="akn-table-scroll"><table><thead><tr><th>Sipariş</th><th>Müşteri</th><th>Tarih</th><th>Durum</th><th>Tutar</th></tr></thead><tbody>{orderReady && filtered.slice(0,5).map(order=><tr key={order.id}><td>{order.orderNumber}</td><td>{order.customer.fullName}</td><td>{new Date(order.createdAt).toLocaleDateString("tr-TR")}</td><td><span className="akn-badge">{order.status}</span></td><td>{money(order.total)}</td></tr>)}</tbody></table></div>{(!orderReady||!filtered.length)&&<div className="akn-empty">{!loaded?"Siparişler yükleniyor…":error?"Siparişler görüntülenemiyor.":"Seçili dönemde görüntülenecek sipariş yok."}</div>}</section>
  <div className="akn-section-heading"><h2>Hızlı erişim</h2><p>Mağazanız için sık kullandığınız yönetim alanları.</p></div><div className="akn-shortcuts">{shortcuts.map(([title,description,href,number])=><Link href={href} key={href} className="akn-panel akn-shortcut"><span className="akn-shortcut-number">{number}</span><div><h3>{title}</h3><p>{description}</p></div><span aria-hidden="true">↗</span></Link>)}</div>
  <p className="akn-data-note">{hasMore?"Özet, yüklenen siparişlerle sınırlıdır. Önceki kayıtları sipariş ekranından yükleyebilirsiniz. ":"Özet, yüklenen sipariş kayıtlarına göre hesaplanır. "}Sipariş tutarı tahsilat raporu değildir. Havale ödemelerini banka hareketlerinden doğrulayın.</p>
 </main>;
}
