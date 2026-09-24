import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import ts from "typescript";
import {unitPrice} from "../src/lib/pricing.ts";
import * as membership from "../src/lib/membership.ts";
import {isValidTurkishIban} from "../src/lib/bank.ts";
const require=createRequire(import.meta.url);
function load(path,imports={}){
 const source=readFileSync(new URL("../src/"+path,import.meta.url),"utf8");
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};
 new Function("require","exports",code)(name=>name in imports?imports[name]:require(name),exports);
 return exports;
}
const request=(body,method="POST",origin="https://shop.test")=>new Request("https://shop.test/api/test",{method,headers:{"Content-Type":"application/json",origin},body:JSON.stringify(body)});
const transaction=db=>({...db,$transaction:async fn=>fn({$queryRaw:async()=>[],...db})});
const commerce=load("lib/commerce.ts",{"@/lib/prisma":{prisma:{}},"@/lib/checkout":{checkoutSettings:()=>({})},"@/lib/bank":{isValidTurkishIban}});
test("pricing applies only approved dealer base and the larger active matching discount",()=>{
 const product={retailPrice:100,dealerPrice:80};
 assert.equal(unitPrice(product,null),100);
 assert.equal(unitPrice(product,{type:"dealer",dealerStatus:"pending",discountRate:0}),100);
 assert.equal(unitPrice(product,{type:"dealer",dealerStatus:"approved",discountRate:5,group:{type:"dealer",active:true,discountRate:10}}),72);
 assert.equal(unitPrice(product,{type:"retail",dealerStatus:"none",discountRate:5,group:{type:"dealer",active:true,discountRate:80}}),95);
});
test("coupon rejects inactive, expired, not started, exhausted and under minimum baskets",()=>{
 const base={active:true,discountPercent:10,minSubtotal:100,maxUses:3,usedCount:0,startsAt:null,endsAt:null};
 assert.equal(commerce.couponDiscount(base,12345),1235);
 for(const patch of [{active:false},{endsAt:new Date(0)},{startsAt:new Date("2099-01-01")},{usedCount:3},{minSubtotal:200}])assert.throws(()=>commerce.couponDiscount({...base,...patch},12345),/COUPON/);
 assert.equal(commerce.settingsSchema.safeParse({enabled:true,bankName:"AKN",iban:"TR000",shipping:99,threshold:2000}).success,false);
});
test("password hashes have random salts and reject wrong or malformed hashes",async()=>{
 const h=load("lib/customer-session.ts",{"next/headers":{},"@/lib/prisma":{}});
 const a=await h.passwordHash("long-example-password"),b=await h.passwordHash("long-example-password");
 assert.notEqual(a,b);assert(!a.includes("long-example-password"));
 assert.equal(await h.passwordMatches("long-example-password",a),true);
 assert.equal(await h.passwordMatches("wrong-password",a),false);
 assert.equal(await h.passwordMatches("wrong","bad"),false);
 assert.equal(h.sameOrigin(request({},"POST","https://evil.test")),false);
});
test("customer session uses a hashed token, HttpOnly cookie and rejects disabled or expired accounts",async()=>{
 let record,cookie;
 const customer={id:"c",active:true};
 const db={customerSession:{create:async v=>{record=v.data;},findUnique:async()=>({...record,account:{customer}})}};
 const h=load("lib/customer-session.ts",{"next/headers":{cookies:async()=>({get:()=>cookie?{value:cookie.value}:undefined,set:(name,value,options)=>{cookie={name,value,options};}})},"@/lib/prisma":{prisma:db}});
 await h.createCustomerSession("account");assert.notEqual(record.id,cookie.value);assert.equal(cookie.options.httpOnly,true);assert.equal(cookie.options.sameSite,"lax");
 assert.equal((await h.currentCustomer()).id,"c");customer.active=false;assert.equal(await h.currentCustomer(),null);
 customer.active=true;record.expiresAt=new Date(0);assert.equal(await h.currentCustomer(),null);
});
function account(db,auth={}){return load("app/api/account/route.ts",{
 "@/lib/prisma":{prisma:db},"@/lib/membership":membership,"@/lib/admin":{adminGuard:()=>Response.json({},{status:401})},
 "@/lib/customer-session":{sameOrigin:r=>r.headers.get("origin")==="https://shop.test",passwordHash:async()=>"hash",passwordMatches:async()=>false,currentCustomer:async()=>null,createCustomerSession:async()=>{},endCustomerSession:async()=>{},...auth}
});}
test("registration cannot claim an existing customer by phone or inject dealer role",async()=>{
 let created;
 const base={action:"register",email:"TEST@example.com",password:"ten-characters-plus",phone:"05551234567",fullName:"Test User",type:"dealer",discountRate:100};
 const h=account(transaction({customer:{findFirst:async()=>null},customerAccount:{create:async({data})=>{created=data;return{id:"a"};}}}));
 assert.equal((await h.POST(request(base))).status,201);assert.equal(created.email,"test@example.com");assert.equal(created.customer.create.type,undefined);assert.equal(created.customer.create.discountRate,undefined);
 const existing=account(transaction({customer:{findFirst:async()=>({id:"existing"})}}));
 assert.equal((await existing.POST(request(base))).status,409);
 assert.equal((await h.POST(request(base,"POST","https://evil.test"))).status,403);
});
test("five failed logins lock the account and provisioning requires admin",async()=>{
 let changed;
 const db=transaction({customerAccount:{findUnique:async()=>({id:"a",customer:{active:true},failedLogins:4,passwordHash:"hash",lockedUntil:null}),update:async({data})=>{changed=data;}}});
 const h=account(db);
 assert.equal((await h.POST(request({action:"login",email:"test@example.com",password:"bad"}))).status,401);
 assert.equal(changed.failedLogins,5);assert(changed.lockedUntil>new Date());
 assert.equal((await h.POST(request({action:"provision",customerId:"c",password:"long-enough-password"}))).status,401);
});
function orderRoute(db,admin=true,buyer=null,guest=null){return load("app/api/orders/[id]/route.ts",{
 "@/lib/prisma":{prisma:db},"@/lib/admin":{isAdmin:()=>admin,adminGuard:()=>null},"@/lib/order-view":{orderView:o=>o},"@/lib/membership":membership,
 "@/lib/customer-session":{currentCustomer:async()=>buyer,sameOrigin:r=>r.headers.get("origin")==="https://shop.test"},"@/lib/guest-session":{guestSession:async()=>guest}
});}
const context={params:Promise.resolve({id:"o"})};
test("cancel restores stock once even when repeated and forbids reopening",async()=>{
 let stock=0;let order={id:"o",status:"Yeni",paymentStatus:"pending",items:[{productId:"p",quantity:2}]};
 const h=orderRoute(transaction({order:{findUniqueOrThrow:async()=>order,update:async({data})=>(order={...order,...data})},product:{update:async({data})=>{stock+=data.stock.increment;}}}));
 assert.equal((await h.PATCH(request({status:"İptal"},"PATCH"),context)).status,200);
 assert.equal((await h.PATCH(request({status:"İptal"},"PATCH"),context)).status,200);assert.equal(stock,2);
 assert.equal((await h.PATCH(request({status:"Yeni"},"PATCH"),context)).status,409);
});
test("shipping requires payment, carrier and tracking; refund cannot erase pending payment",async()=>{
 const order={id:"o",status:"Hazırlanıyor",paymentStatus:"pending",items:[]};
 const h=orderRoute(transaction({order:{findUniqueOrThrow:async()=>order,update:async({data})=>({...order,...data})}}));
 assert.equal((await h.PATCH(request({status:"Kargoda"},"PATCH"),context)).status,409);
 assert.equal((await h.PATCH(request({status:"Kargoda",paymentStatus:"paid"},"PATCH"),context)).status,409);
 assert.equal((await h.PATCH(request({status:"Kargoda",paymentStatus:"paid",shippingCompany:"Kargo",trackingNumber:"123"},"PATCH"),context)).status,200);
 assert.equal((await h.PATCH(request({status:"İptal",paymentStatus:"refunded"},"PATCH"),context)).status,409);
 assert.equal((await h.PATCH(request({trackingUrl:"javascript:alert(1)"},"PATCH"),context)).status,400);
});
test("return request is ownership scoped and cannot manipulate order status or stock",async()=>{
 let update;
 const h=orderRoute({order:{updateMany:async v=>{update=v;return {count:1};}}},false,{id:"customer"});
 assert.equal((await h.PATCH(request({action:"request_return",returnReason:"Ürün uygun değil",status:"İade"},"PATCH"),context)).status,200);
 assert.deepEqual(update.where.OR,[{customerId:"customer"}]);assert.equal(update.data.status,undefined);assert.equal(update.where.returnRequestedAt,null);
 const anonymous=orderRoute({},false);assert.equal((await anonymous.PATCH(request({action:"request_return",returnReason:"Ürün uygun değil"},"PATCH"),context)).status,401);
});
test("support access is constrained to the signed-in customer",async()=>{
 let query;
 const h=load("app/api/support-tickets/route.ts",{"@/lib/prisma":{prisma:{supportTicket:{findMany:async q=>{query=q;return[];}}}},"@/lib/admin":{isAdmin:()=>false},"@/lib/customer-session":{currentCustomer:async()=>({id:"mine"}),sameOrigin:()=>true},"@/lib/membership":membership});
 assert.equal((await h.GET(new Request("https://shop.test"))).status,200);assert.deepEqual(query.where,{customerId:"mine"});
});

test("catalog changes require admin and refuse to deactivate entries used by products",async()=>{
 const imports={"@/lib/prisma":{prisma:transaction({product:{count:async()=>1}})},"@/lib/admin":{adminGuard:()=>null},"@/lib/membership":membership};
 const h=load("app/api/catalog/route.ts",imports);
 assert.equal((await h.PATCH(request({kind:"category",action:"deactivate",name:"Fren"},"PATCH"))).status,409);
 const denied=load("app/api/catalog/route.ts",{...imports,"@/lib/admin":{adminGuard:()=>Response.json({},{status:401})}});
 assert.equal((await denied.PATCH(request({kind:"brand",action:"add",name:"Test"},"PATCH"))).status,401);
});
test("order creation uses catalog prices and idempotency prevents duplicate stock decrement",async()=>{
 let created=null,stock=10,uses=0;
 const product={id:"p",active:true,name:"Ürün",sku:"SKU",barcode:null,retailPrice:100,dealerPrice:80,vatRate:20};
 const db=transaction({order:{findUnique:async()=>created,create:async({data})=>(created={id:"order",...data,items:data.items.create})},product:{findMany:async()=>[product],updateMany:async({data})=>{stock-=data.stock.decrement;return{count:1};}},coupon:{findUnique:async()=>({active:true,discountPercent:10,minSubtotal:0,maxUses:2,usedCount:0,startsAt:null,endsAt:null}),update:async()=>{uses++;}}});
 const checkout=load("lib/checkout.ts",{"./bank.ts":{isValidTurkishIban}});
 const h=load("app/api/orders/route.ts",{
 "@/lib/prisma":{prisma:db},"@/lib/admin":{isAdmin:()=>false},"@/lib/customer-session":{currentCustomer:async()=>null},"@/lib/pricing":{unitPrice},"@/lib/guest-session":{guestSession:async()=>"guest"},
 "@/lib/checkout":checkout,"@/lib/commerce":{storeSettings:async()=>({enabled:true,shipping:0,threshold:0}),couponDiscount:commerce.couponDiscount},"@/lib/order-view":{orderView:o=>o}
 });
 const body={checkoutKey:"85f930af-dbf4-4c8a-b5d3-d013c9788f2f",expectedTotal:180,couponCode:"TEST",customer:{fullName:"Test Müşteri",phone:"05551234567",email:"test@example.com"},delivery:{city:"İstanbul",district:"Kadıköy",address:"Örnek Mahallesi Sokak 12"},invoice:{type:"individual"},paymentMethod:"transfer",items:[{productId:"p",quantity:2,price:0.01}]};
 assert.equal((await h.POST(request(body))).status,201);
 assert.equal(created.total,180);assert.equal(created.discountTotal,20);assert.equal(created.items[0].unitPrice,100);
 assert.equal((await h.POST(request(body))).status,200);assert.equal(stock,8);assert.equal(uses,1);
});

test("order pagination keeps customer ownership and returns a bounded continuation",async()=>{
 let query;
 const rows=Array.from({length:101},(_,i)=>({id:"order-"+i}));
 const h=load("app/api/orders/route.ts",{
 "@/lib/prisma":{prisma:{order:{findMany:async q=>{query=q;return rows;}}}},
 "@/lib/admin":{isAdmin:()=>false},"@/lib/customer-session":{currentCustomer:async()=>({id:"mine"})},"@/lib/pricing":{},"@/lib/guest-session":{guestSession:async()=>null},
 "@/lib/checkout":{},"@/lib/commerce":{},"@/lib/order-view":{orderView:o=>o}
 });
 const response=await h.GET(new Request("https://shop.test/api/orders?cursor=older"));
 const data=await response.json();assert.equal(response.status,200);assert.equal(data.orders.length,100);assert.equal(data.nextCursor,"order-99");
 assert.deepEqual(query.where,{OR:[{customerId:"mine"}]});assert.equal(query.take,101);assert.deepEqual(query.cursor,{id:"older"});assert.equal(query.skip,1);
});
