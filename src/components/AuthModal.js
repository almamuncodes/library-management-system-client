'use client';

import React, { useState } from 'react';
import { X, UserPlus, LogIn, Phone, Mail, Lock, User, AlertCircle, CheckCircle2, Loader2, Sparkles, Shield } from 'lucide-react';
import { signIn, signUp } from '../lib/auth-client';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialMode = 'signup' }) {
  const [mode, setMode] = useState(initialMode); // 'signup' | 'signin'

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isAdminCheckbox, setIsAdminCheckbox] = useState(false);
  const [adminSecret, setAdminSecret] = useState('');

  // States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhoneNumber('');
    setPassword('');
    setConfirmPassword('');
    setIsAdminCheckbox(false);
    setAdminSecret('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) throw new Error('Student full name is required');
        if (!email.trim()) throw new Error('Valid Gmail or Email is required');
        if (!phoneNumber.trim()) throw new Error('Phone number is strictly required for student verification');
        if (password.length < 6) throw new Error('Password must be at least 6 characters long');
        if (password !== confirmPassword) throw new Error('Passwords do not match');

        let assignedRole = 'student';
        if (isAdminCheckbox) {
          if (adminSecret.trim() !== 'admin123') {
            throw new Error('Invalid Admin Secret Passkey. Leave unchecked if you are a student.');
          }
          assignedRole = 'admin';
        }

        const { data, error } = await signUp.email({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim(),
          phoneNumber: phoneNumber.trim(),
          role: assignedRole,
        });

        if (error) {
          throw new Error(error.message || 'Failed to create account');
        }

        setSuccessMessage(
          assignedRole === 'admin'
            ? 'Admin account created successfully! Signing in...'
            : 'Student account created successfully! Signing in...'
        );
        setTimeout(() => {
          handleClose();
          if (onAuthSuccess) onAuthSuccess(data);
        }, 1200);
      } else {
        // Sign In
        if (!email.trim()) throw new Error('Email is required');
        if (!password) throw new Error('Password is required');

        const { data, error } = await signIn.email({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) {
          throw new Error(error.message || 'Invalid email or password');
        }

        setSuccessMessage('Welcome back! Successfully logged in.');
        setTimeout(() => {
          handleClose();
          if (onAuthSuccess) onAuthSuccess(data);
        }, 1000);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 fill-current" />
            <span>Library Portal</span>
          </div>

          <h2 className="text-xl font-bold tracking-tight">
            {mode === 'signup' ? 'Create Student Account' : 'Library Sign In'}
          </h2>
          <p className="text-xs text-indigo-100 mt-1">
            {mode === 'signup'
              ? 'Register with your Gmail and Phone Number to borrow books'
              : 'Sign in to access your borrowed books and library features'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage('');
            }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'signup'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Student Register</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMessage('');
            }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'signin'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Messages */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Name Field (Sign Up only) */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Abdullah Al Mamun"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Gmail / Email */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Gmail / Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="email"
                required
                placeholder="e.g. student@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Phone Number (Sign Up only) */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="tel"
                  required
                  placeholder="e.g. 01712345678 or +880..."
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Confirm Password (Sign Up only) */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Optional Admin Registration Checkbox (Sign Up only) */}
          {mode === 'signup' && (
            <div className="pt-1">
              <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Register as Admin?
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isAdminCheckbox}
                  onChange={(e) => setIsAdminCheckbox(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {isAdminCheckbox && (
                <div className="mt-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-200 mb-1">
                    Enter Admin Secret Key (Passcode: admin123)
                  </label>
                  <input
                    type="password"
                    placeholder="Admin secret passcode"
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1">
                    Only authorized librarians should enter this code.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-sm shadow-md shadow-indigo-500/25 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : mode === 'signup' ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>{isAdminCheckbox ? 'Register Admin Account' : 'Register Student Account'}</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In to Library</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500">
          {mode === 'signup' ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Sign In here
              </button>
            </p>
          ) : (
            <p>
              New student?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Create student account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
