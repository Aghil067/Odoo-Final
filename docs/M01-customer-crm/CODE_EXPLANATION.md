# Module M01 – Code Explanation
## Beginner-Friendly Code Walkthrough

This document explains key code snippets implemented in M01 so developers can confidently explain the codebase during judging.

---

## 1. Reusable Data Table (`src/components/ui/DataTable.tsx`)

Instead of writing bespoke table markup on each page, `DataTable` accepts a generic column specification:

```tsx
// Defining columns for the customer list
const columns: Column<CustomerSummary>[] = [
  {
    key: 'customerId',
    header: 'Customer ID',
    className: 'font-mono text-xs text-slate-500 w-28',
  },
  {
    key: 'fullName',
    header: 'Customer Name',
    render: (item) => (
      <Link to={`/crm/customers/${item.id}`} className="font-semibold text-slate-800 hover:text-green-600 block">
        {item.fullName}
      </Link>
    ),
  },
  // ... other columns
];

// Rendering the DataTable
<DataTable
  columns={columns}
  data={customers}
  isLoading={isLoading}
  keyExtractor={(item) => item.id}
  page={page}
  pageSize={10}
  total={total}
  onPageChange={setPage}
/>
```
### Why this is clean:
- **`render` function**: Allows custom JSX inside any table cell without breaking the table structure.
- **Loading & Empty states**: Built into the component.
- **Pagination**: Calculated and rendered automatically using `page`, `pageSize`, and `total`.

---

## 2. Customer Form Validation (`src/features/crm/components/CustomerForm.tsx`)

Form inputs are validated on the client side before triggering the service:

```tsx
const validate = (): boolean => {
  const errs: Record<string, string> = {};

  if (!formData.fullName.trim()) {
    errs.fullName = 'Full Name / Business Name is required';
  }

  // Conditional validation: Businesses require a contact person
  if (formData.customerType !== 'individual' && !formData.contactPerson?.trim()) {
    errs.contactPerson = 'Contact Person is required for business/organization';
  }

  // 10-digit Indian phone number regex check
  if (!formData.phone.trim()) {
    errs.phone = 'Phone number is required';
  } else if (!/^\d{10}$/.test(formData.phone.replace(/[\s-]/g, ''))) {
    errs.phone = 'Please enter a valid 10-digit phone number';
  }

  setErrors(errs);
  return Object.keys(errs).length === 0;
};
```
### How this works:
1. `validate()` checks required fields and formats.
2. If invalid, error messages are stored in state and shown under each input.
3. If valid, `onSubmit(formData)` sends data to the service layer.

---

## 3. Interactive Sales Pipeline (`src/features/crm/components/EnquiryPipeline.tsx`)

The sales pipeline visualizes customer progression:

```tsx
export function EnquiryPipeline({ currentStatus, onStatusChange, disabled }: EnquiryPipelineProps) {
  const currentIndex = PIPELINE_STAGES.indexOf(currentStatus);

  return (
    <div className="flex items-center min-w-[700px]">
      {PIPELINE_STAGES.map((stage, idx) => {
        const isCompleted = currentIndex > idx;
        const isCurrent = currentIndex === idx;

        return (
          <button
            key={stage}
            onClick={() => onStatusChange && onStatusChange(stage)}
            className="flex flex-col items-center"
          >
            <div className={isCompleted ? 'bg-green-600 text-white' : isCurrent ? 'border-2 border-green-600' : 'bg-slate-100'}>
              {isCompleted ? <Check /> : idx + 1}
            </div>
            <span>{ENQUIRY_STATUS_LABELS[stage]}</span>
          </button>
        );
      })}
    </div>
  );
}
```
### How this works:
- `PIPELINE_STAGES` defines the chronological array of stages.
- `currentIndex > idx` highlights completed stages in solid green with a checkmark.
- Clicking any circle directly invokes `onStatusChange`, allowing fast pipeline advancement.

---

## 4. Role-Based UI Action Gating (`PermissionGuard`)

To enforce read-only permissions for Surveyors or Finance Officers without altering layout:

```tsx
<PermissionGuard module="customers" require="full">
  <Link to="/crm/customers/new">
    <Button size="sm" variant="primary">
      Add Customer
    </Button>
  </Link>
</PermissionGuard>
```
### How this works:
- Reads the logged-in role from `AuthContext`.
- Checks `PERMISSIONS['customers'][role]`.
- If the role is `surveyor` (permission: `'view'`), the guard renders `null`.
- If the role is `sales_executive` or `admin` (permission: `'full'`), the button renders normally.

---

## 5. Follow-up Completion Flow (`FollowUpsPage.tsx`)

To ensure sales staff document interaction outcomes:

```tsx
const handleMarkComplete = async (id: string) => {
  if (!outcomeNote.trim()) return;
  setIsSubmitting(true);
  
  // Calls followUpService with mandatory outcome
  await followUpService.complete(id, { outcomeNote });
  
  setCompletingId(null);
  setOutcomeNote('');
  // Re-fetches fresh task list
  loadFollowUps();
};
```
### How this works:
- Clicking "Complete" opens an inline outcome prompt.
- The "Save & Mark Completed" button is disabled until text is entered into `outcomeNote`.
- The task status transitions to `completed` and stores the outcome note permanently.

