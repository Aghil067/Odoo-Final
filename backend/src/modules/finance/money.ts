import {Prisma} from '@prisma/client';
import {ApiError} from '../../lib/http.js';
export const D=Prisma.Decimal.clone({precision:48,rounding:Prisma.Decimal.ROUND_HALF_UP});
export const dec=(x:Prisma.Decimal.Value)=>new D(x);
export const money=(x:Prisma.Decimal.Value)=>dec(x).toDecimalPlaces(2,D.ROUND_HALF_UP);
export const sum=(xs:Prisma.Decimal.Value[])=>xs.reduce<Prisma.Decimal>((a,x)=>a.plus(x),dec('0'));
export function line(quantity:string,unitPrice:string,enteredDiscount:string,rate:string,inclusive:boolean){
 const q=dec(quantity),p=dec(unitPrice),discount=money(enteredDiscount),r=dec(rate).div('100');
 if(q.lte('0')||p.lt('0')||r.lt('0')||r.gt('1'))throw new ApiError(422,'FINANCE_LINE_RANGE','Use positive quantity, nonnegative configured price and percentage rate0..100');
 const extendedPrice=money(q.times(p));if(discount.lt('0')||discount.gt(extendedPrice))throw new ApiError(422,'FINANCE_DISCOUNT','Discount cannot exceed the extended configured price');
 const after=extendedPrice.minus(discount),taxBefore=inclusive?money(extendedPrice.minus(extendedPrice.div(r.plus('1')))):dec('0'),subtotal=extendedPrice.minus(taxBefore),taxAmount=inclusive?money(after.minus(after.div(r.plus('1')))):money(after.times(r)),taxableAmount=inclusive?after.minus(taxAmount):after,discountAmount=subtotal.minus(taxableAmount),totalAmount=taxableAmount.plus(taxAmount);
 if(totalAmount.gt('9999999999999999999999.99'))throw new ApiError(422,'FINANCE_AMOUNT_LIMIT','Line exceeds supported monetary bounds');
 return {extendedPrice,enteredDiscount:discount,subtotal,discountAmount,taxableAmount,taxAmount,totalAmount};
}
export function totals(lines:ReturnType<typeof line>[]){const subtotal=sum(lines.map(x=>x.subtotal)),discountAmount=sum(lines.map(x=>x.discountAmount)),taxAmount=sum(lines.map(x=>x.taxAmount)),totalAmount=sum(lines.map(x=>x.totalAmount)),taxableAmount=subtotal.minus(discountAmount);if(totalAmount.lte('0')||totalAmount.gt('9999999999999999999999.99'))throw new ApiError(422,'FINANCE_TOTAL','Commercial document must have a positive bounded total');return {subtotal,discountAmount,taxableAmount,taxAmount,totalAmount};}
export function creditSplit(amount:Prisma.Decimal.Value,invoice:{totalAmount:Prisma.Decimal;taxAmount:Prisma.Decimal},previousGross:Prisma.Decimal,previousTax:Prisma.Decimal){
 const gross=money(amount),remainingTax=dec(invoice.taxAmount).minus(previousTax),remainingNet=dec(invoice.totalAmount).minus(invoice.taxAmount).minus(previousGross.minus(previousTax)),minimumTax=D.max('0',gross.minus(remainingNet)),maximumTax=D.min(gross,remainingTax),candidate=money(gross.times(invoice.taxAmount).div(invoice.totalAmount)),taxAmount=gross.plus(previousGross).eq(invoice.totalAmount)?remainingTax:D.min(D.max(candidate,minimumTax),maximumTax);
 return {amount:gross,taxAmount,taxableAmount:gross.minus(taxAmount)};
}
