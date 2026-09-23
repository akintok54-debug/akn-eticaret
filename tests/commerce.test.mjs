import test from "node:test";
import assert from "node:assert/strict";
import { checkoutSchema, checkoutSettings, shippingCost } from "../src/lib/checkout.ts";
import { isAdmin, adminGuard, adminToken } from "../src/lib/admin.ts";
import { isValidTurkishIban } from "../src/lib/bank.ts";

test("management routes deny missing, forged and weak credentials",()=>{
 process.env.ADMIN_USER="test-admin";process.env.ADMIN_PASSWORD="unit-test-password-long";
 assert.equal(isAdmin(new Request("https://example.com")),false);
 assert.equal(isAdmin(new Request("https://example.com",{headers:{authorization:"Basic forged"}})),false);
 const auth=`Basic ${Buffer.from("test-admin:unit-test-password-long").toString("base64")}`;
 assert.equal(isAdmin(new Request("https://example.com",{headers:{authorization:auth}})),true);
 assert.equal(isAdmin(new Request("https://example.com",{headers:{cookie:`akn-admin=${adminToken()}`}})),true);
 assert.equal(isAdmin(new Request("https://example.com",{headers:{cookie:"akn-admin=9999999999999."+"0".repeat(64)}})),false);
 assert.equal(adminGuard(new Request("https://example.com/api/products",{method:"POST",headers:{authorization:auth,origin:"https://evil.example"}}))?.status,403);
 process.env.ADMIN_PASSWORD="short";
 assert.equal(isAdmin(new Request("https://example.com",{headers:{authorization:auth}})),false);
});
const valid={expectedTotal:100,checkoutKey:"85f930af-dbf4-4c8a-b5d3-d013c9788f2f",customer:{fullName:"Test Kullanıcı",phone:"05551234567",email:"test@example.com"},delivery:{city:"İstanbul",district:"Kadıköy",address:"Test Mahallesi Test Sokak No 12"},invoice:{type:"individual"},paymentMethod:"transfer",items:[{productId:"product-1",quantity:1}]};
test("checkout rejects fractional, negative, oversized and empty baskets",()=>{
 assert.equal(checkoutSchema.safeParse(valid).success,true);
 for(const quantity of [-1,0,1.5,1000])assert.equal(checkoutSchema.safeParse({...valid,items:[{productId:"1",quantity}]}).success,false);
 assert.equal(checkoutSchema.safeParse({...valid,items:[]}).success,false);
 assert.equal(checkoutSchema.safeParse({...valid,paymentMethod:"card"}).success,false);
 assert.equal(checkoutSchema.safeParse({...valid,invoice:{type:"corporate"}}).success,false);
});
test("client supplied price and totals are discarded",()=>{
 const parsed=checkoutSchema.parse({...valid,total:1,items:[{productId:"1",quantity:1,price:0.01}]});
 assert.equal("total" in parsed,false);assert.equal("price" in parsed.items[0],false);
});
test("checkout stays closed without complete configuration and shipping is consistent",()=>{
 process.env.CHECKOUT_ENABLED="true";delete process.env.SESSION_SECRET;
 assert.equal(checkoutSettings().enabled,false);
 assert.equal(shippingCost(1999,{shipping:99,threshold:2000}),99);
 assert.equal(shippingCost(2000,{shipping:99,threshold:2000}),0);
});
test("IBAN requires a Turkish account with valid check digits",()=>{
 assert.equal(isValidTurkishIban("TR33 0006 1005 1978 6457 8413 26"),true);
 assert.equal(isValidTurkishIban("TR33 0006 1005 1978 6457 8413 27"),false);
 assert.equal(isValidTurkishIban("TR000000000000000000000000"),false);
 assert.equal(isValidTurkishIban(""),false);
});
