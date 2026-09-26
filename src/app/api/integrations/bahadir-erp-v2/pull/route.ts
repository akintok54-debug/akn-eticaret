import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/admin";
import { pullErpCatalog } from "@/lib/erp-sync";
export async function POST(request:Request){
 const denied=adminGuard(request); if(denied)return denied;
 try{return NextResponse.json({success:true,...await pullErpCatalog()});}
 catch(e){return NextResponse.json({success:false,message:e instanceof Error?e.message:"ERP senkron hatası"},{status:502});}
}
