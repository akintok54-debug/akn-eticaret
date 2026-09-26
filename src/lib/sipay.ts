import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/site-configuration";

async function sipayConfig(){
 const row=await prisma.integrationSetting.findUnique({where:{slug:"sipay"}});
 if(!row?.enabled) throw new Error("SIPAY_DISABLED");
 const v=(row.values as Record<string,string>)||{};
 const merchantKey=v.merchantKey?decryptSecret(v.merchantKey):"";
 const appId=v.apiKey?decryptSecret(v.apiKey):"";
 const appSecret=v.merchantSecret?decryptSecret(v.merchantSecret):"";
 if(!merchantKey||!appId||!appSecret) throw new Error("SIPAY_CONFIG");
 const live=/canlı|live|prod/i.test(String(v.environment||""));
 return {merchantKey,appId,appSecret,baseUrl:live?"https://app.sipay.com.tr":"https://provisioning.sipay.com.tr"};
}

export async function sipayReady(){
 const row=await prisma.integrationSetting.findUnique({where:{slug:"sipay"}});
 const v=(row?.values as Record<string,string>|null)||{};
 return !!row?.enabled&&["merchantKey","apiKey","merchantSecret"].every(k=>!!v[k]);
}

async function sipayToken(c:Awaited<ReturnType<typeof sipayConfig>>){
 const r=await fetch(c.baseUrl+"/ccpayment/api/token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({app_id:c.appId,app_secret:c.appSecret,app_lang:"tr"})});
 const j=await r.json().catch(()=>null) as {data?:{token?:string};status_description?:string}|null;
 const token=j?.data?.token;
 if(!r.ok||!token)throw new Error(j?.status_description||"SIPAY_TOKEN");
 return token;
}

export async function createSipayLink(order:{
 id:string;orderNumber:string;customerName:string;customerEmail:string|null;customerPhone:string;
 city:string;district:string;deliveryAddress:string;total:number;
 items:Array<{productName:string;quantity:number;unitPrice:number}>
},origin:string){
 const c=await sipayConfig(),token=await sipayToken(c);
 const names=order.customerName.trim().split(/\s+/); const surname=names.length>1?names.pop()!:"AKN"; const name=names.join(" ")||order.customerName;
 const invoice={
  invoice_id:order.id,invoice_description:"AKN Motosiklet "+order.orderNumber,total:order.total.toFixed(2),discount:0,coupon:null,
  return_url:origin+"/api/payments/sipay/callback?orderId="+encodeURIComponent(order.id),
  cancel_url:origin+"/odeme/sonuc?orderId="+encodeURIComponent(order.id)+"&cancel=1",
  is_comission_from_user:0,commission_for_installment:"1,2,3,4,5,6,7,8,9,10,11,12",
  items:order.items.map(i=>({name:i.productName,price:i.unitPrice.toFixed(2),quantity:i.quantity,description:i.productName})),
  bill_address1:order.deliveryAddress,bill_address2:order.district,bill_city:order.city,bill_postcode:"",bill_state:order.city,
  bill_email:order.customerEmail||"",bill_phone:order.customerPhone,response_method:"POST"
 };
 const r=await fetch(c.baseUrl+"/ccpayment/purchase/link",{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({merchant_key:c.merchantKey,name,surname,currency_code:"TRY",invoice:JSON.stringify(invoice)})});
 const j=await r.json().catch(()=>null) as {status?:boolean;link?:string;order_id?:string;status_description?:string;message?:string}|null;
 if(!r.ok||!j?.status||!j.link)throw new Error(j?.message||j?.status_description||"SIPAY_LINK");
 return {link:j.link,reference:String(j.order_id||"")};
}

function makeHash(invoiceId:string,merchantKey:string,appSecret:string){
 const plain=invoiceId+"|"+merchantKey;
 const iv=createHash("sha1").update(randomBytes(16)).digest("hex").slice(0,16);
 const password=createHash("sha1").update(appSecret).digest("hex");
 const salt=createHash("sha1").update(randomBytes(16)).digest("hex").slice(0,4);
 const keyText=createHash("sha256").update(password+salt).digest("hex").slice(0,32);
 const cipher=createCipheriv("aes-256-cbc",Buffer.from(keyText,"utf8"),Buffer.from(iv,"utf8"));
 const encrypted=Buffer.concat([cipher.update(plain,"utf8"),cipher.final()]).toString("base64");
 return (iv+":"+salt+":"+encrypted).replaceAll("/","__");
}

export async function checkSipayPayment(invoiceId:string){
 const c=await sipayConfig(),token=await sipayToken(c);
 const response=await fetch(c.baseUrl+"/ccpayment/api/checkstatus",{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({invoice_id:invoiceId,merchant_key:c.merchantKey,hash_key:makeHash(invoiceId,c.merchantKey,c.appSecret)})});
 const data=await response.json().catch(()=>null) as Record<string,unknown>|null;
 if(!response.ok||!data)throw new Error("SIPAY_STATUS");
 const paid=Number(data.status_code)===100&&String(data.transaction_status||"")==="Completed"&&String(data.transaction_type||"Auth")==="Auth";
 return {paid,data};
}

export async function createSipayAccountPaymentLink(payment:{id:string;amount:number},customer:{fullName:string;email:string|null;phone:string},origin:string){
 const c=await sipayConfig(),token=await sipayToken(c);
 const names=customer.fullName.trim().split(/\s+/),surname=names.length>1?names.pop()!:"AKN",name=names.join(" ")||customer.fullName;
 const invoice={invoice_id:"CARI-"+payment.id,invoice_description:"AKN Motosiklet cari hesap ödemesi",total:payment.amount.toFixed(2),discount:0,coupon:null,
  return_url:origin+"/api/payments/sipay/account-callback?paymentId="+encodeURIComponent(payment.id),
  cancel_url:origin+"/cari-odeme?paymentId="+encodeURIComponent(payment.id)+"&cancel=1",is_comission_from_user:0,
  commission_for_installment:"1,2,3,4,5,6,7,8,9,10,11,12",items:[{name:"Cari hesap ödemesi",price:payment.amount.toFixed(2),quantity:1,description:"Cari hesap kart tahsilatı"}],
  bill_address1:"AKN Motosiklet",bill_address2:"",bill_city:"Sakarya",bill_postcode:"",bill_state:"Sakarya",bill_email:customer.email||"",bill_phone:customer.phone,response_method:"POST"};
 const r=await fetch(c.baseUrl+"/ccpayment/purchase/link",{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({merchant_key:c.merchantKey,name,surname,currency_code:"TRY",invoice:JSON.stringify(invoice)})});
 const j=await r.json().catch(()=>null) as {status?:boolean;link?:string;order_id?:string;status_description?:string;message?:string}|null;
 if(!r.ok||!j?.status||!j.link)throw new Error(j?.message||j?.status_description||"SIPAY_LINK");
 return {link:j.link,reference:String(j.order_id||"")};
}
