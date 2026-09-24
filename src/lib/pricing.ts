type Buyer = {type:string;dealerStatus:string;discountRate:number;group?:{active:boolean;type:string;discountRate:number}|null}|null;
export function unitPrice(product:{retailPrice:number;dealerPrice:number},customer:Buyer) {
  const dealer=customer?.type==="dealer"&&customer.dealerStatus==="approved";
  const base=dealer?product.dealerPrice:product.retailPrice;
  const group=customer?.group;
  const discount=Math.max(customer?.discountRate??0,group?.active&&group.type===customer?.type?group.discountRate:0);
  return Math.round(base*(100-Math.min(100,Math.max(0,discount))))/100;
}
