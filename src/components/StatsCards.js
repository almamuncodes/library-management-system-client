'use client';

import React from 'react';
import { BookOpen, CheckCircle2, BookmarkCheck, Users } from 'lucide-react';

export default function StatsCards({ stats }) {
  const cards = [
    {
      title: 'Total Books in Stock',
      value: stats?.totalBooks ?? 0,
      subValue: `${stats?.totalTitles ?? 0} unique titles`,
      icon: BookOpen,
      gradient: 'from-blue-500 to-indigo-600',
      bgGlow: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900',
    },
    {
      title: 'Available for Borrowing',
      value: stats?.availableBooks ?? 0,
      subValue: 'Ready to read',
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-teal-600',
      bgGlow: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
    },
    {
      title: 'Currently Borrowed',
      value: stats?.borrowedBooks ?? 0,
      subValue: `${stats?.totalReturns ?? 0} historical returns`,
      icon: BookmarkCheck,
      gradient: 'from-amber-500 to-orange-600',
      bgGlow: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900',
    },
    {
      title: 'Active Readers',
      value: stats?.totalMembers ?? 0,
      subValue: 'Library users',
      icon: Users,
      gradient: 'from-purple-500 to-pink-600',
      bgGlow: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900',
    },
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    {card.title}
                  </p>
                  <h3 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mt-1">
                    {card.value}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                    {card.subValue}
                  </p>
                </div>
                <div className={`p-3 rounded-xl border ${card.bgGlow} transition-transform group-hover:scale-110`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${card.gradient}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
