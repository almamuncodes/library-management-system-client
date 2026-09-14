'use client';
import { useState } from 'react';
import { X, Calendar, Clock, BookOpen, User, Phone, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function BorrowRequestModal({ book, user, onClose, onSuccess }) {
  const [days, setDays] = useState(14);
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!book) return null;

  // Calculate expected due date
  const expectedDue = new Date();
  expectedDue.setDate(expectedDue.getDate() + Number(days));
  const formattedDueDate = expectedDue.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const durationOptions = [
    { label: '7 Days', value: 7, desc: 'Quick reading (1 week)' },
    { label: '14 Days', value: 14, desc: 'Standard borrow (2 weeks)' },
    { label: '21 Days', value: 21, desc: 'Extended study (3 weeks)' },
    { label: '30 Days', value: 30, desc: 'Semester research (1 month)' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.requestBorrow({
        bookId: book._id,
        userId: user?.id || user?._id || 'guest_user',
        userName: user?.name || 'Student Member',
        userEmail: user?.email || '',
        userPhone: phone || user?.phone || '',
        borrowDays: Number(days),
      });

      setSuccessMsg(res.message || 'Borrow request sent to librarian!');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to submit borrow request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Borrow Book Request</h2>
              <p className="text-xs text-slate-400">Specify duration and submit to librarian</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-rose-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-emerald-400 text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Book Info Card */}
          <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/50 flex gap-4 items-center">
            {book.coverImage ? (
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-16 h-22 object-cover rounded-lg shadow border border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-16 h-22 bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-semibold tracking-wider text-emerald-400 uppercase bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                {book.category}
              </span>
              <h3 className="text-base font-semibold text-white truncate mt-1">{book.title}</h3>
              <p className="text-xs text-slate-400 truncate">By {book.author}</p>
              <div className="mt-2 text-xs text-slate-300">
                In Stock:{' '}
                <span className={`font-semibold ${book.availableQuantity > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {book.availableQuantity} of {book.quantity} copies
                </span>
              </div>
            </div>
          </div>

          {/* Duration Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Select Borrow Duration (Days)
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {durationOptions.map((opt) => {
                const isSelected = days === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDays(opt.value)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-950/30'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{opt.label}</span>
                      <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due Date Preview */}
          <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/20 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-slate-300 text-xs">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Expected Due Date:</span>
            </div>
            <span className="text-sm font-bold text-emerald-400">{formattedDueDate}</span>
          </div>

          {/* Student Info Verification */}
          <div className="space-y-3 pt-1 border-t border-slate-800/80">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Borrower Details
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-800/40 rounded-lg border border-slate-750 flex items-center gap-2 text-slate-300">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{user?.name || 'Student Member'}</span>
              </div>
              <div className="p-2.5 bg-slate-800/40 rounded-lg border border-slate-750 flex items-center gap-2 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{user?.email || 'N/A'}</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Contact Phone (for return reminders):
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 01700000000"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || book.availableQuantity <= 0 || !!successMsg}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirm Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
