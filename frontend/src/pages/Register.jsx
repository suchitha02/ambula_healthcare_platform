import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiPhone, FiLock, FiActivity, FiUserCheck } from 'react-icons/fi';
import { FaUserMd } from 'react-icons/fa';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'patient' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    const { confirmPassword, ...data } = form;
    const result = await register(data);
    if (result.success) {
      toast.success('Account created!');
      navigate(result.user.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
    } else {
      toast.error(result.error || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 mb-8">
          <FiActivity size={22} className="text-teal-600" />
          <span className="text-xl font-bold text-slate-800">Ambula</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-1">Create your account</h2>
          <p className="text-slate-500 text-sm mb-6">Join thousands managing their health better</p>

          {/* Role selector */}
          <div className="flex rounded-xl border border-slate-200 p-1 mb-6">
            {['patient', 'doctor'].map((r) => (
              <button
                key={r} type="button"
                onClick={() => setForm({ ...form, role: r })}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  form.role === r ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {r === 'patient' ? <FiUserCheck size={15} /> : <FaUserMd size={15} />}
                {r === 'patient' ? 'Patient' : 'Doctor'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div className="relative">
              <FiUser className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
              <input type="text" name="name" value={form.name} onChange={handle} required placeholder="Full name"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm transition" />
            </div>
            <div className="relative">
              <FiMail className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
              <input type="email" name="email" value={form.email} onChange={handle} required placeholder="Email address"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm transition" />
            </div>
            <div className="relative">
              <FiPhone className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
              <input type="tel" name="phone" value={form.phone} onChange={handle} placeholder="Phone number (+91...)"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm transition" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <FiLock className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                <input type="password" name="password" value={form.password} onChange={handle} required placeholder="Password"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm transition" />
              </div>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handle} required placeholder="Confirm"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm transition" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 mt-2 rounded-xl font-semibold text-white text-sm transition-all duration-200 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #14b8a6, #0f766e)' }}>
              {loading ? 'Creating account...' : 'Create account →'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-sm mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-teal-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
