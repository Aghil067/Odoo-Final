import {PagedRecordSelect,type RecordQuery} from '../../../components/common/PagedRecordSelect';
import {inventoryClient,type WarehouseRecord,type StockComponent,type FulfillmentDesign} from '../services/inventoryClient';
const activeWarehouses=(q:RecordQuery)=>inventoryClient.warehouses({...q,active:'true'});
const activeComponents=(q:RecordQuery)=>inventoryClient.components({...q,active:'true'});
const allComponents=(q:RecordQuery)=>inventoryClient.components(q);
export function WarehousePicker({label='Warehouse',value,onChange,required=true}:{label?:string;value:WarehouseRecord|null;onChange:(value:WarehouseRecord|null)=>void;required?:boolean}){return <PagedRecordSelect label={label} selected={value} onChange={onChange} load={activeWarehouses} describe={w=>`${w.name} / ${w.code}`} required={required}/>;}
export function StockComponentPicker({value,onChange,includeInactive=false,required=true}:{value:StockComponent|null;onChange:(value:StockComponent|null)=>void;includeInactive?:boolean;required?:boolean}){return <PagedRecordSelect label="Stock Component" selected={value} onChange={onChange} load={includeInactive?allComponents:activeComponents} describe={c=>`${c.name} / ${c.sku}${c.isActive?'':' / Inactive'}`} required={required}/>;}
export function FulfillmentDesignPicker({value,onChange}:{value:FulfillmentDesign|null;onChange:(value:FulfillmentDesign|null)=>void}){return <PagedRecordSelect label="Approved Project Design" selected={value} onChange={onChange} load={inventoryClient.designs} describe={d=>`${d.name} / ${d.customer.name} / ${d.site.name}`} required/>;}
