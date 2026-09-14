'use client';

import React, { useState } from 'react';
import { Star, CheckCircle2, AlertCircle, BookOpen, Loader2, Sparkles, Edit3, Trash2, Hourglass } from 'lucide-react';

const categoryColorMap = {
  Programming: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  Science: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  Novel: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  History: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
  Philosophy: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
};

export default function BookCard({
  book,
  isBorrowedByMe = false,
  hasPendingRequest = false,
  onBorrow,
  isAdmin = false,
  onEdit,
  onDelete,
  onToggleFeatured,
}) {
  const [loading, setLoading] = useState(false);

  const isOutOfStock = book.availableQuantity <= 0;
  const categoryBadgeClass =
    categoryColorMap[book.category] ||
    'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';

  const handleBorrowClick = async () => {
    if (loading || isOutOfStock || isBorrowedByMe || hasPendingRequest) return;
    setLoading(true);
    try {
      await onBorrow(book);
    } finally {
      setLoading(false);
    }
  };

  const defaultCover = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60';

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Top Cover */}
      <div className="relative h-52 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <img
          src={book.coverImageUrl || book.coverImage || defaultCover}
          alt={book.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = defaultCover;
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Badges on Cover */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-md shadow-xs ${categoryBadgeClass}`}>
            {book.category}
          </span>
        </div>

        {(book.isFeatured || book.featured) && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-zinc-950 shadow-md backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Featured</span>
          </div>
        )}

        {/* Availability Bar on Bottom of Cover */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
          <div className="flex items-center gap-1.5 font-medium">
            {isOutOfStock ? (
              <span className="flex items-center gap-1 text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded-md border border-rose-800/80 backdrop-blur-xs">
                <AlertCircle className="w-3.5 h-3.5" /> Out of stock
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800/80 backdrop-blur-xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> {book.availableQuantity} of {book.quantity} available
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Book Content */}
      <div className="flex flex-col flex-1 p-5 justify-between">
        <div>
          <h3 className="font-bold text-base sm:text-lg text-zinc-900 dark:text-zinc-50 line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {book.title}
          </h3>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">
            by <span className="text-zinc-700 dark:text-zinc-300">{book.author}</span>
          </p>

          {book.description && (
            <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mt-2 leading-relaxed">
              {book.description}
            </p>
          )}
        </div>

        {/* Stock Progress Line */}
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
            <span>Database Stock</span>
            <span>{Math.round(((book.availableQuantity || 0) / (book.quantity || 1)) * 100)}% Available</span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isOutOfStock
                  ? 'bg-rose-500'
                  : book.availableQuantity === 1
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{
                width: `${Math.min(100, Math.max(0, ((book.availableQuantity || 0) / (book.quantity || 1)) * 100))}%`,
              }}
            />
          </div>

          {/* Action Button */}
          <div className="mt-4 flex items-center gap-2">
            {!isAdmin && (
              <button
                onClick={handleBorrowClick}
                disabled={isOutOfStock || isBorrowedByMe || hasPendingRequest || loading}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all shadow-xs ${
                  hasPendingRequest
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 cursor-not-allowed'
                    : isBorrowedByMe
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-not-allowed'
                    : isOutOfStock
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-200 dark:border-zinc-700'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white shadow-indigo-500/25 shadow-md hover:shadow-indigo-500/40 cursor-pointer'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Requesting...</span>
                  </>
                ) : hasPendingRequest ? (
                  <>
                    <Hourglass className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>Pending Approval</span>
                  </>
                ) : isBorrowedByMe ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Book in Hand</span>
                  </>
                ) : isOutOfStock ? (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    <span>Out of Stock</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4" />
                    <span>Borrow Book</span>
                  </>
                )}
              </button>
            )}

            {/* Admin Quick Actions */}
            {isAdmin && (
              <div className="flex items-center gap-1">

                <button
                  onClick={() => onEdit && onEdit(book)}
                  title="Edit Book"
                  className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete && onDelete(book)}
                  title="Delete Book"
                  className="p-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
