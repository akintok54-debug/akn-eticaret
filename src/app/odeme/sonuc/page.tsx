import Link from "next/link";

export default async function PaymentResult({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
 const q=await searchParams;
 const paid=q.paid==="1", canceled=q.cancel==="1", error=!!q.error;
 return <main className="store-container py-16">
  <section className="form-panel max-w-2xl mx-auto">
   <h1 className="text-3xl font-bold mb-4">{paid?"Ödeme başarılı":canceled?"Ödeme iptal edildi":"Ödeme tamamlanmadı"}</h1>
   <p className="notice">{paid?"Kart ödemeniz Sipay üzerinden doğrulandı. Siparişiniz hazırlanmak üzere kaydedildi.":error?"Ödeme sonucu doğrulanamadı. Kartınızdan çekim olduysa sipariş ekranındaki ödeme durumu kontrol edilmelidir.":"Ödeme henüz başarılı görünmüyor. Tekrar deneyebilir veya havale ile devam edebilirsiniz."}</p>
   <div className="flex flex-wrap gap-3 mt-6">
    <Link href="/siparisler" className="button-dark">Siparişlerim</Link>
    <Link href="/urunler" className="button-red">Alışverişe dön</Link>
   </div>
  </section>
 </main>;
}
