'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Edit3,
  Trash2,
  Star,
  BookOpen,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Database,
  Search,
  Inbox,
  Clock,
  Calendar,
  AlertTriangle,
  Phone,
  User,
  Check,
  RotateCcw,
} from 'lucide-react';
import { api } from '@/lib/api';

const PRESET_CATEGORIES = [
  'Programming',
  'Novel',
  'Science',
  'History',
  'Philosophy',
  'Business',
  'Mathematics',
];

export default function AdminPanel({
  isOpen,
  onClose,
  books = [],
  stats,
  onAddBook,
  onUpdateBook,
  onDeleteBook,
  onToggleFeatured,
  onDataRefresh,
  initialBookToEdit,
}) {
  const [activeTab, setActiveTab] = useState(initialBookToEdit ? 'add' : 'requests'); // 'requests' | 'circulation' | 'manage' | 'add' | 'analytics'
  const [searchFilter, setSearchFilter] = useState('');

  // Requests & Circulation data
  const [borrowRecords, setBorrowRecords] = useState([]);
  const [loadingBorrows, setLoadingBorrows] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Form State
  const initialForm = {
    title: '',
    author: '',
    category: 'Programming',
    customCategory: '',
    quantity: 5,
    availableQuantity: 5,
    isFeatured: false,
    coverImage: '',
    description: '',
  };

  const [formData, setFormData] = useState(initialForm);
  const [editingBookId, setEditingBookId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectRecordId, setRejectRecordId] = useState(null);

  // Fetch all borrow records when panel opens or tab changes
  const fetchBorrows = async () => {
    setLoadingBorrows(true);
    try {
      const res = await api.getAllBorrows();
      if (res.success && res.data) {
        setBorrowRecords(res.data);
      }
    } catch (err) {
      console.error('Failed to load borrow records:', err);
    } finally {
      setLoadingBorrows(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBorrows();
      if (initialBookToEdit) {
        handleEditClick(initialBookToEdit);
      }
    }
  }, [isOpen, initialBookToEdit]);

  if (!isOpen) return null;

  // Filtered lists for tabs
  const pendingRequests = borrowRecords.filter((b) => b.status === 'pending');
  const pendingReturns = borrowRecords.filter((b) => b.status === 'return_pending');
  const activeCirculation = borrowRecords.filter(
    (b) => b.status === 'borrowed' || b.status === 'return_pending'
  );

  // Approve borrow handler
  const handleApprove = async (recordId) => {
    setActionLoadingId(recordId);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await api.approveBorrow(recordId);
      setSuccessMessage(res.message || 'Borrow request approved successfully!');
      await fetchBorrows();
      if (onDataRefresh) onDataRefresh();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to approve request');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Accept return handler
  const handleAcceptReturn = async (recordId) => {
    setActionLoadingId(recordId);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await api.acceptReturn(recordId);
      setSuccessMessage(res.message || 'Book return confirmed and inventory restocked!');
      await fetchBorrows();
      if (onDataRefresh) onDataRefresh();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to accept return');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reject borrow handler
  const handleReject = (recordId) => {
    setRejectRecordId(recordId);
    setRejectNote('');
    setRejectModalOpen(true);
  };

  const confirmReject = async () => {
    const note = rejectNote.trim() || 'Declined by librarian';
    setRejectModalOpen(false);
    setActionLoadingId(rejectRecordId);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await api.rejectBorrow(rejectRecordId, note);
      setSuccessMessage(res.message || 'Borrow request declined.');
      await fetchBorrows();
      if (onDataRefresh) onDataRefresh();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to decline request');
    } finally {
      setActionLoadingId(null);
      setRejectRecordId(null);
    }
  };

  // Confirm return handler
  const handleAdminReturn = async (borrow) => {
    setActionLoadingId(borrow._id);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await api.returnBook({
        borrowId: borrow._id,
        bookId: borrow.bookId?._id || borrow.bookId,
        userId: borrow.userId,
      });
      setSuccessMessage(res.message || 'Book returned and restocked!');
      await fetchBorrows();
      if (onDataRefresh) onDataRefresh();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to process return');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const finalCategory =
        formData.category === 'Custom' ? formData.customCategory.trim() : formData.category;

      if (!formData.title || !formData.author || !finalCategory) {
        throw new Error('Title, Author, and Category are required!');
      }

      const payload = {
        title: formData.title,
        author: formData.author,
        category: finalCategory,
        quantity: Number(formData.quantity) || 1,
        availableQuantity: Number(formData.availableQuantity) ?? Number(formData.quantity),
        isFeatured: Boolean(formData.isFeatured),
        coverImage: formData.coverImage,
        description: formData.description,
      };

      if (editingBookId) {
        await onUpdateBook(editingBookId, payload);
        setSuccessMessage('Book updated in database successfully!');
        setEditingBookId(null);
      } else {
        await onAddBook(payload);
        setSuccessMessage('New book saved to database!');
      }

      setFormData(initialForm);
      setTimeout(() => {
        setSuccessMessage('');
        setActiveTab('manage');
      }, 1200);
    } catch (err) {
      setErrorMessage(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (book) => {
    setEditingBookId(book._id);
    const isPreset = PRESET_CATEGORIES.includes(book.category);
    setFormData({
      title: book.title,
      author: book.author,
      category: isPreset ? book.category : 'Custom',
      customCategory: isPreset ? '' : book.category,
      quantity: book.quantity,
      availableQuantity: book.availableQuantity,
      isFeatured: book.isFeatured || false,
      coverImage: book.coverImage || '',
      description: book.description || '',
    });
    setActiveTab('add');
  };

  const handleCancelEdit = () => {
    setEditingBookId(null);
    setFormData(initialForm);
  };

  const filteredBooks = books.filter((b) => {
    const q = searchFilter.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q)
    );
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Due status calculation
  const getDueStatus = (dueDateStr) => {
    if (!dueDateStr) return null;
    const now = new Date();
    const due = new Date(dueDateStr);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        isOverdue: true,
        text: `Overdue by ${Math.abs(diffDays)}d`,
        badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse',
      };
    } else if (diffDays === 0) {
      return {
        isOverdue: false,
        text: 'Due Today!',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30 font-bold',
      };
    } else if (diffDays <= 3) {
      return {
        isOverdue: false,
        text: `${diffDays}d remaining`,
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      };
    } else {
      return {
        isOverdue: false,
        text: `${diffDays}d remaining`,
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      };
    }
  };

  return (
    <div className="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 flex font-sans animate-in fade-in duration-200 selection:bg-indigo-500 selection:text-white">
      
      {/* Sidebar */}
      <aside className="w-64 sm:w-72 flex-shrink-0 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col z-20 shadow-sm">
        {/* Sidebar Header / Brand */}
        <div className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <BookOpen className="w-4 h-4" />
            </div>
            <h1 className="font-bold text-lg text-zinc-900 dark:text-zinc-50 tracking-tight">Admin<span className="text-indigo-600 dark:text-indigo-400">.Lib</span></h1>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
          <p className="px-2 pb-2 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">Requests</p>
          {/* TAB: BORROW REQUESTS */}
          <button
            onClick={() => setActiveTab('requests')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <Inbox className="w-4 h-4" />
              <span>Borrow Requests</span>
            </div>
            {pendingRequests.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'requests' ? 'bg-amber-200 text-amber-900 dark:bg-amber-500/30 dark:text-amber-200' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
              }`}>
                {pendingRequests.length}
              </span>
            )}
          </button>

          {/* TAB: RETURN REQUESTS */}
          <button
            onClick={() => setActiveTab('returns')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'returns'
                ? 'bg-sky-100 text-sky-900 dark:bg-sky-500/20 dark:text-sky-300 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <RotateCcw className="w-4 h-4" />
              <span>Return Requests</span>
            </div>
            {pendingReturns.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'returns' ? 'bg-sky-200 text-sky-900 dark:bg-sky-500/30 dark:text-sky-200' : 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400'
              }`}>
                {pendingReturns.length}
              </span>
            )}
          </button>

          <div className="pt-4 pb-2">
            <p className="px-2 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">Management</p>
          </div>
          {/* TAB: CIRCULATION */}
          <button
            onClick={() => setActiveTab('circulation')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'circulation'
                ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-300 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4" />
              <span>Circulation</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === 'circulation' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-500/30 dark:text-emerald-200' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}>
              {activeCirculation.length}
            </span>
          </button>

          {/* TAB: ALL BOOKS */}
          <button
            onClick={() => setActiveTab('manage')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'manage'
                ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-500/20 dark:text-indigo-300 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4" />
              <span>Inventory</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === 'manage' ? 'bg-indigo-200 text-indigo-900 dark:bg-indigo-500/30 dark:text-indigo-200' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}>
              {books.length}
            </span>
          </button>

          {/* TAB: ADD BOOK */}
          <button
            onClick={() => setActiveTab('add')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'add'
                ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-500/20 dark:text-indigo-300 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <Plus className="w-4 h-4" />
              <span>Add Book</span>
            </div>
          </button>

          <div className="pt-4 pb-2">
            <p className="px-2 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">Reports</p>
          </div>
          {/* TAB: ANALYTICS */}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-purple-100 text-purple-900 dark:bg-purple-500/20 dark:text-purple-300 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </div>
          </button>
        </nav>

        {/* Sidebar Footer / Close */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Close Dashboard</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950/50">
        
        {/* Main Content Header */}
        <header className="h-16 shrink-0 flex items-center justify-between px-8 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
              <span className="capitalize">
                {activeTab === 'requests' && 'Borrow Requests'}
                {activeTab === 'returns' && 'Return Requests'}
                {activeTab === 'circulation' && 'Circulation & Due Tracker'}
                {activeTab === 'manage' && 'Manage All Books'}
                {activeTab === 'add' && 'Add New Book'}
                {activeTab === 'analytics' && 'Library Analytics'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 uppercase tracking-wider">
                Database Connected
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
             <button
                onClick={fetchBorrows}
                className="px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Refresh
              </button>
          </div>
        </header>

        {/* Global Notifications */}
        {(successMessage || errorMessage) && (
          <div className="px-8 pt-6 shrink-0">
            {successMessage && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-sm font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          {/* ======================================================== */}
          {/* TAB 1: BORROW REQUESTS INBOX                             */}
          {/* ======================================================== */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Student Borrow Requests</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      {pendingRequests.length} pending
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Review requested borrow duration and approve or decline book issuance
                  </p>
                </div>
                <button
                  onClick={fetchBorrows}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors"
                >
                  Refresh
                </button>
              </div>

              {loadingBorrows ? (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center">
                  <Loader2 className="w-7 h-7 animate-spin text-amber-500 mb-2" />
                  <p className="text-xs">Loading requests from database...</p>
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center border border-dashed border-slate-850 rounded-2xl">
                  <Inbox className="w-10 h-10 text-slate-600 mb-3" />
                  <p className="font-semibold text-white">No Pending Borrow Requests</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    When students request books from the library catalog, they will arrive here for your approval.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((req) => {
                    const book = req.bookId || {};
                    const isLoadingThis = actionLoadingId === req._id;

                    return (
                      <div
                        key={req._id}
                        className="p-4 bg-slate-850 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-slate-750 transition-all"
                      >
                        <div className="flex items-start gap-4 min-w-0">
                          <img
                            src={
                              book.coverImage ||
                              'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60'
                            }
                            alt={book.title || 'Book cover'}
                            className="w-14 h-20 object-cover rounded-xl border border-slate-750 shrink-0 shadow"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                                {req.borrowDays || 14} Days Duration
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Requested: {formatDate(req.requestDate || req.createdAt)}
                              </span>
                            </div>

                            <h4 className="font-bold text-white text-sm sm:text-base mt-1 truncate">
                              {book.title || 'Unknown Title'}
                            </h4>
                            <p className="text-xs text-slate-400">By {book.author || 'N/A'}</p>

                            {/* Student contact info */}
                            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                              <span className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5 text-slate-500" />
                                <strong>{req.userName || 'Student'}</strong>
                              </span>
                              {req.userPhone && (
                                <span className="flex items-center gap-1 text-emerald-400 font-mono">
                                  <Phone className="w-3.5 h-3.5" />
                                  <a href={`tel:${req.userPhone}`} className="hover:underline">
                                    {req.userPhone}
                                  </a>
                                </span>
                              )}
                              {req.userEmail && (
                                <span className="text-slate-500">{req.userEmail}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                          <button
                            onClick={() => handleReject(req._id)}
                            disabled={isLoadingThis}
                            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 transition-all cursor-pointer disabled:opacity-50"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleApprove(req._id)}
                            disabled={isLoadingThis || (book.availableQuantity <= 0)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                          >
                            {isLoadingThis ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>Accept & Issue</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 1.5: RETURN REQUESTS INBOX                           */}
          {/* ======================================================== */}
          {activeTab === 'returns' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Student Book Return Requests</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      {pendingReturns.length} awaiting confirmation
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Verify physical return of the book, then confirm receipt to restock inventory
                  </p>
                </div>
                <button
                  onClick={fetchBorrows}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors"
                >
                  Refresh
                </button>
              </div>

              {loadingBorrows ? (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center">
                  <Loader2 className="w-7 h-7 animate-spin text-sky-500 mb-2" />
                  <p className="text-xs">Loading return requests from database...</p>
                </div>
              ) : pendingReturns.length === 0 ? (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center border border-dashed border-slate-850 rounded-2xl">
                  <RotateCcw className="w-10 h-10 text-slate-600 mb-3" />
                  <p className="font-semibold text-white">No Pending Return Requests</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    When students submit return requests from their accounts, you can inspect and confirm receipt here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingReturns.map((req) => {
                    const book = req.bookId || {};
                    const isLoadingThis = actionLoadingId === req._id;
                    const dueInfo = getDueStatus(req.dueDate);

                    return (
                      <div
                        key={req._id}
                        className="p-4 bg-slate-850 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-slate-750 transition-all"
                      >
                        <div className="flex items-start gap-4 min-w-0">
                          <img
                            src={
                              book.coverImage ||
                              'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60'
                            }
                            alt={book.title || 'Book cover'}
                            className="w-14 h-20 object-cover rounded-xl border border-slate-750 shrink-0 shadow"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/40 flex items-center gap-1">
                                <RotateCcw className="w-3 h-3" />
                                Return Request Received
                              </span>
                              {dueInfo && (
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${dueInfo.badgeClass}`}
                                >
                                  {dueInfo.text}
                                </span>
                              )}
                            </div>

                            <h4 className="font-bold text-white text-sm sm:text-base mt-1 truncate">
                              {book.title || 'Unknown Title'}
                            </h4>
                            <p className="text-xs text-slate-400">By {book.author || 'N/A'}</p>

                            {/* Student contact info */}
                            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                              <span className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5 text-slate-500" />
                                <strong>{req.userName || 'Student'}</strong>
                              </span>
                              {req.userPhone && (
                                <span className="flex items-center gap-1 text-emerald-400 font-mono">
                                  <Phone className="w-3.5 h-3.5" />
                                  <a href={`tel:${req.userPhone}`} className="hover:underline">
                                    {req.userPhone}
                                  </a>
                                </span>
                              )}
                              <span className="text-slate-500">
                                Issued: {formatDate(req.borrowDate)} &bull; Due: {formatDate(req.dueDate)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                          <button
                            onClick={() => handleAcceptReturn(req._id)}
                            disabled={isLoadingThis}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 transition-all shadow-lg shadow-sky-500/20 cursor-pointer disabled:opacity-50"
                          >
                            {isLoadingThis ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            <span>Confirm Receipt & Restock</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: CIRCULATION & DUE DATE TRACKER                    */}
          {/* ======================================================== */}
          {activeTab === 'circulation' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Active Borrowed Books Tracker</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      {activeCirculation.length} in circulation
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Monitor due dates, overdue students, phone numbers & confirm returns
                  </p>
                </div>
                <button
                  onClick={fetchBorrows}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors"
                >
                  Refresh
                </button>
              </div>

              {loadingBorrows ? (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center">
                  <Loader2 className="w-7 h-7 animate-spin text-emerald-500 mb-2" />
                  <p className="text-xs">Loading active records from database...</p>
                </div>
              ) : activeCirculation.length === 0 ? (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center border border-dashed border-slate-850 rounded-2xl">
                  <Clock className="w-10 h-10 text-slate-600 mb-3" />
                  <p className="font-semibold text-white">No Books Currently Issued</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    All books are safely stored in the library inventory.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeCirculation.map((b) => {
                    const book = b.bookId || {};
                    const dueInfo = getDueStatus(b.dueDate);
                    const isLoadingThis = actionLoadingId === b._id;

                    return (
                      <div
                        key={b._id}
                        className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                          dueInfo?.isOverdue
                            ? 'bg-rose-950/20 border-rose-500/40'
                            : 'bg-slate-850 border-slate-800 hover:border-slate-750'
                        }`}
                      >
                        <div className="flex items-start gap-4 min-w-0">
                          <img
                            src={
                              book.coverImage ||
                              'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60'
                            }
                            alt={book.title || 'Book cover'}
                            className="w-14 h-20 object-cover rounded-xl border border-slate-750 shrink-0 shadow"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {dueInfo && (
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${dueInfo.badgeClass}`}
                                >
                                  {dueInfo.isOverdue && <AlertTriangle className="w-3 h-3" />}
                                  {dueInfo.text}
                                </span>
                              )}
                              <span className="text-[11px] text-slate-400">
                                Due Date: <strong className="text-slate-200">{formatDate(b.dueDate)}</strong>
                              </span>
                            </div>

                            <h4 className="font-bold text-white text-sm sm:text-base mt-1 truncate">
                              {book.title || 'Unknown Title'}
                            </h4>
                            <p className="text-xs text-slate-400">By {book.author || 'N/A'}</p>

                            {/* Student Contact Information */}
                            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs">
                              <span className="flex items-center gap-1 text-slate-300">
                                <User className="w-3.5 h-3.5 text-slate-500" />
                                <strong>{b.userName || 'Student'}</strong>
                              </span>
                              {b.userPhone ? (
                                <span className="flex items-center gap-1 text-emerald-400 font-mono">
                                  <Phone className="w-3.5 h-3.5" />
                                  <a href={`tel:${b.userPhone}`} className="hover:underline">
                                    {b.userPhone}
                                  </a>
                                </span>
                              ) : (
                                <span className="text-slate-500 text-[11px]">No phone on file</span>
                              )}
                              {b.userEmail && (
                                <span className="text-slate-500 text-[11px]">{b.userEmail}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Admin Action: Confirm Return */}
                        <div className="self-end md:self-center shrink-0">
                          <button
                            onClick={() => handleAdminReturn(b)}
                            disabled={isLoadingThis}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md cursor-pointer disabled:opacity-50"
                          >
                            {isLoadingThis ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3.5 h-3.5" />
                            )}
                            <span>Confirm Return & Restock</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: MANAGE ALL BOOKS (INVENTORY)                      */}
          {/* ======================================================== */}
          {activeTab === 'manage' && (
            <div className="space-y-4">
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter inventory books by title, author, category..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Table */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-850 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Book Details</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Stock (Avail / Total)</th>
                      <th className="py-3 px-4 text-center">Featured</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900">
                    {filteredBooks.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          No matching books found in database
                        </td>
                      </tr>
                    ) : (
                      filteredBooks.map((book) => (
                        <tr key={book._id} className="hover:bg-slate-850/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  book.coverImage ||
                                  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60'
                                }
                                alt={book.title}
                                className="w-9 h-12 object-cover rounded shadow-xs shrink-0"
                              />
                              <div>
                                <h4 className="font-semibold text-white line-clamp-1 max-w-xs">
                                  {book.title}
                                </h4>
                                <p className="text-xs text-slate-400">{book.author}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                              {book.category}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`font-bold ${
                                book.availableQuantity > 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {book.availableQuantity}
                            </span>
                            <span className="text-slate-500"> / {book.quantity}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => onToggleFeatured(book)}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                book.isFeatured
                                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                  : 'text-slate-600 border-transparent hover:text-amber-400'
                              }`}
                            >
                              <Star className={`w-4 h-4 ${book.isFeatured ? 'fill-current' : ''}`} />
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleEditClick(book)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteBook(book)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: ADD / EDIT BOOK                                   */}
          {/* ======================================================== */}
          {activeTab === 'add' && (
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-5">
              {editingBookId && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs">
                  <span>
                    Currently editing: <strong>{formData.title}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="underline hover:no-underline font-semibold cursor-pointer"
                  >
                    Cancel Editing
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Book Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Clean Architecture"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Author */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Author Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Robert C. Martin"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {PRESET_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="Custom">+ Other (Write custom)</option>
                  </select>
                </div>

                {formData.category === 'Custom' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Custom Category Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Artificial Intelligence"
                      value={formData.customCategory}
                      onChange={(e) =>
                        setFormData({ ...formData, customCategory: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Total Copies (Quantity)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => {
                      const q = Number(e.target.value);
                      setFormData({
                        ...formData,
                        quantity: q,
                        availableQuantity: editingBookId ? formData.availableQuantity : q,
                      });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Available Quantity */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Available Copies
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={formData.quantity}
                    required
                    value={formData.availableQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, availableQuantity: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Cover Image URL */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Cover Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.coverImage}
                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Short Description / Summary
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Key highlights or overview of this book..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                {/* Featured Checkbox */}
                <div className="sm:col-span-2 flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-750">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700 cursor-pointer"
                  />
                  <label htmlFor="isFeatured" className="text-xs font-medium text-slate-300 cursor-pointer">
                    Feature on Homepage (Trending / Top Recommendation)
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                {editingBookId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving to database...</span>
                    </>
                  ) : (
                    <span>{editingBookId ? 'Save Updates' : 'Add Book to Database'}</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB 5: ANALYTICS                                         */}
          {/* ======================================================== */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-850">
                  <p className="text-xs text-slate-400">Total Book Titles</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {stats?.totalTitles ?? books.length}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-850">
                  <p className="text-xs text-slate-400">Total Copies in DB</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats?.totalBooks ?? 0}</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-850">
                  <p className="text-xs text-slate-400">Pending Requests</p>
                  <p className="text-2xl font-bold text-amber-400 mt-1">
                    {pendingRequests.length}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-850">
                  <p className="text-xs text-slate-400">Active Borrowed</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">
                    {activeCirculation.length}
                  </p>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-850">
                <h4 className="font-bold text-sm text-white mb-4">Books by Category</h4>
                <div className="space-y-3">
                  {stats?.categoryCounts &&
                    Object.entries(stats.categoryCounts).map(([cat, count]) => {
                      const total = stats?.totalTitles || books.length || 1;
                      const percent = Math.round((count / total) * 100);
                      return (
                        <div key={cat}>
                          <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                            <span>{cat}</span>
                            <span>
                              {count} titles ({percent}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Custom Reject Modal */}
        {rejectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                Decline Request
              </h3>
              <p className="text-sm text-slate-400 mb-6">
                Are you sure you want to decline this borrow request? You can optionally provide a reason.
              </p>
              
              <div className="mb-6">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  Reason for declining (optional)
                </label>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="e.g., Book is currently damaged or unavailable..."
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/50 resize-none h-24"
                />
              </div>
              
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setRejectModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReject}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-900/20 transition-colors cursor-pointer"
                >
                  Confirm Decline
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
