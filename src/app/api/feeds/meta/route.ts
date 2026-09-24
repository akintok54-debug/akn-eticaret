import { prisma } from "@/lib/prisma";

function esc(v:string){return v.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]!));}
function base(request:Request){return process.env.SITE_URL || new URL(request.url).origin;}

export async function GET(request:Request){
 const products=await prisma.product.findMany({where:{active:true,stock:{gt:0}},orderBy:{updatedAt:"desc"},take:5000});
 const root=base(request);
 const items=products.map(p=>`<item><g:id>${esc(p.sku)}</g:id><g:title>${esc(p.name)}</g:title><g:description>${esc(p.description||p.name)}</g:description><g:link>${esc(root+"/urunler/"+p.id)}</g:link>${p.image?`<g:image_link>${esc(p.image)}</g:image_link>`:""}<g:availability>in_stock</g:availability><g:condition>new</g:condition><g:price>${p.retailPrice.toFixed(2)} TRY</g:price><g:brand>${esc(p.brand)}</g:brand><g:mpn>${esc(p.sku)}</g:mpn></item>`).join("");
 const xml=`<?xml version="1.0" encoding="UTF-8"?><rss xmlns:g="http://base.google.com/ns/1.0" version="2.0"><channel><title>AKN Motosiklet Meta Katalog</title><link>${esc(root)}</link><description>AKN Motosiklet ürün kataloğu</description>${items}</channel></rss>`;
 return new Response(xml,{headers:{"Content-Type":"application/xml; charset=utf-8","Cache-Control":"public, max-age=300"}});
}
