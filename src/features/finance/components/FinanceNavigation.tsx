import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Button } from '../../../components/ui/Button';
import type { FinanceGroup } from '../services/financeClient';
export function financeGroupAllowed(role: string | undefined, group: FinanceGroup) {
  return role === 'admin' || role === 'finance_officer' || role === 'sales_executive' && [
    'quotations', 'orders', 'invoices'
  ].includes(group) || role === 'service_manager' && group === 'service-charges';
}
export const financeRecordUrl = (group: FinanceGroup, id: string) => group === 'invoices' ? '/finance/invoices/' + id : '/finance/documents/' + group + '/' + id;
export function FinanceNavigation() {
  const { user } = useAuth();
  const links: [
    string,
    string
  ][] = [
    [
      'Dashboard', '/finance/dashboard'
    ], ...(user?.role === 'service_manager' ? [] : [
      [
        'Quotations', '/finance/quotations'
      ], [
        'Orders', '/finance/orders'
      ], [
        'Invoices', '/finance/invoices'
      ]
    ]), ...([
      'admin', 'finance_officer'
    ].includes(user?.role ?? '') ? [
      [
        'Payments', '/finance/payments'
      ], [
        'Credits', '/finance/credit-notes'
      ], [
        'Refunds', '/finance/refunds'
      ], [
        'Expenses', '/finance/expenses'
      ], [
        'Reports', '/finance/reports'
      ]
    ] : []), ...(user?.role !== 'sales_executive' ? [
      [
        'Service Charges', '/finance/service-charges'
      ]
    ] : []), ...(user?.role === 'admin' ? [
      [
        'Pricing and Tax', '/finance/pricing'
      ], [
        'Access Grants', '/finance/access'
      ]
    ] : [])
  ] as [
    string,
    string
  ][];
  return <nav aria-label="Finance Workflows" className="flex flex-wrap gap-2">
    {links.map(([label, to]) => <Link key={to} to={to}>
      <Button size="sm" variant="outline">
        {label}
      </Button>
    </Link>)}
  </nav>;
}
