export type IntegrationItem = {
  slug: string;
  name: string;
  description: string;
  type: string;
  mode: "settings" | "feed" | "external";
  fields?: Array<{ key: string; label: string; secret?: boolean; placeholder?: string }>;
};

export const integrationItems: IntegrationItem[] = [
  { slug:"bahadir-erp-v2", name:"Bahadır ERP V2", description:"Ürün, stok, fiyat, müşteri ve sipariş verilerini AKN E-Ticaret ile çift yönlü senkronize edin.", type:"ERP", mode:"settings", fields:[{key:"baseUrl",label:"ERP API adresi",placeholder:"https://www.benimmuhasebe.com"},{key:"tenantId",label:"Tenant / Firma Kimliği"},{key:"apiToken",label:"ERP API erişim anahtarı",secret:true}] },
  { slug:"google-merchant", name:"Google Merchant Center", description:"Google alışveriş kanalı için ürün feedini yönetin.", type:"Satış Kanalı", mode:"feed" },
  { slug:"meta", name:"Meta Pixel / Conversions API", description:"Facebook ve Instagram reklam ölçümü için Pixel ve sunucu tarafı erişim bilgilerini yönetin.", type:"Reklam & Ölçüm", mode:"settings", fields:[{key:"pixelId",label:"Pixel ID"},{key:"accessToken",label:"Conversions API erişim anahtarı",secret:true}] },
  { slug:"google-analytics", name:"Google Analytics 4", description:"GA4 ölçüm kimliğini mağazaya bağlayın.", type:"Analitik", mode:"settings", fields:[{key:"measurementId",label:"Ölçüm Kimliği",placeholder:"G-XXXXXXXXXX"}] },
  { slug:"google-tag-manager", name:"Google Tag Manager", description:"Etiketleri tek merkezden yönetmek için GTM kapsayıcı kimliğini kaydedin.", type:"Analitik", mode:"settings", fields:[{key:"containerId",label:"Container ID",placeholder:"GTM-XXXXXXX"}] },
  { slug:"tiktok-pixel", name:"TikTok Pixel", description:"TikTok reklam dönüşümleri için Pixel kimliğini yönetin.", type:"Reklam & Ölçüm", mode:"settings", fields:[{key:"pixelId",label:"Pixel ID"}] },
  { slug:"feed", name:"Feed / XML", description:"Google, Meta, bayi ve diğer kanallar için canlı ürün çıktıları.", type:"Ürün Çıktısı", mode:"feed" },
  { slug:"api", name:"API Yönetimi", description:"Harici sistem bağlantıları için güvenli API yapılandırma alanı.", type:"Geliştirici", mode:"external" },
];
