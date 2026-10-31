import {getData,getPage,postData,patchData} from '../../../services/apiClient';
import type {ComponentCategory} from '../../configurations/services/solarClient';
export interface StockCommand {idempotencyKey:string;reference:string;reason:string}
export interface WarehouseRecord {id:string;code:string;name:string;address:string;contactName:string|null;contactPhone:string|null;contactEmail:string|null;version:number;isActive:boolean;createdAt:string;updatedAt:string}
export interface StockComponent {id:string;sku:string;name:string;category:ComponentCategory;unit:string;serializationRequired:boolean;isActive:boolean;version:number;manufacturer:string|null;modelNumber:string|null}
export interface StockBalance {id:string;componentId:string;warehouseId:string;version:number;serializationRequired:boolean;onHandQuantity:string;reservedQuantity:string;availableQuantity:string;quarantinedQuantity:string;reorderLevel:string;reorderQuantity:string|null;lastMovementAt:string|null;component:Pick<StockComponent,'id'|'sku'|'name'|'unit'|'category'|'isActive'>;warehouse:{id:string;code:string;name:string}}
export interface SerialRecord {id:string;serialNumber:string;componentId:string;warehouseId:string;state:'AVAILABLE'|'RESERVED'|'DISPATCHED'|'QUARANTINED'|'RETIRED';version:number;receivedAt:string;receiptOperationId:string;reservationLineId:string|null;dispatchLineId:string|null;component?:{id:string;sku:string;name:string};warehouse?:WarehouseRecord;receiptOperation?:{id:string;reference:string;createdAt:string}}
export interface SerialHistory {id:string;serialUnitId:string;operationId:string;movementId:string;version:number;fromState:string|null;toState:string;fromWarehouseId:string|null;toWarehouseId:string;createdAt:string}
export interface StockOperation {id:string;kind:string;reference:string;actorId:string;reason:string;createdAt:string;payload?:Record<string,unknown>;result?:Record<string,unknown>}
export interface StockMovement {id:string;operationId:string;type:string;quantity:string;onHandBefore:string;onHandAfter:string;reservedBefore:string;reservedAfter:string;quarantinedBefore:string;quarantinedAfter:string;createdAt:string;balance:{warehouseId:string;componentId:string};operation:{id:string;kind:string;reference:string;actorId:string;reason:string;createdAt:string}}
export interface FulfillmentDesign {id:string;reference:string;name:string;approvedVersion:number|null;customer:{id:string;name:string};site:{id:string;name:string}}
export interface AvailabilityRecord {configurationId:string;approvedVersion:number;reviewId:string;bomId:string;bomVersion:number;warehouseId:string;fulfillmentStatus:string;lines:{bomLineId:string;componentId:string;unit:string;requiredQuantity:string;onHandQuantity:string;reservedQuantity:string;availableQuantity:string;quarantinedQuantity:string;shortageQuantity:string;componentActive:boolean;status:string}[]}
export interface ReservationRecord {id:string;reference:string;configurationId:string;bomId:string;configurationVersion:number;configurationReviewId:string;bomVersion:number;warehouseId:string;operationId:string;status:'ACTIVE'|'RELEASED'|'CANCELLED'|'DISPATCHED';version:number;createdAt:string;updatedAt:string;lines?:{id:string;bomLineId:string;componentId:string;quantity:string;serialUnitIds:string[];serials:{id:string;serialNumber:string;state:string}[];dispatchLine?:{id:string;quantity:string;returnedQuantity:string}|null}[];dispatch?:{id:string;reference:string;status:string;dispatchedAt:string}|null}
export interface DispatchRecord {id:string;reference:string;reservationId:string;warehouseId:string;operationId:string;status:string;dispatchedAt:string;notes:string|null;createdAt:string;scope?:string;reservation?:ReservationRecord&{configuration:{customerId:string;leadId:string;siteId:string}};lines?:{id:string;reservationLineId:string;quantity:string;returnedQuantity:string;serialUnitIds:string[];serials:SerialRecord[];reservationLine:{componentId:string;bomLineId:string;bomLine:{unit:string;skuSnapshot:string;descriptionSnapshot:string}}}[]}
export interface StockSummary {byUnit:{unit:string;onHandQuantity:string;reservedQuantity:string;availableQuantity:string;quarantinedQuantity:string;balanceCount:number;lowStockCount:number}[];activeWarehouseCount:number;activeReservationCount:number;scope:string}
type Page={page?:number;pageSize?:number};
type StockQuery=Page&{warehouseId?:string;componentId?:string;q?:string};
export const inventoryClient={
 warehouses:(query:Page&{q?:string;active?:string}={})=>getPage<WarehouseRecord>('/inventory/warehouses',query),
 warehouse:(id:string)=>getData<WarehouseRecord>(`/inventory/warehouses/${id}`),
 createWarehouse:(data:StockCommand&{code:string;name:string;address:string;contactName?:string|null;contactPhone?:string|null;contactEmail?:string|null})=>postData<WarehouseRecord>('/inventory/warehouses',data),
 updateWarehouse:(id:string,data:StockCommand&{version:number;name?:string;address?:string;contactName?:string|null;contactPhone?:string|null;contactEmail?:string|null;isActive?:boolean})=>patchData<{before:WarehouseRecord;warehouse:WarehouseRecord}>(`/inventory/warehouses/${id}`,data),
 components:(query:Page&{q?:string;category?:string;active?:string}={})=>getPage<StockComponent>('/inventory/components',query),
 component:(id:string)=>getData<StockComponent>(`/inventory/components/${id}`),
 designs:(query:Page&{q?:string}={})=>getPage<FulfillmentDesign>('/inventory/fulfillment-configurations',query),
 balances:(query:StockQuery={})=>getPage<StockBalance>('/inventory/balances',query),
 lowStock:(query:StockQuery={})=>getPage<Omit<StockBalance,'component'|'warehouse'>&{sku:string;name:string;unit:string}>('/inventory/low-stock',query),
 summary:(warehouseId?:string)=>getData<StockSummary>('/inventory/summary',{params:{warehouseId}}),
 reorder:(data:StockCommand&{version:number;warehouseId:string;componentId:string;reorderLevel:string;reorderQuantity:string|null})=>patchData<Omit<StockBalance,'component'|'warehouse'>>('/inventory/balances/reorder',data),
 serials:(query:StockQuery&{state?:string}={})=>getPage<SerialRecord>('/inventory/serials',query),
 serial:(id:string)=>getData<SerialRecord>(`/inventory/serials/${id}`),
 serialHistory:(id:string,page=1)=>getPage<SerialHistory>(`/inventory/serials/${id}/history`,{page,pageSize:20}),
 movements:(query:Page&{warehouseId?:string;componentId?:string;type?:string;operationId?:string;from?:string;to?:string}={})=>getPage<StockMovement>('/inventory/movements',query),
 operations:(query:Page&{q?:string;kind?:string}={})=>getPage<StockOperation>('/inventory/operations',query),
 operation:(id:string)=>getData<StockOperation>(`/inventory/operations/${id}`),
 receipt:(data:StockCommand&{warehouseId:string;componentId:string;quantity:string;receivedAt:string;supplierNotes?:string|null;serialNumbers:string[]})=>postData<{operationId:string;movement:Omit<StockMovement,'balance'|'operation'>;balance:Omit<StockBalance,'component'|'warehouse'>}>('/inventory/receipts',data),
 transfer:(data:StockCommand&{sourceWarehouseId:string;destinationWarehouseId:string;componentId:string;quantity:string;serialIds:string[]})=>postData<{operationId:string;transfer:{id:string;quantity:string};movements:Omit<StockMovement,'balance'|'operation'>[]}>('/inventory/transfers',data),
 adjustment:(data:StockCommand&{warehouseId:string;componentId:string;quantity:string;action:'OPENING_BALANCE'|'ADJUSTMENT_IN'|'ADJUSTMENT_OUT'|'INSPECTION_RELEASE'|'QUARANTINE_DISPOSAL';serialNumbers:string[];serialIds:string[]})=>postData<{operationId:string;movement:Omit<StockMovement,'balance'|'operation'>;balance:Omit<StockBalance,'component'|'warehouse'>}>('/inventory/adjustments',data),
 availability:(configurationId:string,warehouseId:string)=>getData<AvailabilityRecord>(`/inventory/availability/${configurationId}`,{params:{warehouseId}}),
 reservations:(query:Page&{warehouseId?:string;configurationId?:string;status?:string}={})=>getPage<ReservationRecord>('/inventory/reservations',query),
 reservation:(id:string)=>getData<ReservationRecord>(`/inventory/reservations/${id}`),
 reserve:(data:StockCommand&{configurationId:string;approvedVersion:number;reviewId:string;bomId:string;bomVersion:number;warehouseId:string;serialSelections:{componentId:string;serialIds:string[]}[]})=>postData<{operationId:string;reservation:ReservationRecord}>('/inventory/reservations',data),
 release:(id:string,cancel:boolean,data:StockCommand&{version:number})=>postData<{operationId:string;reservation:ReservationRecord}>(`/inventory/reservations/${id}/${cancel?'cancel':'release'}`,data),
 dispatches:(query:Page&{warehouseId?:string;configurationId?:string}={})=>getPage<DispatchRecord>('/inventory/dispatches',query),
 dispatch:(id:string)=>getData<DispatchRecord>(`/inventory/dispatches/${id}`),
 postDispatch:(data:StockCommand&{reservationId:string;version:number;dispatchedAt:string;notes:string|null})=>postData<{operationId:string;dispatch:DispatchRecord;scope:string}>('/inventory/dispatches',data),
 returnEquipment:(data:StockCommand&{dispatchId:string;warehouseId:string;lines:{dispatchLineId:string;quantity:string;serialIds:string[]}[]})=>postData<{operationId:string;dispatchId:string;movements:Omit<StockMovement,'balance'|'operation'>[];disposition:string}>('/inventory/returns',data)
};
