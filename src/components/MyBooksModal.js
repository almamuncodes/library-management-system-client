'use client';

import React, { useState } from 'react';
import {
  X,
  BookmarkCheck,
  RotateCcw,
  Clock,
  CheckCircle2,
  BookOpen,
  Loader2,
  AlertTriangle,
  Hourglass,
  Calendar,
  XCircle,
} from 'lucide-react';

export default function MyBooksModal({
  isOpen,
  onClose,
  borrows = [],
  onReturnBook,
  onExploreClick,
}) {
  const [activeTab, setActiveTab] = useState('in_hand'); // 'in_hand' | 'pending' | 'history'
  const [returningId, setReturningId] = useState(null);

  if (!isOpen) return null;

  const inHandBorrows = borrows.filter(
    (b) => b.status === 'borrowed' || b.status === 'return_pending'
  );
  const pendingBorrows = borrows.filter((b) => b.status === 'pending');
  const historyBorrows = borrows.filter((b) => b.status === 'returned' || b.status === 'rejected');

  const handleReturn = async (borrow) => {
    setReturningId(borrow._id);
    try {
      await onReturnBook(borrow);
    } finally {
      setReturningId(null);
    }
  };

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

  // Calculate days remaining or overdue
  const getDueStatus = (dueDateStr) => {
    if (!dueDateStr) return null;
    const now = new Date();
    const due = new Date(dueDateStr);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        isOverdue: true,
        text: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}!`,
        badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      };
    } else if (diffDays === 0) {
      return {
        isOverdue: false,
        text: 'Due Today!',
        badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30 font-bold',
      };
    } else if (diffDays <= 3) {
      return {
        isOverdue: false,
        text: `${diffDays} days left (Due Soon)`,
        badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      };
    } else {
      return {
        isOverdue: false,
        text: `${diffDays} days left`,
        badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 flex flex-col max-h-[88vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <BookmarkCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">My Library Activity</h2>
              <p className="text-xs text-slate-400">
                Track currently held books, pending librarian approvals & borrowing history
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Tabs */}
        <div className="flex border-b border-slate-800 px-6 pt-3 gap-3 bg-slate-900/60">
          <button
            onClick={() => setActiveTab('in_hand')}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'in_hand'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Books In Hand</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                inHandBorrows.length > 0
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {inHandBorrows.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Pending Requests</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                pendingBorrows.length > 0
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {pendingBorrows.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>History</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-400">
              {historyBorrows.length}
            </span>
          </button>
        </div>

        {/* Tab Content List */}
        <div className="flex-1 overflow-y-auto p-6 divide-y divide-slate-800/80">
          {/* TAB 1: BOOKS IN HAND */}
          {activeTab === 'in_hand' && (
            <>
              {inHandBorrows.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mb-3">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-semibold text-white">No Books In Hand</h4>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    You currently have no borrowed books. Choose any book from our collection and submit a borrow request.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      if (onExploreClick) onExploreClick();
                    }}
                    className="mt-5 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    Browse Catalog
                  </button>
                </div>
              ) : (
                inHandBorrows.map((borrow) => {
                  const book = borrow.bookId || {};
                  const isReturning = returningId === borrow._id;
                  const dueInfo = getDueStatus(borrow.dueDate);

                  return (
                    <div
                      key={borrow._id}
                      className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={
                            book.coverImage ||
                            'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60'
                          }
                          alt={book.title || 'Book cover'}
                          className="w-16 h-22 object-cover rounded-xl border border-slate-750 shadow-md shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                            {book.category || 'General'}
                          </span>
                          <h4 className="font-bold text-sm sm:text-base text-white mt-1 truncate">
                            {book.title || 'Unknown Title'}
                          </h4>
                          <p className="text-xs text-slate-400">By {book.author || 'N/A'}</p>

                          {/* Borrow & Due Info */}
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                            <span className="flex items-center gap-1 text-slate-400">
                              <Calendar className="w-3.5 h-3.5 text-slate-500" />
                              Issued: {formatDate(borrow.borrowDate)}
                            </span>
                            <span className="flex items-center gap-1 text-slate-400">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              Due: <strong className="text-slate-200">{formatDate(borrow.dueDate)}</strong>
                            </span>
                            {dueInfo && (
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border flex items-center gap-1 ${dueInfo.badgeClass}`}
                              >
                                {dueInfo.isOverdue && <AlertTriangle className="w-3 h-3" />}
                                {dueInfo.text}
                              </span>
                            )}
                            {borrow.status === 'return_pending' && (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border flex items-center gap-1 bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse">
                                <Hourglass className="w-3 h-3" />
                                Return Request Pending
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Return Action Button */}
                      {borrow.status === 'return_pending' ? (
                        <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                          <Hourglass className="w-3.5 h-3.5 animate-pulse" />
                          <span>Return Requested</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleReturn(borrow)}
                          disabled={isReturning}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95 transition-all shadow-md shrink-0 cursor-pointer disabled:opacity-50"
                        >
                          {isReturning ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Submitting...</span>
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-4 h-4" />
                              <span>Request Return</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* TAB 2: PENDING REQUESTS */}
          {activeTab === 'pending' && (
            <>
              {pendingBorrows.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mb-3">
                    <Hourglass className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-semibold text-white">No Pending Requests</h4>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    When you request a book to borrow, it will appear here awaiting approval from the librarian.
                  </p>
                </div>
              ) : (
                pendingBorrows.map((borrow) => {
                  const book = borrow.bookId || {};

                  return (
                    <div
                      key={borrow._id}
                      className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={
                            book.coverImage ||
                            'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60'
                          }
                          alt={book.title || 'Book cover'}
                          className="w-16 h-22 object-cover rounded-xl border border-slate-750 shadow-md shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                            Requested for {borrow.borrowDays || 14} Days
                          </span>
                          <h4 className="font-bold text-sm sm:text-base text-white mt-1 truncate">
                            {book.title || 'Unknown Title'}
                          </h4>
                          <p className="text-xs text-slate-400">By {book.author || 'N/A'}</p>

                          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>Submitted: {formatDate(borrow.requestDate || borrow.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                        <Hourglass className="w-3.5 h-3.5 animate-pulse" />
                        <span>Awaiting Librarian Approval</span>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* TAB 3: ACTIVITY HISTORY */}
          {activeTab === 'history' && (
            <>
              {historyBorrows.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mb-3">
                    <Clock className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-semibold text-white">No History Yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    Books that you have completed reading and returned, or past requests, will appear here.
                  </p>
                </div>
              ) : (
                historyBorrows.map((borrow) => {
                  const book = borrow.bookId || {};
                  const isReturned = borrow.status === 'returned';

                  return (
                    <div
                      key={borrow._id}
                      className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={
                            book.coverImage ||
                            'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60'
                          }
                          alt={book.title || 'Book cover'}
                          className="w-14 h-20 object-cover rounded-xl border border-slate-750 shadow-xs shrink-0 opacity-80"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-white truncate">
                            {book.title || 'Unknown Title'}
                          </h4>
                          <p className="text-xs text-slate-400">By {book.author || 'N/A'}</p>

                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
                            {borrow.borrowDate && (
                              <span>Borrowed: {formatDate(borrow.borrowDate)}</span>
                            )}
                            {isReturned && borrow.returnDate && (
                              <span className="text-emerald-400">
                                Returned: {formatDate(borrow.returnDate)}
                              </span>
                            )}
                            {!isReturned && borrow.adminNote && (
                              <span className="text-rose-400">Note: {borrow.adminNote}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isReturned ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Returned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <XCircle className="w-3.5 h-3.5" /> Declined
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-850 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {inHandBorrows.length} currently held &bull; {pendingBorrows.length} pending
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
