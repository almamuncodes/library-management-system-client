'use client';

import React from 'react';
import { BookOpen, BookmarkCheck, Shield, LogOut, Phone, LogIn, Search, X } from 'lucide-react';

export default function Navbar({
  activeBorrowedCount = 0,
  onOpenMyBooks,
  onOpenAdmin,
  currentView,
  setCurrentView,
  session,
  onOpenAuth,
  onSignOut,
  searchQuery,
  setSearchQuery,
}) {
  const user = session?.user;
  const isAdmin = user?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-zinc-950/90 border-b border-zinc-200/80 dark:border-zinc-800/80 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div
          onClick={() => {
            setCurrentView('explore');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-3 cursor-pointer group flex-1"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-50">
              <span>Your.Lib</span>
              
            </div>
            {isAdmin && (
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:block">
                Admin Management Mode
              </p>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center justify-center gap-1">
          <button
            onClick={() => setCurrentView?.('explore')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
              currentView === 'explore'
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setCurrentView?.('all-books')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
              currentView === 'all-books'
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
            }`}
          >
            All Books
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end">
          {/* My Books (Visible to Students only) */}
          {!isAdmin && (
            <button
              onClick={onOpenMyBooks}
              className="relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 transition-all shadow-xs cursor-pointer"
            >
              <BookmarkCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>My Books</span>
              {activeBorrowedCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-indigo-600 rounded-full animate-pulse">
                  {activeBorrowedCount}
                </span>
              )}
            </button>
          )}

          {/* Admin Panel Button - STRICTLY ONLY VISIBLE TO USERS WITH ROLE === 'admin' */}
          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-zinc-950 shadow-sm shadow-amber-500/20 transition-all cursor-pointer animate-in fade-in"
            >
              <Shield className="w-4 h-4 text-zinc-950" />
              <span>Admin Panel</span>
            </button>
          )}

          {/* Student/User Profile or Login Button */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2 p-1 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 pr-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-xs text-white ${
                  isAdmin ? 'bg-amber-500 text-zinc-950' : 'bg-indigo-600'
                }`}>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1 max-w-[120px]">
                      {user.name}
                    </p>
                    {isAdmin && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                    <Phone className="w-2.5 h-2.5 text-emerald-500" />
                    <span>{user.phoneNumber || user.email}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={onSignOut}
                title="Sign Out"
                className="p-2 rounded-xl text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/25 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Student Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
