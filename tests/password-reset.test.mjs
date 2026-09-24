import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import {createHash} from "node:crypto";
import ts from "typescript";
const require=createRequire(import.meta.url);
function load(path,imports){const code=ts.transpileModule(readFileSync(new URL("../src/"+path,import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const exports={};new Function("require","exports",code)(name=>name in imports?imports[name]:require(name),exports);return exports;}
const request=(body,origin="https://shop.test")=>new Request("https://shop.test/api/password-reset",{method:"POST",headers:{"Content-Type":"application/json",origin},body:JSON.stringify(body)});
function harness({account=null,ready=true,sendFails=false}={}){
 const jobs=[],sent=[];let deleted=0,hashCalls=0;
 const db={customerAccount:{findUnique:async({where})=>where.resetTokenHash?account?.resetTokenHash===where.resetTokenHash?account:null:account,
 update:async({data})=>Object.assign(account,data),updateMany:async({where,data})=>{if(!account||account.resetTokenHash!==where.resetTokenHash||account.resetExpiresAt<=new Date()||!account.customer.active)return{count:0};Object.assign(account,data);return{count:1};}},
 customerSession:{deleteMany:async()=>{deleted++;}},$queryRaw:async()=>[]};
 db.$transaction=async fn=>fn(db);
 const route=load("app/api/password-reset/route.ts",{"@/lib/prisma":{prisma:db},"@/lib/customer-session":{sameOrigin:r=>r.headers.get("origin")==="https://shop.test",passwordHash:async()=>{hashCalls++;return"new-hash";}},"@/lib/site-configuration":{siteConfiguration:async()=>({})},"@/lib/mail":{mailReady:()=>ready,sendResetMail:async(s,email,token)=>{if(sendFails)throw new Error("mail");sent.push({email,token});}},"next/server":{after:fn=>jobs.push(fn)}});
 return{route,jobs,sent,deleted:()=>deleted,hashCalls:()=>hashCalls};
}
const member=()=>({id:"a",email:"member@example.com",customer:{active:true},resetRequests:0,passwordHash:"old",resetTokenHash:null,resetExpiresAt:null,resetRequestedAt:null,resetWindowAt:null});
test("reset requests reject foreign origins and never falsely report mail when disabled",async()=>{
 const h=harness({ready:false});assert.equal((await h.route.POST(request({action:"request",email:"member@example.com"},"https://evil.test"))).status,403);
 assert.equal((await h.route.POST(request({action:"request",email:"member@example.com"}))).status,503);assert.equal(h.jobs.length,0);
});
test("known and unknown accounts receive identical responses; hash-only storage and cooldown",async()=>{
 const a=member(),h=harness({account:a}),missing=harness();const body={action:"request",email:"member@example.com"};
 const first=await h.route.POST(request(body)),second=await missing.route.POST(request(body));assert.equal(first.status,202);assert.deepEqual(await first.json(),await second.json());assert.equal(h.sent.length,0);
 await h.jobs.shift()();await missing.jobs.shift()();assert.equal(h.sent.length,1);assert.equal(missing.sent.length,0);
 assert.equal(a.resetTokenHash,createHash("sha256").update(h.sent[0].token).digest("hex"));assert.notEqual(a.resetTokenHash,h.sent[0].token);
 assert(a.resetExpiresAt>Date.now()+14*60000);assert(a.resetExpiresAt<=Date.now()+15*60000);
 await h.route.POST(request(body));await h.jobs.shift()();assert.equal(h.sent.length,1);
 a.resetRequestedAt=new Date(0);a.resetRequests=5;await h.route.POST(request(body));await h.jobs.shift()();assert.equal(h.sent.length,1);
});
test("reset tokens are single-use under concurrent submissions and revoke sessions",async()=>{
 const a=member(),h=harness({account:a});await h.route.POST(request({action:"request",email:a.email}));await h.jobs.shift()();
 const body={action:"reset",token:h.sent[0].token,password:"new-password-123"};
 const responses=await Promise.all([h.route.POST(request(body)),h.route.POST(request(body))]);assert.deepEqual(responses.map(r=>r.status).sort(),[200,400]);
 assert.equal(a.resetTokenHash,null);assert.equal(a.passwordHash,"new-hash");assert.equal(h.deleted(),1);assert.equal((await h.route.POST(request(body))).status,400);
});
test("expired, inactive, malformed and weak reset attempts cannot change credentials",async()=>{
 const token="a".repeat(64),a=member();a.resetTokenHash=createHash("sha256").update(token).digest("hex");a.resetExpiresAt=new Date(0);const h=harness({account:a});
 const body={action:"reset",token,password:"new-password-123"};assert.equal((await h.route.POST(request(body))).status,400);
 a.resetExpiresAt=new Date(Date.now()+100000);a.customer.active=false;assert.equal((await h.route.POST(request(body))).status,400);
 assert.equal((await h.route.POST(request({...body,token:"wrong"}))).status,400);assert.equal((await h.route.POST(request({...body,password:"short"}))).status,400);
 assert.equal(h.hashCalls(),0);assert.equal(h.deleted(),0);
});
test("SMTP secrets are authenticated ciphertext and never returned to the panel",()=>{
 const previous=process.env.ADMIN_PASSWORD;process.env.ADMIN_PASSWORD="test-only-admin-secret-12345";
 try{const lib=load("lib/site-configuration.ts",{"@/lib/prisma":{prisma:{}}});const a=lib.encryptSecret("mail-password"),b=lib.encryptSecret("mail-password");
 assert.notEqual(a,b);assert(!a.includes("mail-password"));assert.equal(lib.decryptSecret(a),"mail-password");
 assert.throws(()=>lib.decryptSecret("00"+a.slice(2)));const safe=lib.safeConfiguration({...lib.defaults,smtpPassword:a});assert.equal(safe.smtpPassword,"");assert.equal(safe.hasSmtpPassword,true);
 }finally{if(previous===undefined)delete process.env.ADMIN_PASSWORD;else process.env.ADMIN_PASSWORD=previous;}
});
test("site settings require administrator access before any database or SMTP access",async()=>{
 const route=load("app/api/site-settings/route.ts",{"@/lib/admin":{adminGuard:()=>Response.json({},{status:401})},"@/lib/prisma":{},"@/lib/site-configuration":{},"@/lib/mail":{},"next/cache":{}});
 assert.equal((await route.GET(request({}))).status,401);assert.equal((await route.PATCH(request({action:"revokeSessions",confirm:true}))).status,401);
});

test("failed mail delivery invalidates its reset token",async()=>{
 const a=member(),h=harness({account:a,sendFails:true});await h.route.POST(request({action:"request",email:a.email}));
 const original=console.error;console.error=()=>{};try{await h.jobs.shift()();}finally{console.error=original;}
 assert.equal(a.resetTokenHash,null);assert.equal(a.resetExpiresAt,null);assert.equal(a.passwordHash,"old");
});
test("shipping and payment updates only write their own fields",async()=>{
 const {z}=require("zod");let saved;
 const current={enabled:false,bankName:"Existing",iban:"",shipping:99,threshold:2000};
 const route=load("app/api/checkout/route.ts",{"@/lib/prisma":{prisma:{storeSettings:{upsert:async args=>{saved=args;return {...current,...args.update};}}}},"@/lib/admin":{adminGuard:()=>null},"@/lib/guest-session":{},"@/lib/customer-session":{},"@/lib/pricing":{},"@/lib/checkout":{},"@/lib/membership":{membershipError:()=>Response.json({},{status:500})},"@/lib/commerce":{storeSettings:async()=>current,settingsSchema:z.object({enabled:z.boolean(),bankName:z.string(),iban:z.string(),shipping:z.number().nonnegative(),threshold:z.number().nonnegative()})}});
 assert.equal((await route.PATCH(request({action:"shipping",shipping:150,threshold:2500,bankName:"injected"}))).status,200);assert.deepEqual(saved.update,{shipping:150,threshold:2500});
 assert.equal((await route.PATCH(request({action:"payment",enabled:false,bankName:"Changed",iban:"",shipping:0}))).status,200);assert.deepEqual(saved.update,{enabled:false,bankName:"Changed",iban:""});
 assert.equal((await route.PATCH(request({action:"shipping",shipping:-1,threshold:2000}))).status,400);
});
test("SEO updates do not persist mail credentials; mail save preserves encrypted password",async()=>{
 let saved,revalidated=0;const existing={smtpPassword:"encrypted",smtpHost:"smtp.example.com",smtpPort:587,smtpUser:"user",smtpFrom:"sender@example.com",smtpEnabled:false,publicUrl:"https://shop.test"};
 const route=load("app/api/site-settings/route.ts",{"@/lib/admin":{adminGuard:()=>null},"@/lib/prisma":{prisma:{siteConfiguration:{upsert:async args=>{saved=args;return args.update;}}}},"@/lib/site-configuration":{siteConfiguration:async()=>existing,safeConfiguration:s=>s,encryptSecret:s=>"encrypted:"+s},"@/lib/mail":{},"next/cache":{revalidatePath:()=>{revalidated++;}}});
 assert.equal((await route.PATCH(request({action:"seo",siteTitle:"AKN shop",siteDescription:"Motorcycle parts store",keywords:"parts",geoContent:"Company info",smtpPassword:"injected"}))).status,200);assert.equal(saved.update.smtpPassword,undefined);assert.equal(revalidated,1);
 assert.equal((await route.PATCH(request({...existing,action:"mail",smtpPassword:""}))).status,200);assert.equal(saved.update.smtpPassword,"encrypted");
 assert.equal((await route.PATCH(request({...existing,action:"mail",smtpPassword:"",publicUrl:"http://unsafe.test"}))).status,400);
});
