import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { WarrantyPolicyRecordForm } from '../components/WarrantyPolicyRecordForm';
import { warrantyClient } from '../services/warrantyClient';
export function WarrantyPolicyCreatePage() {
  const { user } = useAuth(), [params] = useSearchParams(), id = params.get('policy'), navigate = useNavigate(), [record, setRecord] = useState<Awaited<ReturnType<typeof warrantyClient.policy>> | null>(null), [error, setError] = useState('');
  useEffect(() => {
    if (!id)
      return;
    let live = true;
    warrantyClient.policy(id).then(r => {
      if (live)
        setRecord(r);
    }).catch(e => {
      if (live)
        setError(e.message);
    });
    return () => {
      live = false;
    };
  }, [
    id
  ]);
  if (user?.role !== 'admin')
    return <Navigate to="/unauthorized" replace />;
  return <div className="max-w-5xl mx-auto space-y-5">
    <Link className="text-green-700" to="/warranty/policies">Back to Policies</Link>
    <h1 className="text-2xl font-bold">
      {id ? 'Publish Policy Revision' : 'Create Warranty Policy'}
    </h1>
    {error ? <p role="alert">
      {error}
    </p> : id && !record ? <p>Loading policy terms...</p> : <WarrantyPolicyRecordForm key={record?.policy.id ?? 'new'} policy={record?.policy} revision={record?.currentRevision} onSaved={async () => {
      navigate('/warranty/policies' + (id ? '?policy=' + id : ''));
    }} />}
  </div>;
}
