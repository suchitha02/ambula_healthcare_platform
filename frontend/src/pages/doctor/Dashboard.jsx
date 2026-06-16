import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import {
  FiActivity, FiLogOut, FiUser, FiCalendar, FiClock, FiSettings,
  FiPlus, FiChevronDown, FiChevronUp, FiCheck, FiAlertCircle,
  FiFileText, FiEdit3, FiSliders, FiXCircle, FiPlay, FiCheckCircle, FiStar,
} from 'react-icons/fi';

const SPECIALIZATIONS = [
  'General', 'Cardiology', 'Dermatology', 'Pediatrics',
  'Orthopedics', 'Neurology', 'Psychiatry', 'ENT', 'Gynecology', 'Gastroenterology',
];

const STATUS_COLORS = {
  scheduled:    'bg-blue-50 text-blue-700 border-blue-200',
  'checked-in': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  consulting:   'bg-purple-50 text-purple-700 border-purple-200',
  completed:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled:    'bg-red-50 text-red-700 border-red-200',
};

const NEXT_STATUS = {
  scheduled: 'checked-in',
  'checked-in': 'consulting',
  consulting: 'completed',
};

const NEXT_LABEL = {
  scheduled: { icon: FiCheck, label: 'Check In' },
  'checked-in': { icon: FiPlay, label: 'Start Consult' },
  consulting: { icon: FiCheckCircle, label: 'Complete' },
};

const DoctorDashboard = () => {
  const { user, logout, api } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('today'); // 'today' | 'all' | 'slots' | 'profile'

  // Slot creation
  const [slotForm, setSlotForm] = useState({ date: '', startTime: '', endTime: '', consultationType: 'both' });
  const [slotBulk, setSlotBulk] = useState(false);
  const [slotInterval, setSlotInterval] = useState(20);

  // Profile edit
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});

  // Block slots
  const [blockForm, setBlockForm] = useState({ startDate: '', endDate: '', reason: 'leave' });
  const [blockLoading, setBlockLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, aptsRes] = await Promise.all([
        api.get('/doctors/me/profile'),
        api.get('/doctors/me/appointments'),
      ]);
      if (profileRes.data.success) {
        setProfile(profileRes.data.data);
        setProfileForm(profileRes.data.data);
      }
      if (aptsRes.data.success) setAppointments(aptsRes.data.appointments);
    } catch (err) {
      if (err.response?.status !== 404) toast.error('Failed to load data');
    }
    setLoading(false);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const todayApts = appointments.filter((a) => {
    if (!a.slotId?.date) return false;
    return new Date(a.slotId.date).toISOString().split('T')[0] === todayStr;
  });

  const handleStatusUpdate = async (aptId, newStatus) => {
    try {
      await api.put(`/appointments/${aptId}/status`, { status: newStatus });
      toast.success(`Status → ${newStatus}`);
      setAppointments(appointments.map((a) => a._id === aptId ? { ...a, status: newStatus } : a));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleSaveNotes = async (aptId) => {
    const n = notes[aptId] || {};
    try {
      await api.put(`/appointments/${aptId}/update-consultation`, {
        diagnosis: n.diagnosis || '',
        notes: n.notes || '',
        followUpDate: n.followUpDate || undefined,
      });
      toast.success('Notes saved!');
      setExpandedApt(null);
      fetchData();
    } catch { toast.error('Failed to save notes'); }
  };

  const handleCreateSlots = async (e) => {
    e.preventDefault();
    try {
      let slots = [];
      if (slotBulk && slotForm.date && slotForm.startTime && slotForm.endTime && slotInterval > 0) {
        // Generate multiple slots
        let cur = slotForm.startTime;
        const end = slotForm.endTime;
        while (cur < end) {
          const [h, m] = cur.split(':').map(Number);
          const nextMin = h * 60 + m + parseInt(slotInterval);
          const nextH = Math.floor(nextMin / 60).toString().padStart(2, '0');
          const nextM = (nextMin % 60).toString().padStart(2, '0');
          const next = `${nextH}:${nextM}`;
          if (next > end) break;
          slots.push({ startTime: cur, endTime: next, consultationType: slotForm.consultationType });
          cur = next;
        }
      } else {
        slots = [{ startTime: slotForm.startTime, endTime: slotForm.endTime, consultationType: slotForm.consultationType }];
      }

      const res = await api.post('/doctors/me/slots', { date: slotForm.date, slots });
      toast.success(res.data.message);
      setSlotForm({ date: '', startTime: '', endTime: '', consultationType: 'both' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create slots');
    }
  };

  const handleBlockSlots = async (e) => {
    e.preventDefault();
    if (!blockForm.startDate || !blockForm.endDate || !blockForm.reason) {
      toast.error('Please fill in all fields');
      return;
    }
    if (new Date(blockForm.startDate) > new Date(blockForm.endDate)) {
      toast.error('Start date must be before end date');
      return;
    }

    setBlockLoading(true);
    try {
      const res = await api.post('/doctors/me/slots/block-range', {
        startDate: blockForm.startDate,
        endDate: blockForm.endDate,
        reason: blockForm.reason,
      });
      toast.success(res.data.message);
      setBlockForm({ startDate: '', endDate: '', reason: 'leave' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to block slots');
    } finally {
      setBlockLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/doctors/me/profile', profileForm);
      if (res.data.success) {
        setProfile(res.data.data);
        setEditProfile(false);
        toast.success('Profile updated!');
      }
    } catch { toast.error('Failed to update profile'); }
  };

  const handleRegisterProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/doctors/register-profile', profileForm);
      if (res.data.success) {
        setProfile(res.data.data);
        toast.success('Profile created!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create profile');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const displayApts = tab === 'today' ? todayApts : appointments;

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiActivity size={18} className="text-teal-600" />
            <span className="font-bold text-slate-800">Ambula</span>
            <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium ml-1">Doctor</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                <FiUser size={14} className="text-teal-700" />
              </div>
              <span className="font-medium">Dr. {user?.name}</span>
            </div>
            <button onClick={() => { logout(); navigate('/login'); }}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 transition px-3 py-1.5 rounded-lg hover:bg-red-50">
              <FiLogOut size={15} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto pb-0">
            {[
              { key: 'today', label: "Today's Queue", icon: <FiClock size={14}/> },
              { key: 'all', label: 'All Appointments', icon: <FiCalendar size={14}/> },
              { key: 'slots', label: 'Manage Slots', icon: <FiSliders size={14}/> },
              { key: 'profile', label: 'Profile', icon: <FiSettings size={14}/> },
            ].map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                  tab === t.key ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}>
                {t.icon} {t.label}
                {t.key === 'today' && todayApts.length > 0 && (
                  <span className="bg-teal-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {todayApts.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* TODAY / ALL appointments */}
        {(tab === 'today' || tab === 'all') && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-slate-800 text-lg">
                {tab === 'today' ? "Today's Appointments" : 'All Appointments'}
              </h2>
              <span className="text-sm text-slate-500">{displayApts.length} appointment{displayApts.length !== 1 ? 's' : ''}</span>
            </div>

            {displayApts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                <FiCalendar size={40} className="text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">
                  {tab === 'today' ? 'No appointments scheduled for today.' : 'No appointments yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayApts.map((apt) => (
                  <div key={apt._id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-sm transition">
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <FiUser size={15} className="text-slate-500" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">
                                {apt.patientDetails?.name || apt.patientId?.name}
                                {apt.patientDetails?.age && <span className="text-slate-400 font-normal"> · {apt.patientDetails.age}y</span>}
                              </p>
                              <p className="text-xs text-slate-400">{apt.patientDetails?.phone || apt.patientId?.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                            {apt.slotId && (
                              <span className="flex items-center gap-1">
                                <FiClock size={11} />
                                {new Date(apt.slotId.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                {' · '}{apt.slotId.startTime}
                              </span>
                            )}
                            <span className="capitalize">{apt.consultationType}</span>
                            <span className="font-mono text-slate-300">{apt.bookingId?.slice(-8)}</span>
                          </div>

                          {/* Health Summary — visible to the doctor before the consultation */}
                          <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
                            <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                              <FiActivity size={12} /> Health Summary
                            </p>
                            {apt.healthSummary ? (
                              <div className="space-y-1.5 text-xs text-slate-600">
                                <p><span className="text-slate-400">Blood Group:</span> {apt.healthSummary.bloodGroup || '—'}</p>

                                {apt.healthSummary.allergies?.length > 0 && (
                                  <div className="flex items-start gap-1.5 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5 text-red-700">
                                    <FiAlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                                    <span>
                                      <strong>Allergies:</strong>{' '}
                                      {apt.healthSummary.allergies.map((a) => `${a.name}${a.severity ? ` (${a.severity})` : ''}`).join(', ')}
                                    </span>
                                  </div>
                                )}

                                {apt.healthSummary.medicalConditions?.filter((c) => c.status === 'active').length > 0 && (
                                  <div className="flex items-start gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 text-amber-700">
                                    <FiAlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                                    <span>
                                      <strong>Conditions:</strong>{' '}
                                      {apt.healthSummary.medicalConditions.filter((c) => c.status === 'active').map((c) => c.name).join(', ')}
                                    </span>
                                  </div>
                                )}

                                {apt.healthSummary.currentMedications?.length > 0 && (
                                  <p>
                                    <span className="text-slate-400">Current Medications:</span>{' '}
                                    {apt.healthSummary.currentMedications.map((m) => `${m.name}${m.dosage ? ` (${m.dosage})` : ''}`).join(', ')}
                                  </p>
                                )}

                                {!apt.healthSummary.allergies?.length && !apt.healthSummary.medicalConditions?.length && !apt.healthSummary.currentMedications?.length && (
                                  <p className="text-slate-400">No allergies, conditions, or medications on record.</p>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400">Patient has not completed their health summary yet.</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_COLORS[apt.status] || STATUS_COLORS.scheduled}`}>
                            {apt.status.replace('-', ' ')}
                          </span>
                          {NEXT_STATUS[apt.status] && (
                            <button
                              onClick={() => handleStatusUpdate(apt._id, NEXT_STATUS[apt.status])}
                              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition whitespace-nowrap"
                            >
                              {(() => { const N = NEXT_LABEL[apt.status]; const NIcon = N.icon; return <><NIcon size={12} /> {N.label}</>; })()}
                            </button>
                          )}
                          <button
                            onClick={() => setExpandedApt(expandedApt === apt._id ? null : apt._id)}
                            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition"
                          >
                            {expandedApt === apt._id ? <FiChevronUp size={16}/> : <FiChevronDown size={16}/>}
                          </button>
                        </div>
                      </div>

                      {/* Existing consultation notes */}
                      {apt.consultation?.diagnosis && (
                        <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                          <p className="text-xs font-semibold text-emerald-700 mb-1">Consultation Notes</p>
                          <p className="text-xs text-emerald-800"><strong>Diagnosis:</strong> {apt.consultation.diagnosis}</p>
                          {apt.consultation.notes && <p className="text-xs text-emerald-800 mt-0.5"><strong>Notes:</strong> {apt.consultation.notes}</p>}
                        </div>
                      )}
                    </div>

                    {/* Expanded: notes form */}
                    {expandedApt === apt._id && (
                      <div className="border-t border-slate-100 bg-slate-50 p-5">
                        <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-4">
                          <FiEdit3 size={14} className="text-teal-600" /> Add / Update Consultation Notes
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block">Diagnosis *</label>
                            <input
                              value={notes[apt._id]?.diagnosis ?? apt.consultation?.diagnosis ?? ''}
                              onChange={(e) => setNotes({ ...notes, [apt._id]: { ...(notes[apt._id] || {}), diagnosis: e.target.value } })}
                              placeholder="e.g. Viral Fever, Hypertension..."
                              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block">Clinical Notes</label>
                            <textarea
                              value={notes[apt._id]?.notes ?? apt.consultation?.notes ?? ''}
                              onChange={(e) => setNotes({ ...notes, [apt._id]: { ...(notes[apt._id] || {}), notes: e.target.value } })}
                              rows={3}
                              placeholder="Observations, treatment plan, advice..."
                              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white resize-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block">Follow-up Date</label>
                            <input
                              type="date"
                              value={notes[apt._id]?.followUpDate ?? ''}
                              onChange={(e) => setNotes({ ...notes, [apt._id]: { ...(notes[apt._id] || {}), followUpDate: e.target.value } })}
                              className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                            />
                          </div>
                          <div className="flex gap-3">
                            <button onClick={() => handleSaveNotes(apt._id)}
                              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-xl transition"
                              style={{ background: 'linear-gradient(135deg, #14b8a6, #0f766e)' }}>
                              <FiCheck size={14} /> Save Notes
                            </button>
                            <button onClick={() => setExpandedApt(null)}
                              className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition">
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SLOTS MANAGEMENT */}
        {tab === 'slots' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-slate-800">Create Appointment Slots</h2>
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={slotBulk} onChange={(e) => setSlotBulk(e.target.checked)} className="rounded" />
                  Bulk generate
                </label>
              </div>

              <form onSubmit={handleCreateSlots} className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-xs text-slate-500 mb-1 block">Date</label>
                    <input type="date" value={slotForm.date} onChange={(e) => setSlotForm({ ...slotForm, date: e.target.value })} required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">{slotBulk ? 'From' : 'Start Time'}</label>
                    <input type="time" value={slotForm.startTime} onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })} required
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">{slotBulk ? 'Until' : 'End Time'}</label>
                    <input type="time" value={slotForm.endTime} onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })} required
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Consultation Type</label>
                    <select value={slotForm.consultationType} onChange={(e) => setSlotForm({ ...slotForm, consultationType: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                      <option value="both">Both (Online & In-person)</option>
                      <option value="offline">In-person Only</option>
                      <option value="online">Online Only</option>
                    </select>
                  </div>
                  {slotBulk && (
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Slot interval (minutes)</label>
                      <input type="number" value={slotInterval} onChange={(e) => setSlotInterval(e.target.value)} min="5" max="120"
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                  )}
                </div>

                {slotBulk && slotForm.startTime && slotForm.endTime && slotInterval > 0 && (
                  <div className="bg-teal-50 rounded-xl p-3 text-xs text-teal-700">
                    ℹ This will generate approximately{' '}
                    <strong>
                      {Math.floor(((() => {
                        const [sh, sm] = slotForm.startTime.split(':').map(Number);
                        const [eh, em] = slotForm.endTime.split(':').map(Number);
                        return (eh * 60 + em - (sh * 60 + sm));
                      })()) / slotInterval)}
                    </strong>{' '}
                    slots of {slotInterval} minutes each.
                  </div>
                )}

                <button type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition"
                  style={{ background: 'linear-gradient(135deg, #14b8a6, #0f766e)' }}>
                  <FiPlus size={15} /> {slotBulk ? 'Generate Slots' : 'Create Slot'}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-slate-800">Block Slots</h2>
              </div>
              <p className="text-sm text-slate-600 mb-4">Block your availability for leave, holidays, or personal time. All unbooked slots in the selected date range will be blocked.</p>

              <form onSubmit={handleBlockSlots} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Start Date</label>
                    <input type="date" value={blockForm.startDate} onChange={(e) => setBlockForm({ ...blockForm, startDate: e.target.value })} required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">End Date</label>
                    <input type="date" value={blockForm.endDate} onChange={(e) => setBlockForm({ ...blockForm, endDate: e.target.value })} required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Reason</label>
                    <select value={blockForm.reason} onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                      <option value="leave">Sick Leave</option>
                      <option value="holiday">Holiday</option>
                      <option value="personal">Personal</option>
                      <option value="conference">Conference</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <button type="submit" disabled={blockLoading}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)' }}>
                  {blockLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Blocking...
                    </>
                  ) : (
                    <>
                      <FiXCircle size={15} /> Block Slots
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* PROFILE */}
        {tab === 'profile' && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-slate-800">Doctor Profile</h2>
              <button onClick={() => setEditProfile(!editProfile)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${editProfile ? 'bg-slate-100 text-slate-600' : 'text-white'}`}
                style={!editProfile ? { background: 'linear-gradient(135deg, #14b8a6, #0f766e)' } : {}}>
                {editProfile ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {!profile && !editProfile && (
              <div className="text-center py-10">
                <FiUser size={40} className="text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 text-sm mb-4">Complete your doctor profile to appear in patient searches.</p>
                <button onClick={() => setEditProfile(true)}
                  className="px-5 py-2 text-sm font-semibold text-white rounded-xl"
                  style={{ background: 'linear-gradient(135deg, #14b8a6, #0f766e)' }}>
                  Create Profile
                </button>
              </div>
            )}

            {!editProfile && profile && (
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  ['Specialization', profile.specialization],
                  ['License Number', profile.licenseNumber],
                  ['Experience', `${profile.experience} years`],
                  ['Consultation Fee', `₹${profile.consultationFee}`],
                  ['Languages', profile.languages?.join(', ')],
                  ['Location', profile.location],
                  ['Rating', null],
                ].map(([k, v]) => (
                  <div key={k} className="border-b border-slate-50 pb-3">
                    <p className="text-xs text-slate-400">{k}</p>
                    {k === 'Rating' ? (
                      <p className="font-medium text-slate-800 mt-0.5 flex items-center gap-1.5">
                        <FiStar size={14} className="text-amber-500" fill="currentColor" />
                        {profile.averageRating?.toFixed(1) ?? '0.0'} ({profile.totalReviews ?? 0} reviews)
                      </p>
                    ) : (
                      <p className="font-medium text-slate-800 mt-0.5">{v || '—'}</p>
                    )}
                  </div>
                ))}
                {profile.bio && (
                  <div className="md:col-span-2 border-b border-slate-50 pb-3">
                    <p className="text-xs text-slate-400">Bio</p>
                    <p className="text-slate-700 text-sm mt-0.5">{profile.bio}</p>
                  </div>
                )}
              </div>
            )}

            {editProfile && (
              <form onSubmit={profile ? handleSaveProfile : handleRegisterProfile} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { key: 'licenseNumber', label: 'License Number', type: 'text', placeholder: 'MCI-12345' },
                    { key: 'consultationFee', label: 'Consultation Fee (₹)', type: 'number', placeholder: '500' },
                    { key: 'experience', label: 'Experience (years)', type: 'number', placeholder: '5' },
                    { key: 'location', label: 'Location / Area', type: 'text', placeholder: 'e.g. Indiranagar, Bengaluru' },
                  ].map(({ key, label, type, placeholder }) => (
                    <div key={key}>
                      <label className="text-xs text-slate-500 mb-1 block">{label}</label>
                      <input type={type} value={profileForm[key] || ''} onChange={(e) => setProfileForm({ ...profileForm, [key]: e.target.value })}
                        placeholder={placeholder}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Specialization</label>
                    <select value={profileForm.specialization || ''} onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
                      required className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                      <option value="">Select specialization</option>
                      {SPECIALIZATIONS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Languages Spoken</label>
                  <div className="flex flex-wrap gap-2">
                    {['English', 'Hindi', 'Kannada', 'Telugu', 'Tamil'].map((lang) => {
                      const selected = (profileForm.languages || []).includes(lang);
                      return (
                        <button key={lang} type="button"
                          onClick={() => setProfileForm({
                            ...profileForm,
                            languages: selected
                              ? profileForm.languages.filter((l) => l !== lang)
                              : [...(profileForm.languages || []), lang]
                          })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${selected ? 'bg-teal-600 text-white border-teal-600' : 'border-slate-200 text-slate-600 hover:border-teal-300'}`}>
                          {lang}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Bio / About</label>
                  <textarea value={profileForm.bio || ''} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    rows={3} placeholder="Brief description of your practice..."
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
                </div>

                <button type="submit"
                  className="px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition"
                  style={{ background: 'linear-gradient(135deg, #14b8a6, #0f766e)' }}>
                  {profile ? 'Save Changes' : 'Create Profile'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
