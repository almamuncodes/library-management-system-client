'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '../components/Navbar';
import StatsCards from '../components/StatsCards';
import BookCard from '../components/BookCard';
import MyBooksModal from '../components/MyBooksModal';
import AdminPanel from '../components/AdminPanel';
import AuthModal from '../components/AuthModal';
import BorrowRequestModal from '../components/BorrowRequestModal';
import { api } from '../lib/api';
import { useSession, signOut } from '../lib/auth-client';
import {
  Search,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Compass,
  UserPlus,
  X,
} from 'lucide-react';

export default function Home() {
  // Better Auth Session
  const { data: session, isPending: sessionLoading } = useSession();

  const [books, setBooks] = useState([]);
  const [borrows, setBorrows] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);


  // Modal States
  const [myBooksOpen, setMyBooksOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [bookToEdit, setBookToEdit] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [borrowModalBook, setBorrowModalBook] = useState(null);
  const [currentView, setCurrentView] = useState('explore');

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, currentView]);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Check if current user is an Admin
  const isAdmin = session?.user?.role === 'admin';
  const currentUserId = session?.user?.id || 'guest_user';

  // Load Data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [booksRes, borrowsRes, statsRes] = await Promise.all([
        api.getBooks(),
        api.getUserBorrows(currentUserId),
        api.getStats(),
      ]);

      if (booksRes.success) setBooks(booksRes.data || []);
      if (borrowsRes.success) setBorrows(borrowsRes.data || []);
      if (statsRes.success) setStats(statsRes.data || null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Backend server not responding. Please make sure the server is running!');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchData();
  }, [fetchData, session]);

  // Categories
  const categories = useMemo(() => {
    const set = new Set(['All']);
    books.forEach((b) => {
      if (b.category) set.add(b.category);
    });
    return Array.from(set);
  }, [books]);

  // Filtered Books
  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory = selectedCategory === 'All' || b.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [books, searchQuery, selectedCategory]);

  // Paginated Books (12 per page)
  const paginatedBooks = useMemo(() => {
    const startIndex = (currentPage - 1) * 12;
    return filteredBooks.slice(startIndex, startIndex + 12);
  }, [filteredBooks, currentPage]);

  // Real-time calculated stats from MongoDB Books data
  const realStats = useMemo(() => {
    const totalBooks = books.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
    const availableBooks = books.reduce((sum, b) => sum + (Number(b.availableQuantity) || 0), 0);
    
    return {
      ...(stats || {}), // Fallback to backend stats for user count etc
      totalBooks,
      totalTitles: books.length,
      availableBooks,
      borrowedBooks: totalBooks - availableBooks,
    };
  }, [books, stats]);

  // Featured Books
  const featuredBooks = useMemo(() => {
    return books.filter((b) => b.isFeatured === true || b.featured === true);
  }, [books]);

  // Active Borrowed IDs for current user (books currently in hand)
  const activeBorrowedBookIds = useMemo(() => {
    const set = new Set();
    borrows.forEach((br) => {
      if (br.status === 'borrowed') {
        const id = br.bookId?._id || br.bookId || br.book?._id;
        if (id) set.add(String(id));
      }
    });
    return set;
  }, [borrows]);

  // Pending Borrow Request IDs for current user (awaiting admin approval)
  const pendingBookIds = useMemo(() => {
    const set = new Set();
    borrows.forEach((br) => {
      if (br.status === 'pending') {
        const id = br.bookId?._id || br.bookId || br.book?._id;
        if (id) set.add(String(id));
      }
    });
    return set;
  }, [borrows]);

  const activeBorrowedCount = activeBorrowedBookIds.size;

  // Handlers
  const handleBorrow = (book) => {
    if (!session?.user) {
      showToast('Please register or sign in as a student to borrow books!', 'error');
      setAuthModalOpen(true);
      return;
    }
    setBorrowModalBook(book);
  };

  const handleReturn = async (borrow) => {
    try {
      const res = await api.requestReturn(borrow._id);
      showToast(
        res.message || 'Return request sent to librarian! They will verify and accept the book.',
        'success'
      );
      await fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to submit return request', 'error');
    }
  };

  const handleAddBook = async (bookData) => {
    if (!isAdmin) {
      showToast('Only administrators can add books!', 'error');
      return;
    }
    await api.createBook(bookData);
    showToast('New book saved successfully!', 'success');
    await fetchData();
  };

  const handleUpdateBook = async (id, bookData) => {
    if (!isAdmin) {
      showToast('Only administrators can edit books!', 'error');
      return;
    }
    await api.updateBook(id, bookData);
    showToast('Book details updated in database!', 'success');
    await fetchData();
  };

  const handleDeleteBook = async (book) => {
    if (!isAdmin) {
      showToast('Only administrators can delete books!', 'error');
      return;
    }
    if (confirm(`Are you sure you want to delete "${book.title}" from database?`)) {
      try {
        await api.deleteBook(book._id);
        showToast(`Deleted "${book.title}" from database`, 'success');
        await fetchData();
      } catch (err) {
        showToast(err.message || 'Failed to delete book', 'error');
      }
    }
  };

  const handleToggleFeatured = async (book) => {
    if (!isAdmin) {
      showToast('Only administrators can feature books!', 'error');
      return;
    }
    try {
      await api.updateBook(book._id, { isFeatured: !book.isFeatured });
      showToast(
        book.isFeatured
          ? `Removed "${book.title}" from featured`
          : `Marked "${book.title}" as featured in database!`,
        'success'
      );
      await fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to toggle featured status', 'error');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setAdminOpen(false);
    showToast('Signed out successfully', 'success');
  };

  if (isAdmin && adminOpen) {
    return (
      <AdminPanel
        isOpen={adminOpen}
        onClose={() => {
          setAdminOpen(false);
          setBookToEdit(null);
        }}
        books={books}
        stats={stats}
        initialBookToEdit={bookToEdit}
        onAddBook={handleAddBook}
        onUpdateBook={handleUpdateBook}
        onDeleteBook={handleDeleteBook}
        onToggleFeatured={handleToggleFeatured}
        onDataRefresh={fetchData}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors selection:bg-indigo-500 selection:text-white">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-800'
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Navbar with role-based Admin visibility */}
      <Navbar
        activeBorrowedCount={activeBorrowedCount}
        onOpenMyBooks={() => setMyBooksOpen(true)}
        onOpenAdmin={() => {
          if (isAdmin) setAdminOpen(true);
        }}
        currentView={currentView}
        setCurrentView={setCurrentView}
        session={session}
        onOpenAuth={() => setAuthModalOpen(true)}
        onSignOut={handleSignOut}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Error Notice */}
        {error && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-200 dark:bg-amber-900 text-xs font-bold hover:bg-amber-300 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {/* HERO SECTION */}
        {currentView === 'explore' && (
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-zinc-950 text-white p-8 sm:p-12 lg:p-16 shadow-2xl border border-indigo-800/40">
          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-current" />
              <span>
                {isAdmin ? 'Library Administrator Portal' : 'your.lib • Student Library'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
              Read, Borrow & <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-indigo-300">Empower</span> Your Knowledge
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 max-w-2xl leading-relaxed">
              Explore our extensive library collection. Registered students can borrow copies instantly with verified phone credentials.
            </p>

            {/* Quick Hero Search Input & Auth Status */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3 max-w-xl">
              {!session?.user ? (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-bold text-sm shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Student Sign Up</span>
                </button>
              ) : (
                <button
                  onClick={() => setMyBooksOpen(true)}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>My Books</span>
                  {activeBorrowedCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-white text-indigo-700 text-xs flex items-center justify-center font-bold">
                      {activeBorrowedCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Decorative Glow */}
          <div className="absolute -right-16 -bottom-16 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-1/4 top-0 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        </section>
        )}

        {/* STATS SECTION */}
        {isAdmin && currentView === 'explore' && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <span>Database Live Statistics</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </h2>
                <p className="text-xs text-zinc-500">Real-time counts calculated directly from the database</p>
              </div>
              <button
                onClick={fetchData}
                title="Refresh Stats"
                className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <StatsCards stats={realStats} />
          </section>
        )}

        {/* ALL BOOKS CATALOG SECTION */}
        <section id="catalog" className="space-y-6 pt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  {currentView === 'explore' ? 'Featured & New Books' : 'Explore All Books'}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {currentView === 'explore' 
                    ? `Showing ${Math.min(4, books.length)} of ${books.length} books`
                    : `Showing ${filteredBooks.length} of ${books.length} books`
                  }
                </p>
              </div>
            </div>

            {/* Catalog Search Bar - ONLY IN ALL BOOKS VIEW */}
            {currentView === 'all-books' && (
              <div className="relative group w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search catalog..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-zinc-100 transition-all placeholder:text-zinc-500 shadow-sm"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Category Filter Pills - ONLY IN ALL BOOKS VIEW */}
          {currentView === 'all-books' && (
            <div className="flex flex-col border-b border-zinc-200 dark:border-zinc-800 pb-5">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      selectedCategory.toLowerCase() === cat.toLowerCase()
                        ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-500/25'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
              <p className="text-sm font-medium text-zinc-500">Loading books...</p>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="py-16 text-center rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-base text-zinc-800 dark:text-zinc-200">No books found</h3>
              <p className="text-xs text-zinc-500 max-w-sm mt-1">
                {books.length === 0
                  ? isAdmin
                    ? 'Your database is currently empty. Click "Admin Panel" to add books!'
                    : 'Library is currently empty. Please check back later!'
                  : 'Try searching with another keyword or select "All" from the category filter.'}
              </p>
              {books.length === 0 && isAdmin ? (
                <button
                  onClick={() => setAdminOpen(true)}
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white shadow-xs cursor-pointer"
                >
                  Add First Book
                </button>
              ) : (
                (searchQuery || selectedCategory !== 'All') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                    }}
                    className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {(currentView === 'explore' ? books.slice(0, 4) : paginatedBooks).map((book) => (
                  <BookCard
                    key={book._id}
                    book={book}
                    isBorrowedByMe={activeBorrowedBookIds.has(String(book._id))}
                    hasPendingRequest={pendingBookIds.has(String(book._id))}
                    onBorrow={handleBorrow}
                    isAdmin={isAdmin}
                    onEdit={(book) => {
                      setBookToEdit(book);
                      setAdminOpen(true);
                    }}
                    onDelete={handleDeleteBook}
                    onToggleFeatured={handleToggleFeatured}
                  />
                ))}
              </div>
              
              {/* Pagination Controls - ONLY IN ALL BOOKS VIEW */}
              {currentView === 'all-books' && filteredBooks.length > 12 && (
                <div className="flex items-center justify-center gap-4 mt-10">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="text-sm font-medium text-zinc-500">
                    Page {currentPage} of {Math.ceil(filteredBooks.length / 12)}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredBooks.length / 12), p + 1))}
                    disabled={currentPage === Math.ceil(filteredBooks.length / 12)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Explore All Button for Home View */}
              {currentView === 'explore' && books.length > 4 && (
                <div className="flex justify-center mt-10">
                  <button
                    onClick={() => setCurrentView('all-books')}
                    className="px-6 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 font-bold text-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <span>Explore All Books</span>
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {currentView === 'explore' && (
          <>
            {/* 1. Why Reading Matters */}
            <section className="py-20 bg-zinc-50 dark:bg-zinc-900/50 mt-10">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                    A Good Book Can Change the Way You Think.
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Cards */}
                  <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 hover:-translate-y-1 transition-transform">
                    <div className="text-3xl mb-4">🧠</div>
                    <h3 className="font-bold text-zinc-900 dark:text-white mb-2 text-lg">Improves Knowledge</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">নতুন কিছু শেখা ও জানার সুযোগ।</p>
                  </div>
                  <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 hover:-translate-y-1 transition-transform">
                    <div className="text-3xl mb-4">🎯</div>
                    <h3 className="font-bold text-zinc-900 dark:text-white mb-2 text-lg">Boosts Focus</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">দীর্ঘসময় মনোযোগ ধরে রাখতে সাহায্য করে।</p>
                  </div>
                  <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 hover:-translate-y-1 transition-transform">
                    <div className="text-3xl mb-4">💡</div>
                    <h3 className="font-bold text-zinc-900 dark:text-white mb-2 text-lg">Inspires Creativity</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">নতুন ideas ও imagination তৈরি করে।</p>
                  </div>
                  <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 hover:-translate-y-1 transition-transform">
                    <div className="text-3xl mb-4">🌱</div>
                    <h3 className="font-bold text-zinc-900 dark:text-white mb-2 text-lg">Builds Better Habits</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">নিয়মিত পড়ার অভ্যাস গড়ে তোলে।</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Quote Section */}
            <section className="relative py-24 bg-zinc-950 overflow-hidden flex items-center justify-center">
              {/* Subtle background overlay */}
              <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&auto=format&fit=crop&q=60')] bg-cover bg-center bg-no-repeat" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/50 to-zinc-950" />
              
              <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
                <blockquote className="text-3xl sm:text-4xl lg:text-5xl font-serif italic font-medium text-white leading-tight mb-8 drop-shadow-lg">
                  "A reader lives a thousand lives before he dies."
                </blockquote>
                <p className="text-lg text-amber-500 font-semibold tracking-wide">
                  — George R. R. Martin
                </p>
              </div>
            </section>

            {/* 3. Reading Inspiration Section */}
            <section className="py-24 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
              <div className="max-w-3xl mx-auto px-4 text-center">
                <h2 className="text-3xl sm:text-5xl font-extrabold text-zinc-900 dark:text-white mb-8 tracking-tight">
                  There's a Book for Every You.
                </h2>
                
                <div className="space-y-3 text-lg text-zinc-600 dark:text-zinc-300 font-medium mb-10">
                  <p>Want to learn something new?</p>
                  <p>Looking for an escape?</p>
                  <p>Searching for inspiration?</p>
                  <p className="text-indigo-600 dark:text-indigo-400 font-bold mt-6 text-xl">
                    Your next great story is waiting.
                  </p>
                </div>
                
                <button
                  onClick={() => {
                    setCurrentView('all-books');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg transition-all shadow-lg shadow-indigo-600/30 hover:scale-105 cursor-pointer"
                >
                  Explore Books <span>&rarr;</span>
                </button>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 mt-20 py-8 bg-white dark:bg-zinc-950 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <p className="font-bold text-zinc-900 dark:text-zinc-100">your.lib Library Management</p>
            <p className="text-zinc-400 mt-0.5">Role-Based Student & Admin Architecture with Better Auth</p>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <button
                onClick={() => setAdminOpen(true)}
                className="hover:text-amber-500 font-semibold transition-colors cursor-pointer text-amber-600 dark:text-amber-400"
              >
                Admin Panel
              </button>
            )}
            <button
              onClick={() => setMyBooksOpen(true)}
              className="hover:text-indigo-600 font-medium transition-colors cursor-pointer"
            >
              My Borrowed Books
            </button>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={() => {
          showToast('Authentication successful!');
          fetchData();
        }}
      />

      {/* User Dashboard: My Books Modal */}
      <MyBooksModal
        isOpen={myBooksOpen}
        onClose={() => setMyBooksOpen(false)}
        borrows={borrows}
        onReturnBook={handleReturn}
        onExploreClick={() => {
          const el = document.getElementById('catalog');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Borrow Request Modal with Duration Picker */}
      {borrowModalBook && (
        <BorrowRequestModal
          book={borrowModalBook}
          user={session?.user}
          onClose={() => setBorrowModalBook(null)}
          onSuccess={() => {
            fetchData();
            showToast('Borrow request submitted to librarian!', 'success');
          }}
        />
      )}

    </div>
  );
}
