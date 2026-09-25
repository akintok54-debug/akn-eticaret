import {adminGuard} from "@/lib/admin";
import {prisma} from "@/lib/prisma";
const slug="akn-admin-settings";
const defaults={
 firm:{name:"AKIN MOTOSİKLET",legalName:"AKIN MOTOSİKLET (UTKU BAHA AKIN)",website:"www.aknmotosiklet.com",authorized:"UTKU BAHA AKIN",phone:"05051875403",phone2:"0542 154 5403",country:"Türkiye",city:"Sakarya",district:"Serdivan",postalCode:"54100",address:"32 EVLER MAHALLESİ SAHİ GÜVEN SOKAK NO 10/A SERDİVAN/SAKARYA",email:"bahadir_akin@hotmail.com",orderEmail:"bahadir_akin@hotmail.com",taxOffice:"Gümrükönü Vergi Dairesi",taxNumber:"0270652823",kep:"utkubaha.akin@hs09.kep.tr"},
 legal:{membership:"",communication:"",distanceSales:"",preInformation:"",returns:""},
 design:{theme:"AKN",productsPerPage:24,categoryDescription:true,brandDescription:true,productCode:true,stockStatus:true,showPrices:true,quickBuy:true},
 users:[{id:"1",username:"yonetici",role:"Admin",email:"bahadir_akin@hotmail.com",active:true}],
 files:[] as Array<{name:string;url:string}>
};async function load(){
 const row=await prisma.integrationSetting.findUnique({where:{slug}});
 return {...defaults,...((row?.values as object)||{})};
}
export async function GET(request:Request){
 const denied=adminGuard(request);if(denied)return denied;
 try{return Response.json({settings:await load()},{headers:{"Cache-Control":"no-store"}})}
 catch{return Response.json({message:"Ayarlar yüklenemedi."},{status:503})}
}
export async function PATCH(request:Request){
 const denied=adminGuard(request);if(denied)return denied;
 try{const body=await request.json();const current=await load();const next={...current,...body};
 await prisma.integrationSetting.upsert({where:{slug},create:{slug,enabled:true,values:next},update:{enabled:true,values:next}});
 return Response.json({settings:next,message:"Ayarlar kaydedildi."})}
 catch{return Response.json({message:"Ayarlar kaydedilemedi."},{status:503})}
}