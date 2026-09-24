import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkoutSettings } from "@/lib/checkout";
import { isValidTurkishIban } from "@/lib/bank";

export const settingsSchema=z.object({enabled:z.boolean(),bankName:z.string().trim().max(200),iban:z.string().trim().max(50),shipping:z.number().finite().min(0).max(100000),threshold:z.number().finite().min(0).max(10000000)}).refine(v=>!v.enabled||(v.bankName.length>=2&&isValidTurkishIban(v.iban)),"Satış için geçerli hesap adı ve Türk IBAN gerekli.");
export const couponSchema=z.object({id:z.string().optional(),code:z.string().trim().min(3).max(50).regex(/^[A-Za-z0-9_-]+$/).transform(v=>v.toUpperCase()),description:z.string().trim().max(300).default(""),discountPercent:z.number().finite().gt(0).max(100),minSubtotal:z.number().finite().min(0),maxUses:z.number().int().min(1).nullable(),active:z.boolean(),startsAt:z.iso.datetime().nullable(),endsAt:z.iso.datetime().nullable()}).refine(v=>!v.startsAt||!v.endsAt||v.endsAt>v.startsAt);
export async function storeSettings(){
 const saved=await prisma.storeSettings.findUnique({where:{id:"main"}});
 if(saved)return {...saved,enabled:saved.enabled&&settingsSchema.safeParse(saved).success};
 const env=checkoutSettings();
 return {enabled:env.enabled,shipping:env.shipping,threshold:env.threshold,bankName:process.env.BANK_ACCOUNT_NAME??"",iban:process.env.BANK_IBAN??""};
}
export function couponDiscount(coupon:{active:boolean;discountPercent:number;minSubtotal:number;maxUses:number|null;usedCount:number;startsAt:Date|null;endsAt:Date|null}|null,subtotalCents:number,now=new Date()){
 if(!coupon||!coupon.active||(coupon.startsAt&&coupon.startsAt>now)||(coupon.endsAt&&coupon.endsAt<=now)||(coupon.maxUses!==null&&coupon.usedCount>=coupon.maxUses)||subtotalCents<Math.round(coupon.minSubtotal*100))throw new Error("COUPON");
 return Math.min(subtotalCents,Math.round(subtotalCents*coupon.discountPercent/100));
}
