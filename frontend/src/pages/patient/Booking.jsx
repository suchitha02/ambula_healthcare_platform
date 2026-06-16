import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import {
  FiChevronLeft, FiStar, FiClock, FiCalendar, FiCheckCircle,
  FiActivity, FiCopy, FiMonitor, FiMapPin, FiUser,
} from 'react-icons/fi';

const BookingPage = () => {
  const { doctorId } = useParams();
  const { api, user } = useAuth();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [consultationType, setConsultationType] = useState('offline');
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [confirmed, setConfirmed] = useState(null); // { bookingId, appointmentId }
  const [patientDetails, setPatientDetails] = useState({ name: '', age: '', phone: '' });

  useEffect(() => { fetchDoctor(); }, []);
  useEffect(() => { if (selectedDate) fetchSlots(); }, [selectedDate]);
  useEffect(() => {
    if (user) {
      setPatientDetails((p) => ({ ...p, name: p.name || user.name || '', phone: p.phone || user.phone || '' }));
    }
  }, [user]);

  const fetchDoctor = async () => {
    try {
      const res = await api.get(`/doctors/${doctorId}`);
      if (res.data.success) setDoctor(res.data.data);
    } catch {
      toast.error('Doctor not found');
      navigate('/patient/search-doctors');
    }
    setLoading(false);
  };

  const fetchSlots = async () => {
    setSlotsLoading(true);
    try {
      const res = await api.get(`/doctors/${doctorId}/available-slots?date=${selectedDate}`);
      if (res.data.success) { setSlots(res.data.slots); setSelectedSlot(null); }
    } catch { toast.error('Failed to fetch slots'); }
    setSlotsLoading(false);
  };

  const handleBook = async () => {
    if (!selectedSlot) return toast.error('Please select a time slot');
    if (!patientDetails.name.trim()) return toast.error('Please enter the patient name');
    const ageNum = Number(patientDetails.age);
    if (!patientDetails.age || Number.isNaN(ageNum) || ageNum <= 0 || ageNum > 120) return toast.error('Please enter a valid age');
    if (!patientDetails.phone.trim() || patientDetails.phone.trim().length < 7) return toast.error('Please enter a valid phone number');

    setBooking(true);
    try {
      const res = await api.post('/appointments/book', {
        slotId: selectedSlot._id,
        doctorId,
        consultationType,
        patientDetails: {
          name: patientDetails.name.trim(),
          age: ageNum,
          phone: patientDetails.phone.trim(),
        },
      });
      if (res.data.success) {
        setConfirmed({ bookingId: res.data.bookingId, appointmentId: res.data.appointmentId });
        toast.success('Appointment confirmed!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed. Please try another slot.');
    }
    setBooking(false);
  };

  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];
  const maxDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // Booking confirmed view
  if (confirmed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div className="bg-white rounded-2xl border border-slate-100 p-10 max-w-sm w-full text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
            <FiCheckCircle size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Confirmed!</h2>
          <p className="text-slate-500 text-sm mb-6">Your appointment has been booked successfully.</p>

          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs text-slate-400 mb-1">Booking ID</p>
            <div className="flex items-center justify-between">
              <p className="font-mono font-bold text-slate-800 text-sm">{confirmed.bookingId}</p>
              <button
                onClick={() => { navigator.clipboard.writeText(confirmed.bookingId); toast.success('Copied!'); }}
                className="text-teal-600 hover:bg-teal-50 p-1.5 rounded-lg transition"
              >
                <FiCopy size={14} />
              </button>
            </div>
          </div>

          <div className="bg-teal-50 rounded-xl p-4 mb-6 text-left text-sm">
            <p className="font-medium text-teal-800">{doctor?.userId?.name}</p>
            <p className="text-teal-600 text-xs">{doctor?.specialization}</p>
            <p className="text-teal-700 text-xs mt-2 flex items-center gap-1.5">
              <FiCalendar size={12} />
              {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long' })}
              {' · '}{selectedSlot?.startTime}
            </p>
            <p className="text-teal-700 text-xs capitalize flex items-center gap-1.5 mt-1">
              {consultationType === 'online' ? <FiMonitor size={12} /> : <FiMapPin size={12} />}
              {consultationType === 'online' ? 'Online' : 'In-person'}
            </p>
          </div>

          <button
            onClick={() => navigate('/patient/dashboard')}
            className="w-full py-3 rounded-xl font-semibold text-white text-sm"
            style={{ background: 'linear-gradient(135deg, #14b8a6, #0f766e)' }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => navigate('/patient/search-doctors')} className="text-slate-500 hover:text-slate-800 transition">
            <FiChevronLeft size={22} />
          </button>
          <div className="flex items-center gap-2">
            <FiActivity size={18} className="text-teal-600" />
            <span className="font-bold text-slate-800">Book Appointment</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Doctor card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 sticky top-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center">
                  <FiActivity size={24} className="text-teal-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{doctor?.userId?.name}</h3>
                  <p className="text-xs text-teal-600 font-medium">{doctor?.specialization}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {doctor?.averageRating !== undefined && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <FiStar size={14} className="text-amber-500" />
                    <span>{doctor.averageRating?.toFixed(1)} · {doctor.totalReviews} reviews</span>
                  </div>
                )}
                {doctor?.experience && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <FiClock size={14} />
                    <span>{doctor.experience} years experience</span>
                  </div>
                )}
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <span className="text-slate-400 text-xs">Consultation Fee</span>
                </div>
                <div className="bg-teal-50 rounded-xl p-3 text-center">
                  <span className="text-2xl font-bold text-teal-700">₹{doctor?.consultationFee}</span>
                </div>
              </div>
              {doctor?.bio && <p className="text-xs text-slate-500 mt-3 leading-relaxed">{doctor.bio}</p>}
            </div>
          </div>

          {/* Booking form */}
          <div className="lg:col-span-2 space-y-4">
            {/* Consultation type */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h4 className="font-semibold text-slate-700 text-sm mb-3">Consultation Type</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { v: 'offline', label: 'In-Person', icon: <FiMapPin size={16}/>, desc: 'Visit the clinic' },
                  { v: 'online', label: 'Online', icon: <FiMonitor size={16}/>, desc: 'Video consultation' },
                ].map(({ v, label, icon, desc }) => (
                  <button key={v} onClick={() => setConsultationType(v)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition ${consultationType === v ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <div className={`${consultationType === v ? 'text-teal-600' : 'text-slate-400'}`}>{icon}</div>
                    <div>
                      <p className={`text-sm font-semibold ${consultationType === v ? 'text-teal-700' : 'text-slate-700'}`}>{label}</p>
                      <p className="text-xs text-slate-400">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Date selection */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h4 className="font-semibold text-slate-700 text-sm mb-3 flex items-center gap-2">
                <FiCalendar size={15} className="text-teal-600" /> Select Date
                <span className="text-xs text-slate-400 font-normal">(next 7 days)</span>
              </h4>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(tomorrow);
                  d.setDate(tomorrow.getDate() + i);
                  const iso = d.toISOString().split('T')[0];
                  const isSelected = selectedDate === iso;
                  return (
                    <button key={iso} onClick={() => setSelectedDate(iso)}
                      className={`flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-xl border-2 transition text-sm ${isSelected ? 'border-teal-500 bg-teal-600 text-white' : 'border-slate-200 hover:border-teal-300 text-slate-700'}`}>
                      <span className="text-xs font-medium opacity-75">{d.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                      <span className="text-lg font-bold">{d.getDate()}</span>
                      <span className="text-xs opacity-75">{d.toLocaleDateString('en-IN', { month: 'short' })}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slot selection */}
            {selectedDate && (
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <h4 className="font-semibold text-slate-700 text-sm mb-3 flex items-center gap-2">
                  <FiClock size={15} className="text-teal-600" /> Available Slots
                </h4>
                {slotsLoading ? (
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-slate-400 text-sm py-4 text-center">No slots available. Try another date.</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots.map((slot) => (
                      <button key={slot._id} onClick={() => setSelectedSlot(slot)}
                        className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition ${selectedSlot?._id === slot._id ? 'border-teal-500 bg-teal-600 text-white' : 'border-slate-200 text-slate-700 hover:border-teal-300'}`}>
                        {slot.startTime}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Patient details */}
            {selectedSlot && (
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <h4 className="font-semibold text-slate-700 text-sm mb-3 flex items-center gap-2">
                  <FiUser size={15} className="text-teal-600" /> Patient Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="text-xs text-slate-500 mb-1 block">Full Name</label>
                    <input
                      type="text"
                      value={patientDetails.name}
                      onChange={(e) => setPatientDetails({ ...patientDetails, name: e.target.value })}
                      placeholder="Patient's full name"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Age</label>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={patientDetails.age}
                      onChange={(e) => setPatientDetails({ ...patientDetails, age: e.target.value })}
                      placeholder="Age"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Phone Number</label>
                    <input
                      type="tel"
                      value={patientDetails.phone}
                      onChange={(e) => setPatientDetails({ ...patientDetails, phone: e.target.value })}
                      placeholder="+91..."
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Booking on behalf of a family member? Just enter their details here.
                </p>
              </div>
            )}

            {/* Summary + CTA */}
            {selectedSlot && (
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <h4 className="font-semibold text-slate-700 text-sm mb-4">Booking Summary</h4>
                <div className="space-y-2 text-sm text-slate-600 mb-5">
                  <div className="flex justify-between">
                    <span>Doctor</span>
                    <span className="font-medium text-slate-800">{doctor?.userId?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date & Time</span>
                    <span className="font-medium text-slate-800">
                      {new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {selectedSlot.startTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type</span>
                    <span className="font-medium text-slate-800 capitalize">{consultationType}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-2 font-semibold text-slate-800">
                    <span>Consultation Fee</span>
                    <span>₹{doctor?.consultationFee}</span>
                  </div>
                </div>
                <button onClick={handleBook} disabled={booking}
                  className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #14b8a6, #0f766e)' }}>
                  {booking ? 'Booking...' : 'Confirm Appointment →'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
