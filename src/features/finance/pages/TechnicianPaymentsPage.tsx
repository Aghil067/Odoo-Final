import {Link} from 'react-router-dom';
import {Card} from '../../../components/ui/Card';
import {Button} from '../../../components/ui/Button';
import {FinanceNavigation} from '../components/FinanceNavigation';
export function TechnicianPaymentsPage(){return <div className="space-y-5"><FinanceNavigation/><h1 className="text-2xl font-bold">Technician Payments</h1><Card><p>Payroll and technician bank-payment execution are unavailable. No wages, attendance or paid status are inferred from scheduled assignments.</p><p className="mt-3">Actual documented labor costs and reimbursements can be submitted through expense records, independently approved and explicitly recognized as operational costs.</p><Link to="/finance/expenses"><Button className="mt-3" variant="outline">View Actual Expense Records</Button></Link></Card></div>;}
