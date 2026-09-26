import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import ts from "typescript";
import sharp from "sharp";
const require=createRequire(import.meta.url);
function load(path,imports={}){const code=ts.transpileModule(readFileSync(new URL("../src/"+path,import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;const exports={};new Function("require","exports",code)(name=>name in imports?imports[name]:require(name),exports);return exports;}
const design=load("lib/store-design.ts");
const req=(body,method="PATCH")=>new Request("https://shop.test/api/admin-panel-settings",{method,headers:{"Content-Type":"application/json",origin:"https://shop.test"},body:JSON.stringify(body)});
function harness(denied=false){
 const rows=new Map([["akn-admin-settings",{values:{firm:{name:"Existing"},legal:{returns:"Existing policy"},design:design.defaultDesign}}]]);
 const writes=[];let invalidated=0;
 const route=load("app/api/admin-panel-settings/route.ts",{
 "@/lib/admin":{adminGuard:()=>denied?Response.json({},{status:401}):null},
 "@/lib/prisma":{prisma:{integrationSetting:{findUnique:async({where})=>rows.get(where.slug)||null,upsert:async a=>{writes.push(a);const row=rows.has(a.where.slug)?{...rows.get(a.where.slug),...a.update}:a.create;rows.set(a.where.slug,row);return row;}}}},
 "@/lib/store-design":design,"next/cache":{revalidatePath:()=>invalidated++}});
 return{route,rows,writes,invalidated:()=>invalidated};
}
const card={id:"one",title:"Tanitim",description:"",image:"https://images.test/a.png",href:"/urunler",position:"bottom",active:true};
test("safe defaults and legacy theme keep product settings",()=>{
 assert.equal(design.defaultDesign.theme,"AKN");assert.equal(design.normalizeDesign({theme:"Old theme",showPrices:false}).showPrices,false);
 assert.equal(design.themeForeground("#ffffff"),"#111111");assert.equal(design.themeForeground("#000000"),"#ffffff");
});
test("URLs, theme IDs, colors and card limits are validated",()=>{
 assert.equal(design.designSchema.safeParse({promotions:[card]}).success,true);
 for(const href of ["javascript:alert(1)","//evil.test","/\\evil.test","data:image/svg+xml;base64,xxx","https://user:pass@host.test/x","https://host.test/a\nb"]){
 assert.equal(design.designSchema.safeParse({promotions:[{...card,href}]}).success,false,href);}
 assert.equal(design.designSchema.safeParse({themes:[{id:"AKN",name:"Duplicate",accent:"#ffffff",rounded:true}]}).success,false);
 assert.equal(design.designSchema.safeParse({theme:"CUSTOM",themes:[{id:"CUSTOM",name:"X",accent:"red;position:fixed",rounded:false}]}).success,false);
 assert.equal(design.designSchema.safeParse({promotions:Array(13).fill(card)}).success,false);
});
test("design save preserves other sections and invalidates storefront; invalid data never writes",async()=>{
 const h=harness(),draft={...design.defaultDesign,theme:"GECE",promotions:[card]};
 assert.equal((await h.route.PATCH(req({design:draft}))).status,200);
 const saved=h.rows.get("akn-admin-settings").values;
 assert.equal(saved.firm.name,"Existing");assert.equal(saved.legal.returns,"Existing policy");assert.equal(saved.design.theme,"GECE");assert.equal(h.invalidated(),1);
 for(const body of [{design:null},{design:{...draft,productsPerPage:0}},{design:{...draft,promotions:[{...card,href:"javascript:alert(1)"}]}},{design:draft,firm:{}},{unknown:1}]){
 assert.equal((await h.route.PATCH(req(body))).status,400);}
 assert.equal(h.writes.length,1);
});
test("settings reads, uploads and writes require administrator",async()=>{
 const h=harness(true);
 assert.equal((await h.route.GET(new Request("https://shop.test/api/admin-panel-settings"))).status,401);
 assert.equal((await h.route.PATCH(req({design:design.defaultDesign}))).status,401);
 assert.equal((await h.route.POST(req({data:"x"},"POST"))).status,401);assert.equal(h.writes.length,0);
});
test("actual PNG upload persists optimized WebP; public asset endpoint serves only immutable images",async()=>{
 const h=harness(),png=await sharp({create:{width:100,height:80,channels:3,background:"#203c68"}}).png().toBuffer();
 const body={data:"data:image/png;base64,"+png.toString("base64")};
 const uploaded=await h.route.POST(req(body,"POST"));assert.equal(uploaded.status,201);
 const {url}=await uploaded.json();assert.match(url,/^\/api\/admin-panel-settings\?asset=[a-f0-9]{64}$/);
 const response=await h.route.GET(new Request("https://shop.test"+url));assert.equal(response.status,200);assert.equal(response.headers.get("content-type"),"image/webp");
 assert.match(response.headers.get("cache-control"),/immutable/);
 assert.equal((await sharp(Buffer.from(await response.arrayBuffer())).metadata()).format,"webp");
 assert.equal((await (await h.route.POST(req(body,"POST"))).json()).url,url);assert.equal(h.rows.size,2);
 for(const id of ["akn-admin-settings","0".repeat(64)])assert.equal((await h.route.GET(new Request("https://shop.test/api/admin-panel-settings?asset="+id))).status,404);
});
test("SVG, malformed images and oversized payloads cannot create assets",async()=>{
 const h=harness();
 for(const data of ["data:image/svg+xml;base64,PHN2Zy8+","data:image/png;base64,"+Buffer.from("<svg/>").toString("base64"),"data:image/png;base64,AAAA"]){
 assert.equal((await h.route.POST(req({data},"POST"))).status,400);}
 const big=new Request("https://shop.test/api/admin-panel-settings",{method:"POST",headers:{"content-length":String(5*1024*1024)},body:"{}"});
 assert.equal((await h.route.POST(big)).status,413);assert.equal(h.writes.length,0);
});
