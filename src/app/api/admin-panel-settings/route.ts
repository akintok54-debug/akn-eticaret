import {adminGuard} from "@/lib/admin";
import {prisma} from "@/lib/prisma";
import {revalidatePath} from "next/cache";
import {createHash} from "node:crypto";
import sharp from "sharp";
import {ASSET_PREFIX, defaultDesign, designSchema, normalizeDesign} from "@/lib/store-design";
const slug="akn-admin-settings";
const defaults={
 firm:{name:"AKIN MOTOSİKLET",legalName:"AKIN MOTOSİKLET (UTKU BAHA AKIN)",website:"www.aknmotosiklet.com",authorized:"UTKU BAHA AKIN",phone:"05051875403",phone2:"0542 154 5403",country:"Türkiye",city:"Sakarya",district:"Serdivan",postalCode:"54100",address:"32 EVLER MAHALLESİ SAHİ GÜVEN SOKAK NO 10/A SERDİVAN/SAKARYA",email:"bahadir_akin@hotmail.com",orderEmail:"bahadir_akin@hotmail.com",taxOffice:"Gümrükönü Vergi Dairesi",taxNumber:"0270652823",kep:"utkubaha.akin@hs09.kep.tr"},
 legal:{membership:"",communication:"",distanceSales:"",preInformation:"",returns:""},
 design:defaultDesign,
 users:[{id:"1",username:"yonetici",role:"Admin",email:"bahadir_akin@hotmail.com",active:true}],
 files:[] as Array<{name:string;url:string}>
};async function load(){
 const row=await prisma.integrationSetting.findUnique({where:{slug}});
 const values = (row?.values as Record<string, unknown>) || {};
 return {...defaults,...values,design:normalizeDesign(values.design)};
}
export async function GET(request:Request){
 const asset = new URL(request.url).searchParams.get("asset");
 if(asset!==null)return serveImage(asset);
 const denied=adminGuard(request);if(denied)return denied;
 try{return Response.json({settings:await load()},{headers:{"Cache-Control":"no-store"}})}
 catch{return Response.json({message:"Ayarlar yüklenemedi."},{status:503})}
}
export async function PATCH(request:Request){
 const denied=adminGuard(request);if(denied)return denied;
 try {
  const body = JSON.parse(await limitedBody(request, 128 * 1024));
  if (!body || Array.isArray(body) || typeof body !== "object") return Response.json({message:"Ayarlar geçersiz."},{status:400});
  const keys=Object.keys(body);
  if(keys.length!==1 || !["firm","legal","design","users","files"].includes(keys[0])) return Response.json({message:"Tek bir ayar bölümü gönderin."},{status:400});
  if(keys[0]==="design") {
   const parsed=designSchema.safeParse(body.design);
   if(!parsed.success)return Response.json({message:parsed.error.issues[0]?.message || "Tasarım alanlarını kontrol edin."},{status:400});
   body.design=parsed.data;
  }
  const current=await load();const next={...current,...body};
  await prisma.integrationSetting.upsert({where:{slug},create:{slug,enabled:true,values:next},update:{enabled:true,values:next}});
  if(body.design)revalidatePath("/", "layout");
  return Response.json({settings:next,message:"Ayarlar kaydedildi."});
 } catch(error) {
  if(error instanceof SyntaxError)return Response.json({message:"Geçerli JSON gönderin."},{status:400});
  return Response.json({message:error instanceof SizeError ? error.message : "Ayarlar kaydedilemedi."},{status:error instanceof SizeError ? 413 : 503});
 }
}

class SizeError extends Error {}
async function limitedBody(request:Request,max:number) {
 if(Number(request.headers.get("content-length"))>max)throw new SizeError("Dosya veya ayar boyutu sınırı aşıldı.");
 const reader=request.body?.getReader();if(!reader)return "";
 const chunks:Uint8Array[]=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw new SizeError("Dosya veya ayar boyutu sınırı aşıldı.");}chunks.push(value);}}
 finally{reader.releaseLock();}
 return Buffer.concat(chunks).toString("utf8");
}

async function serveImage(id:string){
 if(!/^[a-f0-9]{64}$/.test(id))return new Response(null,{status:404});
 try{
  const row=await prisma.integrationSetting.findUnique({where:{slug:ASSET_PREFIX+id}});
  const image=row?.values as {data?:string;mime?:string}|null;
  if(!image?.data||image.mime!=="image/webp")return new Response(null,{status:404});
  return new Response(Buffer.from(image.data,"base64"),{headers:{"Content-Type":"image/webp","Cache-Control":"public, max-age=31536000, immutable","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'; sandbox"}});
 }catch{return new Response(null,{status:503});}
}

// Images live in the existing database; serverless filesystem storage is not used.
export async function POST(request:Request){
 const denied=adminGuard(request);if(denied)return denied;
 let buffer:Buffer;
 try{
  const body=JSON.parse(await limitedBody(request, 4 * 1024 * 1024));
  if(typeof body.data!=="string"||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(body.data))return Response.json({message:"JPG, PNG veya WebP görseli seçin."},{status:400});
  buffer=Buffer.from(body.data.slice(body.data.indexOf(",")+1),"base64");
  if(!buffer.length||buffer.length>3*1024*1024)throw new SizeError("Görsel en fazla 3 MB olabilir.");
 }catch(error){return Response.json({message:error instanceof SizeError?error.message:"Görsel okunamadı."},{status:error instanceof SizeError?413:400});}
 let image:Buffer;
 try {
  const pipeline=sharp(buffer,{limitInputPixels:24_000_000,failOn:"warning"});
  const metadata=await pipeline.metadata();
  if(!metadata.format||!["jpeg","png","webp"].includes(metadata.format)||(metadata.pages||1)>1)throw new Error("format");
  image=await pipeline.rotate().resize({width:1920,height:1920,fit:"inside",withoutEnlargement:true}).webp({quality:80}).toBuffer();
  if(image.length>1024*1024)return Response.json({message:"Görseli küçülterek tekrar yükleyin."},{status:413});
 }catch{return Response.json({message:"Görsel bozuk, desteklenmiyor veya 24 megapiksel sınırını aşıyor."},{status:400});}
 try{
  const id=createHash("sha256").update(image).digest("hex");
  await prisma.integrationSetting.upsert({where:{slug:ASSET_PREFIX+id},create:{slug:ASSET_PREFIX+id,enabled:true,values:{mime:"image/webp",data:image.toString("base64")}},update:{}});
  return Response.json({url:"/api/admin-panel-settings?asset="+id,message:"Görsel yüklendi. Yayınlamak için tasarımı kaydedin."},{status:201});
 }catch{return Response.json({message:"Görsel kaydedilemedi. Tekrar deneyin."},{status:503});}

}
