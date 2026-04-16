'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useLocale } from '@/lib/locale-context';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { locale, setLocale } = useLocale();
  const pathname = usePathname();
  const isEn = locale === 'en';
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = user ? [
    { href: '/dashboard', label: isEn ? 'Home' : '首頁', d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { href: '/videos', label: isEn ? 'Videos' : '影片', d: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
    { href: '/sessions', label: isEn ? 'Cases' : '案例', d: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { href: '/knowledge', label: isEn ? 'Knowledge' : '知識庫', d: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { href: '/search', label: isEn ? 'Search' : '搜尋', d: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  ] : [];

  if (user?.role === 'surgeon') {
    navItems.push({ href: '/terminology', label: isEn ? 'Glossary' : '術語', d: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129' });
  }

  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  const NavLink = ({ item }: { item: typeof navItems[0] }) => (
    <Link href={item.href} onClick={() => setMobileOpen(false)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
        isActive(item.href) ? 'text-cyan-300' : 'text-slate-500 hover:text-slate-300'
      }`}
      style={isActive(item.href) ? { background: 'rgba(6,182,212,0.08)', boxShadow: 'inset 0 0 0 1px rgba(6,182,212,0.15)' } : {}}>
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d={item.d} />
      </svg>
      <span>{item.label}</span>
    </Link>
  );

  return (
    <>
      <nav className="glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center gap-1">
              <Link href="/" className="flex items-center gap-2.5 mr-4 lg:mr-6 group">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center relative" style={{ background: 'linear-gradient(135deg, var(--cyan) 0%, var(--blue) 100%)' }}>
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="font-bold text-base tracking-tight text-slate-100">Surg<span style={{ color: 'var(--cyan-bright)' }}>AI</span></span>
              </Link>

              {/* Desktop Nav */}
              <div className="hidden lg:flex items-center gap-0.5">
                {navItems.map(item => <NavLink key={item.href} item={item} />)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {user && (
                <Link href="/videos/upload" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 btn-primary text-[13px] rounded-lg">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  {isEn ? 'Upload' : '上傳'}
                </Link>
              )}

              <Link href="/guide" className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-cyan-400 transition" style={{ border: '1px solid var(--border)' }} title={isEn ? 'User Guide' : '操作手冊'}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Link>

              <button onClick={() => setLocale(isEn ? 'zh-TW' : 'en')}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium text-slate-500 hover:text-slate-300 transition"
                style={{ border: '1px solid var(--border)' }}>
                {isEn ? '中' : 'En'}
              </button>

              {user ? (
                <div className="hidden sm:flex items-center gap-2 ml-1">
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(148,163,184,0.06)', border: '1px solid var(--border)' }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, var(--cyan) 0%, var(--violet) 100%)' }}>
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-300 leading-none">{user.name}</p>
                      <p className="text-[10px] leading-tight mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {user.role === 'surgeon' ? (isEn ? 'Surgeon' : '主刀醫師') : (isEn ? 'Trainee' : '學員')}
                      </p>
                    </div>
                  </div>
                  <button onClick={logout} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-rose-400 transition" style={{ border: '1px solid var(--border)' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link href="/login" className="text-[13px] font-medium text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg transition">{isEn ? 'Log In' : '登入'}</Link>
                  <Link href="/register" className="text-[13px] btn-primary px-4 py-1.5 rounded-lg">{isEn ? 'Sign Up' : '註冊'}</Link>
                </div>
              )}

              {/* Mobile hamburger */}
              <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200" style={{ border: '1px solid var(--border)' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {mobileOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  }
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div className="neon-line" />
      </nav>

      {/* Mobile slide-out menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 p-6 flex flex-col gap-2 animate-fade-in" style={{ background: 'var(--bg-elevated)', borderLeft: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-slate-200">SurgAI</span>
              <button onClick={() => setMobileOpen(false)} className="text-slate-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {navItems.map(item => <NavLink key={item.href} item={item} />)}
            <div className="neon-line my-3" />
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg, var(--cyan), var(--violet))' }}>
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{user.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{user.role === 'surgeon' ? '主刀醫師' : '學員'}</p>
                  </div>
                </div>
                <Link href="/videos/upload" onClick={() => setMobileOpen(false)} className="btn-primary px-3 py-2 rounded-lg text-sm text-center">
                  {isEn ? 'Upload Video' : '上傳影片'}
                </Link>
                <button onClick={() => { logout(); setMobileOpen(false); }} className="text-left px-3 py-2 text-sm text-rose-400 hover:text-rose-300 transition">
                  {isEn ? 'Log Out' : '登出'}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)} className="px-3 py-2 text-sm text-slate-300">{isEn ? 'Log In' : '登入'}</Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="btn-primary px-3 py-2 rounded-lg text-sm text-center">{isEn ? 'Sign Up' : '註冊'}</Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
