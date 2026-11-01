import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../../services/apiClient';
import { Button } from '../../../components/ui/Button';
import { EnquiryForm } from '../components/EnquiryForm';
import { enquiryService } from '../services/enquiryService';
import type { Enquiry, EnquiryFormData } from '../types/enquiry.types';
export function EnquiryCreatePage() {
  const { id } = useParams(), navigate = useNavigate(), [record, setRecord] = useState<Enquiry | null>(null), [saving, setSaving] = useState(false), [loading, setLoading] = useState(!!id), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!id)
      return;
    let live = true;
    setLoading(true);
    setError('');
    enquiryService.getById(id).then(r => {
      if (live)
        setRecord(r);
    }).catch(e => {
      if (live)
        setError(e.message);
    }).finally(() => {
      if (live)
        setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [
    id, retry
  ]);
  const inFlight = useRef(false);
  const [uncertain, setUncertain] = useState(false);
  async function submit(data: EnquiryFormData) {
    if (inFlight.current || uncertain) return;
    inFlight.current = true;
    setSaving(true);
    setError('');
    try {
      const r = id ? await enquiryService.update(id, data) : await enquiryService.create(data);
      navigate('/crm/enquiries/' + r.id);
    }
    catch (e) {
      const unknownOutcome = e instanceof ApiError && (e.status === 0 || e.status >= 500);
      setUncertain(unknownOutcome);
      setError(unknownOutcome ? 'The save outcome is unknown. Check the enquiry list before retrying to avoid creating a duplicate.' : e instanceof Error ? e.message : 'Enquiry was not saved.');
      throw e;
    }
    finally {
      inFlight.current = false;
      setSaving(false);
    }
  }
  return <div className="space-y-6 max-w-4xl mx-auto">
    <h1 className="text-2xl font-bold">
      {id ? 'Edit Solar Enquiry' : 'Create Solar Enquiry'}
    </h1>
    {error && <div role="alert" className="p-3 bg-red-50 text-red-700 rounded">
      {error}
      {id && !record && <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>}
    </div>}
    {loading ? <p>Loading actual enquiry...</p> : (!id || record) && <EnquiryForm key={id ?? 'new'} initialData={record ?? undefined} onSubmit={submit} isLoading={saving || uncertain} />}
  </div>;
}
