import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import {
  FiChevronLeft, FiActivity, FiUpload, FiFileText, FiImage,
  FiTrash2, FiFilter, FiDownload, FiFile, FiClipboard,
} from 'react-icons/fi';
import { GiMedicines, GiTestTubes, GiHealthNormal } from 'react-icons/gi';

const RECORD_TYPES = ['prescription', 'lab-report', 'scan', 'medical-history', 'vaccine-record'];
const TYPE_LABELS = {
  prescription: { label: 'Prescription', icon: GiMedicines, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  'lab-report': { label: 'Lab Report', icon: GiTestTubes, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  scan: { label: 'Scan / Imaging', icon: FiImage, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  'medical-history': { label: 'Medical History', icon: FiClipboard, color: 'bg-slate-50 text-slate-700 border-slate-200' },
  'vaccine-record': { label: 'Vaccine Record', icon: GiHealthNormal, color: 'bg-green-50 text-green-700 border-green-200' },
};

const Records = () => {
  const { api } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ type: 'prescription', title: '', description: '', file: null });

  useEffect(() => { fetchRecords(); }, [filter]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = filter ? `?type=${filter}` : '';
      const res = await api.get(`/health-records/me${params}`);
      if (res.data.success) setRecords(res.data.data);
    } catch { toast.error('Failed to load records'); }
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!uploadForm.title.trim()) return toast.error('Please add a title');
    setUploading(true);
    try {
      const body = new FormData();
      body.append('type', uploadForm.type);
      body.append('title', uploadForm.title);
      body.append('description', uploadForm.description);
      if (uploadForm.file) body.append('file', uploadForm.file);

      await api.post('/health-records/me', body, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Record uploaded!');
      setShowUpload(false);
      setUploadForm({ type: 'prescription', title: '', description: '', file: null });
      fetchRecords();
    } catch { toast.error('Upload failed'); }
    setUploading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      await api.delete(`/health-records/${id}`);
      toast.success('Deleted');
      setRecords(records.filter((r) => r._id !== id));
    } catch { toast.error('Failed to delete'); }
  };

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
              <span className="font-bold text-slate-800">Health Records</span>
            </div>
          </div>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-white rounded-xl transition"
            style={{ background: 'linear-gradient(135deg, #14b8a6, #0f766e)' }}
          >
            <FiUpload size={14} /> Upload
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Upload panel */}
        {showUpload && (
          <div className="bg-white rounded-2xl border border-teal-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Upload New Record</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Record Type</label>
                  <select value={uploadForm.type} onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                    {RECORD_TYPES.map((t) => (
                      <option key={t} value={t}>{TYPE_LABELS[t].label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Title *</label>
                  <input value={uploadForm.title} onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    placeholder="e.g. Blood Test - June 2025"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Description (optional)</label>
                <input value={uploadForm.description} onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  placeholder="Any notes about this record"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">File (optional)</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition"
                >
                  {uploadForm.file ? (
                    <p className="text-sm font-medium text-teal-700 flex items-center justify-center gap-1.5">
                      <FiFile size={14} /> {uploadForm.file.name}
                    </p>
                  ) : (
                    <>
                      <FiUpload size={24} className="text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">PDF, JPG, PNG up to 10MB</p>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                  onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })} />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={handleUpload} disabled={uploading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition"
                  style={{ background: 'linear-gradient(135deg, #14b8a6, #0f766e)' }}>
                  {uploading ? 'Uploading...' : 'Upload Record'}
                </button>
                <button onClick={() => setShowUpload(false)}
                  className="px-5 py-2.5 rounded-xl text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <div className="flex items-center gap-1 text-xs text-slate-500 mr-1">
            <FiFilter size={12} />
          </div>
          <button onClick={() => setFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${!filter ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            All
          </button>
          {RECORD_TYPES.map((t) => {
            const Icon = TYPE_LABELS[t].icon;
            return (
              <button key={t} onClick={() => setFilter(filter === t ? '' : t)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${filter === t ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                <Icon size={12} /> {TYPE_LABELS[t].label}
              </button>
            );
          })}
        </div>

        {/* Records list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
            <FiFileText size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No records yet.</p>
            <button onClick={() => setShowUpload(true)}
              className="mt-4 px-5 py-2 text-sm text-teal-600 border border-teal-200 rounded-xl hover:bg-teal-50 transition">
              Upload your first record
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((r) => {
              const meta = TYPE_LABELS[r.type] || TYPE_LABELS.prescription;
              const Icon = meta.icon;
              return (
                <div key={r._id} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-start gap-4 hover:shadow-sm transition">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm truncate">{r.title}</p>
                        {r.description && <p className="text-xs text-slate-400 mt-0.5">{r.description}</p>}
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        {r.file?.url && (
                          <a href={r.file.url} target="_blank" rel="noreferrer"
                            className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition">
                            <FiDownload size={14} />
                          </a>
                        )}
                        <button onClick={() => handleDelete(r._id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${meta.color}`}>{meta.label}</span>
                      <span className="text-xs text-slate-400">
                        {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      {r.file?.fileName && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <FiFile size={10} /> {r.file.fileName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Records;
