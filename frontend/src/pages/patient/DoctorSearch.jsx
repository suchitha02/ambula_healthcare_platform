import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import {
  FiSearch, FiStar, FiClock, FiDollarSign, FiChevronLeft, FiActivity, FiFilter,
  FiHeart, FiSun, FiUsers, FiZap, FiMessageCircle, FiVolume2,
  FiThermometer, FiGlobe, FiMapPin,
} from 'react-icons/fi';
import { GiBoneKnife } from 'react-icons/gi';
import { FaVenus } from 'react-icons/fa';

const SPECIALIZATIONS = [
  'General', 'Cardiology', 'Dermatology', 'Pediatrics',
  'Orthopedics', 'Neurology', 'Psychiatry', 'ENT', 'Gynecology', 'Gastroenterology',
];

const SPEC_ICONS = {
  General: FiActivity, Cardiology: FiHeart, Dermatology: FiSun, Pediatrics: FiUsers,
  Orthopedics: GiBoneKnife, Neurology: FiZap, Psychiatry: FiMessageCircle, ENT: FiVolume2,
  Gynecology: FaVenus, Gastroenterology: FiThermometer,
};

const SpecIcon = ({ specialization, size = 16, className = '' }) => {
  const Icon = SPEC_ICONS[specialization] || FiActivity;
  return <Icon size={size} className={className} />;
};

const DoctorSearch = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [filters, setFilters] = useState({ specialization: '', sortBy: 'rating' });
  const { api } = useAuth();
  const navigate = useNavigate();

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.specialization) params.append('specialization', filters.specialization);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (search.trim()) params.append('search', search.trim());
      if (location.trim()) params.append('location', location.trim());

      const res = await api.get(`/doctors?${params}`);
      if (res.data.success) setDoctors(res.data.data);
    } catch {
      toast.error('Failed to fetch doctors');
    }
    setLoading(false);
  }, [filters, search, location]);

  useEffect(() => {
    const t = setTimeout(fetchDoctors, 300);
    return () => clearTimeout(t);
  }, [fetchDoctors]);

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => navigate('/patient/dashboard')} className="text-slate-500 hover:text-slate-800 transition">
            <FiChevronLeft size={22} />
          </button>
          <div className="flex items-center gap-2">
            <FiActivity size={18} className="text-teal-600" />
            <span className="font-bold text-slate-800">Find a Doctor</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Search + filter bar */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-8 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by doctor name or specialty..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
              />
            </div>
            <div className="relative sm:w-56">
              <FiMapPin className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location (e.g. Indiranagar)"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
              />
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <FiFilter size={14} />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
              <button
                onClick={() => setFilters({ ...filters, specialization: '' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${filters.specialization === '' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                All
              </button>
              {SPECIALIZATIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setFilters({ ...filters, specialization: filters.specialization === s ? '' : s })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${filters.specialization === s ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  <SpecIcon specialization={s} size={12} /> {s}
                </button>
              ))}
            </div>

            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="ml-auto text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="rating">Top Rated</option>
              <option value="experience">Most Experienced</option>
              <option value="fee-low">Lowest Fee</option>
              <option value="fee-high">Highest Fee</option>
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500">
            {loading ? 'Searching...' : `${doctors.length} doctor${doctors.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-56 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-20">
            <FiSearch size={48} className="text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No doctors found</p>
            <p className="text-slate-400 text-sm mt-1">Try a different name, specialty, or location.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map((doctor) => (
              <div
                key={doctor._id}
                className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
              >
                {/* Avatar + name */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center flex-shrink-0">
                    <SpecIcon specialization={doctor.specialization} size={20} className="text-teal-700" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800 truncate">{doctor.userId?.name}</h3>
                    <p className="text-xs text-teal-600 font-medium">{doctor.specialization}</p>
                    {doctor.location && (
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1 truncate">
                        <FiMapPin size={11} className="flex-shrink-0" /> {doctor.location}
                      </p>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-slate-50 rounded-lg p-2 text-center">
                    <div className="flex items-center justify-center gap-0.5 text-amber-500">
                      <FiStar size={12} fill="currentColor" />
                      <span className="text-xs font-bold text-slate-700">{doctor.averageRating?.toFixed(1) || '—'}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{doctor.totalReviews || 0} reviews</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      <FiClock size={12} className="text-slate-500" />
                      <span className="text-xs font-bold text-slate-700">{doctor.experience || '—'}y</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">exp.</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      <FiDollarSign size={12} className="text-slate-500" />
                      <span className="text-xs font-bold text-slate-700">₹{doctor.consultationFee}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">fee</div>
                  </div>
                </div>

                {doctor.languages?.length > 0 && (
                  <p className="text-xs text-slate-400 mb-4 truncate flex items-center gap-1.5">
                    <FiGlobe size={12} className="flex-shrink-0" /> {doctor.languages.join(', ')}
                  </p>
                )}

                {doctor.bio && (
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2 flex-1">{doctor.bio}</p>
                )}

                <button
                  onClick={() => navigate(`/patient/book/${doctor._id}`)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition"
                  style={{ background: 'linear-gradient(135deg, #14b8a6, #0f766e)' }}
                >
                  Book Appointment
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorSearch;
