import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiActivity, FiStar } from 'react-icons/fi';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(form.email, form.password);
    if (result.success) {
      toast.success('Welcome back!');
      navigate(result.user.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
    } else {
      toast.error(result.error || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12 text-white"
        style={{ background: 'linear-gradient(135deg, #0f766e 0%, #115e59 50%, #042f2e 100%)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <FiActivity size={22} className="text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">Ambula</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Better healthcare,<br />within reach.
          </h1>
          <p className="text-teal-200 text-lg">
            Connect with verified doctors, manage your health records, and book appointments — all in under 2 minutes.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[['500+', 'Doctors'], ['50K+', 'Patients'], ['4.8', 'Rating']].map(([n, l]) => (
            <div key={l} className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold flex items-center justify-center gap-1">
                {n}
                {l === 'Rating' && <FiStar size={16} fill="currentColor" className="text-amber-300" />}
              </div>
              <div className="text-teal-200 text-sm">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <FiActivity size={22} className="text-teal-600" />
            <span className="text-xl font-bold text-slate-800">Ambula</span>
          </div>

          <h2 className="text-3xl font-bold text-slate-800 mb-1">Sign in</h2>
          <p className="text-slate-500 mb-8">Enter your credentials to continue</p>

          <form onSubmit={submit} className="space-y-4">
            <div className="relative">
              <FiMail className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
              <input
                type="email" name="email" value={form.email} onChange={handle} required
                placeholder="Email address"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition text-sm"
              />
            </div>
            <div className="relative">
              <FiLock className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
              <input
                type="password" name="password" value={form.password} onChange={handle} required
                placeholder="Password"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition text-sm"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all duration-200 disabled:opacity-60"
              style={{ background: loading ? '#94a3b8' : 'linear-gradient(135deg, #14b8a6, #0f766e)' }}
            >
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-teal-600 font-semibold hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
