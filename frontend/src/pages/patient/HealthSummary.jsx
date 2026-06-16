import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { FiChevronLeft, FiActivity, FiSave, FiPlus, FiTrash2, FiShare2 } from 'react-icons/fi';

const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

const HealthSummary = () => {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [form, setForm] = useState({
    bloodGroup: '', height: '', weight: '',
    allergies: [],
    medicalConditions: [],
    currentMedications: [],
    emergencyContacts: [],
  });

  useEffect(() => {
    api.get('/health-summary/me')
      .then((res) => { if (res.data.data) setForm({ ...form, ...res.data.data }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.post('/health-summary/me', form);
      toast.success('Health summary saved!');
    } catch { toast.error('Failed to save'); }
    setSaving(false);
  };

  const addItem = (field, template) => setForm({ ...form, [field]: [...(form[field] || []), template] });
  const removeItem = (field, idx) => setForm({ ...form, [field]: form[field].filter((_, i) => i !== idx) });
  const updateItem = (field, idx, key, val) => {
    const arr = [...form[field]];
    arr[idx] = { ...arr[idx], [key]: val };
    setForm({ ...form, [field]: arr });
  };

  const qrData = JSON.stringify({
    bloodGroup: form.bloodGroup,
    allergies: form.allergies?.map((a) => a.name),
    conditions: form.medicalConditions?.filter((c) => c.status === 'active').map((c) => c.name),
    medications: form.currentMedications?.map((m) => m.name),
    emergency: form.emergencyContacts?.[0],
  });

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/patient/dashboard')} className="text-slate-500 hover:text-slate-800">
              <FiChevronLeft size={22} />
            </button>
            <div className="flex items-center gap-2">
              <FiActivity size={18} className="text-teal-600" />
              <span className="font-bold text-slate-800">Health Summary</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowQR(!showQR)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-teal-600 border border-teal-200 bg-teal-50 rounded-xl hover:bg-teal-100 transition">
              <FiShare2 size={14} /> QR Card
            </button>
            <button onClick={save} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-white rounded-xl disabled:opacity-60 transition"
              style={{ background: 'linear-gradient(135deg, #14b8a6, #0f766e)' }}>
              <FiSave size={14} /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* QR Card */}
        {showQR && (
          <div className="bg-white rounded-2xl border border-teal-100 p-6 text-center">
            <h3 className="font-bold text-slate-800 mb-1">Emergency Health QR</h3>
            <p className="text-xs text-slate-500 mb-4">Scan to view critical health information in emergencies</p>
            <div className="flex justify-center">
              <QRCodeSVG value={qrData} size={180} level="M" includeMargin />
            </div>
            <p className="text-xs text-slate-400 mt-3">Blood Group · Allergies · Conditions · Emergency Contact</p>
          </div>
        )}

        {/* Vitals */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Basic Information</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Blood Group</label>
              <select value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Select</option>
                {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Height (cm)</label>
              <input type="number" value={form.height || ''} onChange={(e) => setForm({ ...form, height: e.target.value })}
                placeholder="170" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Weight (kg)</label>
              <input type="number" value={form.weight || ''} onChange={(e) => setForm({ ...form, weight: e.target.value })}
                placeholder="65" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>
        </div>

        {/* Allergies */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-800">Allergies</h3>
            <button onClick={() => addItem('allergies', { name: '', severity: 'mild', reactions: '' })}
              className="flex items-center gap-1 text-xs text-teal-600 hover:bg-teal-50 px-2.5 py-1.5 rounded-lg transition">
              <FiPlus size={13} /> Add
            </button>
          </div>
          {(form.allergies || []).length === 0 && <p className="text-xs text-slate-400">No allergies added.</p>}
          <div className="space-y-3">
            {(form.allergies || []).map((a, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input value={a.name} onChange={(e) => updateItem('allergies', i, 'name', e.target.value)}
                  placeholder="e.g. Penicillin" className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <select value={a.severity} onChange={(e) => updateItem('allergies', i, 'severity', e.target.value)}
                  className="px-2 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500">
                  {['mild', 'moderate', 'severe'].map((s) => <option key={s}>{s}</option>)}
                </select>
                <button onClick={() => removeItem('allergies', i)} className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition">
                  <FiTrash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Medical Conditions */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-800">Medical Conditions</h3>
            <button onClick={() => addItem('medicalConditions', { name: '', status: 'active' })}
              className="flex items-center gap-1 text-xs text-teal-600 hover:bg-teal-50 px-2.5 py-1.5 rounded-lg transition">
              <FiPlus size={13} /> Add
            </button>
          </div>
          {(form.medicalConditions || []).length === 0 && <p className="text-xs text-slate-400">No conditions added.</p>}
          <div className="space-y-3">
            {(form.medicalConditions || []).map((c, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input value={c.name} onChange={(e) => updateItem('medicalConditions', i, 'name', e.target.value)}
                  placeholder="e.g. Type 2 Diabetes" className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <select value={c.status} onChange={(e) => updateItem('medicalConditions', i, 'status', e.target.value)}
                  className="px-2 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <button onClick={() => removeItem('medicalConditions', i)} className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition">
                  <FiTrash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Current Medications */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-800">Current Medications</h3>
            <button onClick={() => addItem('currentMedications', { name: '', dosage: '', frequency: '' })}
              className="flex items-center gap-1 text-xs text-teal-600 hover:bg-teal-50 px-2.5 py-1.5 rounded-lg transition">
              <FiPlus size={13} /> Add
            </button>
          </div>
          {(form.currentMedications || []).length === 0 && <p className="text-xs text-slate-400">No medications added.</p>}
          <div className="space-y-3">
            {(form.currentMedications || []).map((m, i) => (
              <div key={i} className="flex gap-2 items-center flex-wrap">
                <input value={m.name} onChange={(e) => updateItem('currentMedications', i, 'name', e.target.value)}
                  placeholder="Medicine name" className="flex-1 min-w-28 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <input value={m.dosage} onChange={(e) => updateItem('currentMedications', i, 'dosage', e.target.value)}
                  placeholder="500mg" className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <input value={m.frequency} onChange={(e) => updateItem('currentMedications', i, 'frequency', e.target.value)}
                  placeholder="Twice daily" className="w-28 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <button onClick={() => removeItem('currentMedications', i)} className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition">
                  <FiTrash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-800">Emergency Contacts</h3>
            <button onClick={() => addItem('emergencyContacts', { name: '', phone: '', relation: '' })}
              className="flex items-center gap-1 text-xs text-teal-600 hover:bg-teal-50 px-2.5 py-1.5 rounded-lg transition">
              <FiPlus size={13} /> Add
            </button>
          </div>
          {(form.emergencyContacts || []).length === 0 && <p className="text-xs text-slate-400">No contacts added.</p>}
          <div className="space-y-3">
            {(form.emergencyContacts || []).map((c, i) => (
              <div key={i} className="flex gap-2 items-center flex-wrap">
                <input value={c.name} onChange={(e) => updateItem('emergencyContacts', i, 'name', e.target.value)}
                  placeholder="Name" className="flex-1 min-w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <input value={c.phone} onChange={(e) => updateItem('emergencyContacts', i, 'phone', e.target.value)}
                  placeholder="+91..." className="w-36 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <input value={c.relation} onChange={(e) => updateItem('emergencyContacts', i, 'relation', e.target.value)}
                  placeholder="Relation" className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <button onClick={() => removeItem('emergencyContacts', i)} className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition">
                  <FiTrash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthSummary;
