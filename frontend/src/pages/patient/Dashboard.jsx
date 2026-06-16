import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import {
  FiCalendar, FiFileText, FiClipboard, FiSearch, FiActivity,
  FiClock, FiCheckCircle, FiXCircle, FiAlertCircle, FiUser, FiLogOut, FiHeart,
} from 'react-icons/fi';

const STATUS_STYLES = {
  scheduled:   { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: <FiClock size={14}/> },
  'checked-in':{ bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: <FiAlertCircle size={14}/> },
  consulting:  { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: <FiActivity size={14}/> },
  completed:   { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: <FiCheckCircle size={14}/> },
  cancelled:   { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: <FiXCircle size={14}/> },
};

const PatientDashboard = () => {
  const { user, logout, api } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState(null);

  useEffect(() => { fetchAppointments(); }, []);

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments/my-appointments');
      if (res.data.success) setAppointments(res.data.appointments);
    } catch {
      toast.error('Failed to load appointments');
    }
    setLoading(false);
  };

  const handleCancel = async (id) => {
    try {
      await api.post(`/appointments/${id}/cancel`, { reason: 'Patient requested cancellation' });
      toast.success('Appointment cancelled');
      setCancelId(null);
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const upcoming = appointments.filter((a) => ['scheduled', 'checked-in', 'consulting'].includes(a.status));
  const past = appointments.filter((a) => ['completed', 'cancelled'].includes(a.status));

  const quickActions = [
  {
    label: 'Find Doctor',
    desc: 'Search by specialty',
    icon: <FiSearch size={22} />,
    bgClass: 'bg-gradient-to-br from-teal-500 to-teal-600',
    path: '/patient/search-doctors'
  },
  {
    label: 'Health Summary',
    desc: 'Update medical info',
    icon: <FiHeart size={22} />,
    bgClass: 'bg-gradient-to-br from-rose-500 to-rose-600',
    path: '/patient/health-summary'
  },
  {
    label: 'Health Records',
    desc: 'Upload & manage files',
    icon: <FiFileText size={22} />,
    bgClass: 'bg-gradient-to-br from-violet-500 to-violet-600',
    path: '/patient/records'
  }
];

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiActivity size={20} className="text-teal-600" />
            <span className="font-bold text-slate-800 text-lg">Ambula</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                <FiUser size={14} className="text-teal-700" />
              </div>
              <span className="font-medium">{user?.name}</span>
            </div>
            <button onClick={() => { logout(); navigate('/login'); }}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 transition px-3 py-1.5 rounded-lg hover:bg-red-50">
              <FiLogOut size={15} /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Good day, {user?.name?.split(' ')[0]}</h1>
          <p className="text-slate-500 text-sm mt-1">You have {upcoming.length} upcoming appointment{upcoming.length !== 1 ? 's' : ''}.</p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {quickActions.map((a) => (
            <button key={a.label} onClick={() => navigate(a.path)} className={a.className}>
              <div className="bg-white/20 rounded-xl p-2.5">{a.icon}</div>
              <div>
                <div className="font-semibold">{a.label}</div>
                <div className="text-white/75 text-xs mt-0.5">{a.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Upcoming appointments */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <FiCalendar size={18} className="text-teal-600" /> Upcoming
            </h2>
            <span className="text-xs bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full font-medium">{upcoming.length}</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
              <FiCalendar size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No upcoming appointments.</p>
              <button onClick={() => navigate('/patient/search-doctors')}
                className="mt-4 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-xl font-medium transition">
                Find a Doctor
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((apt) => {
                const s = STATUS_STYLES[apt.status] || STATUS_STYLES.scheduled;
                return (
                  <div key={apt._id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-sm transition">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate">
                          {apt.doctorId?.userId?.name || 'Doctor'}
                        </p>
                        <p className="text-sm text-slate-500">{apt.doctorId?.specialization}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                          {apt.slotId && (
                            <span className="flex items-center gap-1">
                              <FiClock size={12} />
                              {new Date(apt.slotId.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {apt.slotId.startTime}
                            </span>
                          )}
                          <span className="capitalize">{apt.consultationType}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">ID: {apt.bookingId}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
                          {s.icon} {apt.status.replace('-', ' ')}
                        </span>
                        {apt.status === 'scheduled' && (
                          cancelId === apt._id ? (
                            <div className="flex gap-2">
                              <button onClick={() => handleCancel(apt._id)} className="text-xs text-white bg-red-500 px-2.5 py-1 rounded-lg">Confirm</button>
                              <button onClick={() => setCancelId(null)} className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">No</button>
                            </div>
                          ) : (
                            <button onClick={() => setCancelId(apt._id)} className="text-xs text-red-500 hover:bg-red-50 px-2.5 py-1 rounded-lg transition">Cancel</button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Past appointments */}
        {past.length > 0 && (
          <section>
            <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-4">
              <FiClipboard size={18} className="text-slate-400" /> Past Appointments
            </h2>
            <div className="space-y-2">
              {past.slice(0, 5).map((apt) => {
                const s = STATUS_STYLES[apt.status] || STATUS_STYLES.completed;
                return (
                  <div key={apt._id} className="bg-white rounded-xl border border-slate-100 px-5 py-3.5 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-700 text-sm">{apt.doctorId?.userId?.name}</p>
                      <p className="text-xs text-slate-400">
                        {apt.slotId && new Date(apt.slotId.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}{apt.doctorId?.specialization}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex items-center gap-1 ${s.bg} ${s.text} ${s.border}`}>
                      {s.icon} {apt.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;
