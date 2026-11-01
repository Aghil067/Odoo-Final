import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { MapLegend } from '../features/installations/components/map/MapLegend';
import { MapFilterBar } from '../features/installations/components/map/MapFilterBar';
import { SiteDetailPanel } from '../features/installations/components/map/SiteDetailPanel';
import type { MappedSiteGroup, MapFilters } from '../features/installations/types/map.types';

describe('MapLegend Component', () => {
  it('renders all status indicators and color labels correctly', () => {
    render(<MapLegend />);
    expect(screen.getByText('Planned')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Commissioned')).toBeInTheDocument();
    expect(screen.getByText('On Hold / Rework')).toBeInTheDocument();
    expect(screen.getByText(/Multiple Installations/i)).toBeInTheDocument();
  });
});

describe('MapFilterBar Component', () => {
  const initialFilters: MapFilters = {
    q: '',
    statusCategory: undefined,
    systemType: undefined,
    minCapacity: undefined,
    maxCapacity: undefined,
  };

  it('renders search input and filter buttons', () => {
    const onChange = vi.fn();
    const onFitBounds = vi.fn();
    const onReset = vi.fn();

    render(
      <MapFilterBar
        filters={initialFilters}
        onChange={onChange}
        onFitBounds={onFitBounds}
        onReset={onReset}
        totalMapped={5}
      />
    );

    expect(screen.getByPlaceholderText(/search site, customer, or project ID/i)).toBeInTheDocument();
    expect(screen.getByText(/Fit Bounds/i)).toBeInTheDocument();
  });

  it('handles search text input correctly', () => {
    const onChange = vi.fn();
    render(
      <MapFilterBar
        filters={initialFilters}
        onChange={onChange}
        onFitBounds={vi.fn()}
        onReset={vi.fn()}
        totalMapped={5}
      />
    );

    const input = screen.getByPlaceholderText(/search site, customer, or project ID/i);
    fireEvent.change(input, { target: { value: 'Hitec City' } });
    expect(onChange).toHaveBeenCalledWith({ ...initialFilters, q: 'Hitec City' });
  });
});

describe('SiteDetailPanel Component', () => {
  const mockSite: MappedSiteGroup = {
    siteId: 'site-1',
    siteName: 'Hitec City Solar Tech Park',
    addressLine1: 'Plot 42, Mindspace IT Park, Hitec City Phase 2',
    addressLine2: null,
    city: 'Hyderabad',
    state: 'Telangana',
    postalCode: '500081',
    country: 'IN',
    landmark: 'Near Cyber Towers',
    latitude: 17.4435,
    longitude: 78.3772,
    customerId: 'cust-1',
    customerName: 'Rohan Joshi',
    primaryStatus: 'IN_PROGRESS',
    primaryStatusColor: 'orange',
    installationCount: 2,
    hasCommissioned: false,
    hasActive: true,
    installations: [
      {
        id: 'inst-1',
        reference: 'INS-2026-HYD-0101',
        name: 'Hitec City Phase 1 Solar Carport (3.2 kW)',
        status: 'PLANNED',
        statusCategory: 'PLANNED',
        statusColor: 'blue',
        customerName: 'Rohan Joshi',
        customerId: 'cust-1',
        capacityKw: 3.2,
        systemType: 'ON_GRID',
        plannedStartAt: '2026-11-06T00:00:00Z',
        plannedEndAt: '2026-11-08T00:00:00Z',
        actualStartAt: null,
        actualEndAt: null,
        commissionedAt: null,
        assignedTechnicians: [{ id: 'u-1', name: 'Ravi Menon', role: 'TECHNICIAN' }],
        warranty: null,
      },
      {
        id: 'inst-2',
        reference: 'INS-2026-HYD-0102',
        name: 'Hitec City Phase 2 Main Tower Rooftop (3.2 kW)',
        status: 'IN_PROGRESS',
        statusCategory: 'IN_PROGRESS',
        statusColor: 'orange',
        customerName: 'Rohan Joshi',
        customerId: 'cust-1',
        capacityKw: 3.2,
        systemType: 'ON_GRID',
        plannedStartAt: '2026-10-29T00:00:00Z',
        plannedEndAt: '2026-11-03T00:00:00Z',
        actualStartAt: '2026-10-30T00:00:00Z',
        actualEndAt: null,
        commissionedAt: null,
        assignedTechnicians: [{ id: 'u-1', name: 'Ravi Menon', role: 'TECHNICIAN' }],
        warranty: null,
      },
    ],
  };

  it('renders site and installation details with multi-project tabs', () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <SiteDetailPanel site={mockSite} onClose={onClose} />
      </MemoryRouter>
    );

    expect(screen.getByText('Hitec City Solar Tech Park')).toBeInTheDocument();
    expect(screen.getByText('Rohan Joshi')).toBeInTheDocument();
    expect(screen.getByText(/Installations at Site/i)).toBeInTheDocument();
    expect(screen.getByText('View Installation Details')).toBeInTheDocument();
    expect(screen.getByText('Ravi Menon')).toBeInTheDocument();
    expect(screen.getAllByText(/3.2 kW/i).length).toBeGreaterThan(0);
  });
});
