import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoute } from '../App';
import {
  ArrowRight,
  Check,
  Shield,
  Rocket,
  Sparkles,
  Calendar,
  CreditCard,
  Lock,
  Mail,
  Phone,
} from 'lucide-react';
import confetti from 'canvas-confetti';

// ============================================
// DESIGN TOKENS — Cool silverish neutrals
// ============================================
const COLOR = {
  bg: '#f8fafc',
  surface: '#ffffff',
  panel: '#f1f5f9',
  border: '#cbd5e1',
  text: '#0f172a',
  muted: '#64748b',
  accent: '#3b82f6',
  accentHover: '#2563eb',
  success: '#10b981',
  danger: '#ef4444',
};

// ============================================
// LANDING PAGE
// ============================================

export const LandingPage: React.FC = () => {
  const { setRoute } = useRoute();
  const [scrolled, setScrolled] = useState(false);
  const [pricingTab, setPricingTab] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#10b981', '#94a3b8', '#ffffff'],
    });
  };

  const features = [
    {
      icon: <Rocket className="w-6 h-6" />,
      title: 'Instant Task Launch',
      desc: 'Create tasks in one tap. No forms, no friction. Just do it.',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Bank-Grade Security',
      desc: 'CSP headers, rate limiting, Zod validation, encrypted at rest.',
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'AI Hub Buddy',
      desc: 'Conversational AI that knows your tasks, slips, and budget.',
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: 'Consensus Voting',
      desc: 'Team decisions with quorum rules, objections, and auto-tasks.',
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: 'Proxy Payments',
      desc: 'Delegate spending with approval ceilings and audit trails.',
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: 'Offline First',
      desc: 'IndexedDB sync engine. Works without internet, syncs when back.',
    },
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: 0,
      interval: '/mo',
      description: 'For individuals getting started.',
      features: ['Up to 50 tasks', '5 receipt slips/month', 'Basic budget tracking', 'Community support'],
      cta: 'Get Started Free',
      popular: false,
      color: 'blue',
    },
    {
      name: 'Growth',
      price: 19,
      interval: '/mo',
      description: 'For growing teams and proxies.',
      features: ['Unlimited tasks', 'Unlimited slips', 'Consensus voting', 'Proxy delegation', 'Google Calendar sync', 'Priority email support'],
      cta: 'Start Free Trial',
      popular: true,
      color: 'emerald',
    },
    {
      name: 'Enterprise',
      price: 99,
      interval: '/mo',
      description: 'For organizations with compliance needs.',
      features: ['Everything in Growth', 'SSO / SAML', 'Audit logs', 'Custom domain', 'SLA guarantee', 'Dedicated onboarding'],
      cta: 'Contact Sales',
      popular: false,
      color: 'slate',
    },
  ];

  return (
    <div className="min-h-screen bg-amber-50 text-slate-900 font-sans selection:bg-blue-200 selection:text-black">
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-yellow-400 rounded-2xl flex items-center justify-center border-2 border-slate-900 shadow-[3px_3px_0px_rgba(0,0,0,0.2)]">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black text-slate-900 tracking-tight uppercase">Bridge</span>
            </div>

            <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-700">
              <a href="#features" className="hover:text-amber-700 transition">Features</a>
              <a href="#pricing" className="hover:text-amber-700 transition">Pricing</a>
              <a href="#how-it-works" className="hover:text-amber-700 transition">How it works</a>
            </div>

            <div className="flex items-center gap-3">
              <button className="text-sm font-bold text-slate-700 hover:text-amber-700 transition px-4 py-2 border border-slate-300 rounded-xl bg-white active:scale-95">
                Sign in
              </button>
              <button
                onClick={triggerConfetti}
                className="text-sm font-bold text-white bg-yellow-400 hover:bg-yellow-500 transition px-6 py-2.5 rounded-xl shadow-[3px_3px_0px_rgba(0,0,0,0.2)] border-2 border-slate-900 active:scale-95 flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                Start free
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 sm:pt-40 sm:pb-32 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-yellow-100/40 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 right-1/2 translate-x-1/2 w-[500px] h-[500px] bg-slate-200/30 rounded-full blur-[100px] -z-10" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-50 text-amber-800 font-bold text-sm border border-slate-200"
              >
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                New: Offline-first sync engine
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl sm:text-7xl font-black text-slate-900 leading-[1.05] tracking-tighter"
              >
                Run your life{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-slate-600">
                  like a hub
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg sm:text-xl text-slate-600 max-w-lg leading-relaxed"
              >
                Tasks, receipts, money, voting, and proxy delegation — all in one
                chunky, mobile-first hub. Built for teams that move fast and
                humans who hate forms.
              </motion.p>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => {
                    triggerConfetti();
                    setRoute('auth');
                  }}
                  className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg rounded-2xl shadow-[3px_3px_0px_rgba(0,0,0,0.3)] border-2 border-transparent active:translate-y-1 flex items-center gap-2 transition"
                >
                  <ArrowRight className="w-5 h-5" />
                  Get started free
                </button>
                <button
                  className="px-8 py-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-lg rounded-2xl shadow-[3px_3px_0px_rgba(0,0,0,0.2)] border-2 border-slate-300 active:scale-95 transition"
                >
                  <Mail className="w-5 h-5" />
                  Watch demo
                </button>
              </div>

              <div className="mt-8 flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <div className="w-px h-4 bg-slate-300" />
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  SOC 2 Type II
                </span>
                <span className="w-px h-4 bg-slate-300 mx-2" />
                <span>End-to-end encrypted</span>
                <span className="w-px h-4 bg-slate-300 mx-2" />
                <span>99.9% uptime SLA</span>
              </div>
            </div>

            <div className="relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="relative w-full max-w-md"
              >
                {/* Mock app preview card */}
                <div className="bg-white rounded-[32px] border-3 border-slate-900 shadow-[8px_8px_0px_rgba(0,0,0,0.2)] p-6 relative overflow-hidden">
                  <div className="absolute top-4 right-4 w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center border border-slate-200">
                    <Sparkles className="w-6 h-6 text-amber-700" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-slate-100 p-3 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold text-slate-600">Online</span>
                      </div>
                      <span className="text-xs font-bold text-amber-700">🚀 Hub Active</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-sm font-bold text-slate-700">Design the rocket</span>
                        <button className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-sm font-bold text-slate-700">Buy groceries</span>
                        <span className="text-xs font-bold text-slate-500">Due today</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm opacity-50">
                        <span className="text-sm font-bold text-slate-700 line-through">Sync with Google Calendar</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200" />
                      <div className="w-8 h-8 rounded-full bg-slate-100" />
                    </div>
                    <span className="text-xs font-bold text-slate-400">3 of 10 done</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">Everything you need</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Built for humans, designed for teams.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-3xl border-2 border-slate-200 bg-amber-50 hover:bg-white hover:shadow-xl hover:border-slate-300 transition-all group"
              >
                <div className="w-12 h-12 bg-yellow-100 text-amber-700 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-yellow-400 group-hover:text-slate-900 transition">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-amber-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">How it works</h2>
            <p className="text-lg text-slate-600">Three steps to hub happiness.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: '01', title: 'Create your hub', desc: 'Sign up, pick your currency, and invite your team or proxies.' },
              { num: '02', title: 'Add tasks & slips', desc: 'Snap receipts, create tasks, set budgets. Everything syncs instantly.' },
              { num: '03', title: 'Vote & decide', desc: 'Propose changes, vote with quorum rules, and auto-generate action items.' },
            ].map((step, idx) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="w-14 h-14 rounded-full bg-white border-3 border-slate-900 shadow-[3px_3px_0px_rgba(0,0,0,0.2)] flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-black text-slate-900">{step.num}</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">{step.title}</h3>
                <p className="text-sm text-slate-600 text-center">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
            <div className="text-center md:text-left">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">Simple, honest pricing</h2>
              <p className="text-lg text-slate-600">No hidden fees. Cancel anytime.</p>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => setPricingTab('monthly')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                  pricingTab === 'monthly'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-300'
                    : 'text-slate-500'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setPricingTab('yearly')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                  pricingTab === 'yearly'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-300'
                    : 'text-slate-500'
                }`}
              >
                Yearly <span className="text-xs bg-yellow-100 text-amber-800 px-2 py-0.5 rounded ml-1">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {pricingPlans.map((plan) => (
              <motion.div
                key={plan.name}
                whileHover={{ y: -5 }}
                className={`p-8 rounded-[32px] border-3 relative flex flex-col ${
                  plan.popular
                    ? 'bg-yellow-50 border-slate-900 shadow-[6px_6px_0px_rgba(0,0,0,0.2)]'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-900 text-xs font-black px-3 py-1 rounded-full border-2 border-white shadow-sm">
                    Most popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-black text-slate-900">{plan.name}</h3>
                  <p className="text-sm text-slate-500">{plan.description}</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-4xl font-black text-slate-900">
                      {pricingTab === 'monthly' ? plan.price : Math.round(plan.price * 0.8 * 12) / 12}
                    </span>
                    <span className="text-sm font-bold text-slate-500">{pricingTab === 'monthly' ? plan.interval : '/mo (billed yearly)'}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[10px] font-black shrink-0">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                      <span className="text-slate-700 font-semibold">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => {
                    triggerConfetti();
                    setRoute('payment');
                  }}
                  className={`w-full py-4 rounded-2xl font-bold text-lg transition active:scale-95 flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-yellow-400 text-slate-900 shadow-[3px_3px_0px_rgba(0,0,0,0.2)] border-2 border-slate-900 hover:bg-yellow-500'
                      : 'bg-white text-slate-900 border-2 border-slate-300 hover:bg-amber-50'
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-900 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-slate-800 rounded-[32px] p-8 sm:p-12 border-3 border-slate-700 shadow-[6px_6px_0px_rgba(0,0,0,0.3)] text-center">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Ready to run your hub?</h2>
            <p className="text-slate-300 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
              Join hundreds of teams already using Bridge to move faster and decide together.
            </p>
            <button
              onClick={() => {
                triggerConfetti();
                setRoute('auth');
              }}
              className="px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold text-lg rounded-2xl shadow-[3px_3px_0px_rgba(0,0,0,0.4)] border-2 border-slate-700 active:scale-95 transition flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowRight className="w-5 h-5" />
              Start your free trial
            </button>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="font-black text-slate-900">Bridge Hub</span>
          <div className="flex gap-6 text-xs font-bold text-slate-500 uppercase">
            <a href="#" className="hover:text-amber-700 transition">Privacy</a>
            <a href="#" className="hover:text-amber-700 transition">Terms</a>
            <a href="#" className="hover:text-amber-700 transition">Status</a>
          </div>
          <p className="text-xs text-slate-400">© 2026 Bridge AI OS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

// ============================================
// AUTH PAGE
// ============================================

export const AuthPage: React.FC = () => {
  const { setRoute } = useRoute();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (mode === 'signup' && !confirmPassword) {
      setError('Please confirm your password');
      setLoading(false);
      return;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setSuccess(
      mode === 'login'
        ? 'Welcome back! Redirecting to your hub...'
        : 'Account created! Redirecting to your hub...'
    );
    setTimeout(() => setRoute('app'), 1000);
  };

  return (
    <div className="min-h-screen bg-amber-50 text-slate-900 font-sans flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-slate-900 shadow-[3px_3px_0px_rgba(0,0,0,0.2)]">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-slate-600">
            {mode === 'login'
              ? 'Sign in to your Bridge hub'
              : 'Join Bridge and start running your life hub'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-[32px] p-8 border-3 border-slate-900 shadow-[6px_6px_0px_rgba(0,0,0,0.2)]">
          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl text-emerald-700 font-bold text-sm flex items-center gap-2">
              <Check className="w-5 h-5" />
              {success}
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border-2 border-rose-200 rounded-xl text-rose-700 font-bold text-sm flex items-center gap-2">
              <Lock className="w-5 h-5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 text-slate-900 font-bold focus:border-slate-900 focus:ring-2 focus:ring-yellow-100 outline-none transition bg-amber-50"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 text-slate-900 font-bold focus:border-slate-900 focus:ring-2 focus:ring-yellow-100 outline-none transition bg-amber-50"
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Confirm password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 text-slate-900 font-bold focus:border-slate-900 focus:ring-2 focus:ring-yellow-100 outline-none transition bg-amber-50"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition active:scale-95 flex items-center justify-center gap-2 ${
                loading
                  ? 'bg-slate-400 text-slate-200 cursor-not-allowed'
                  : 'bg-yellow-400 text-slate-900 shadow-[3px_3px_0px_rgba(0,0,0,0.2)] border-2 border-slate-900 hover:bg-yellow-500'
              }`}
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  {mode === 'login' ? 'Sign in' : 'Create account'}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600 mb-3">
              Don't have an account?{' '}
              <button
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-amber-700 font-bold hover:text-amber-800 transition underline"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
            <p className="text-xs text-slate-400">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">
            Or continue with
          </p>
          <div className="flex justify-center gap-3 mt-3">
            <button className="w-10 h-10 rounded-xl border-2 border-slate-300 bg-white flex items-center justify-center hover:bg-amber-50 transition active:scale-95">
              <span>G</span>
            </button>
            <button className="w-10 h-10 rounded-xl border-2 border-slate-300 bg-white flex items-center justify-center hover:bg-amber-50 transition active:scale-95">
              <span>A</span>
            </button>
            <button className="w-10 h-10 rounded-xl border-2 border-slate-300 bg-white flex items-center justify-center hover:bg-amber-50 transition active:scale-95">
              <span>🍎</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ============================================
// PAYMENT / PRICING PAGE
// ============================================

interface Plan {
  name: string;
  price: number;
  interval: string;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
  color: string;
}

export const PaymentPage: React.FC = () => {
  const { setRoute } = useRoute();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'plans' | 'checkout' | 'success'>('plans');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'google'>('card');

  const plans: Plan[] = [
    {
      name: 'Starter',
      price: 0,
      interval: '/mo',
      description: 'For individuals getting started.',
      features: ['Up to 50 tasks', '5 receipt slips/month', 'Basic budget tracking', 'Community support'],
      cta: 'Get Started Free',
      popular: false,
      color: 'blue',
    },
    {
      name: 'Growth',
      price: 19,
      interval: '/mo',
      description: 'For growing teams and proxies.',
      features: ['Unlimited tasks', 'Unlimited slips', 'Consensus voting', 'Proxy delegation', 'Google Calendar sync', 'Priority email support'],
      cta: 'Start Free Trial',
      popular: true,
      color: 'emerald',
    },
    {
      name: 'Enterprise',
      price: 99,
      interval: '/mo',
      description: 'For organizations with compliance needs.',
      features: ['Everything in Growth', 'SSO / SAML', 'Audit logs', 'Custom domain', 'SLA guarantee', 'Dedicated onboarding'],
      cta: 'Contact Sales',
      popular: false,
      color: 'slate',
    },
  ];

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setCheckoutStep('checkout');
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutStep('success');
  };

  const colorMap: Record<string, string> = {
    blue: 'bg-yellow-400 hover:bg-yellow-500 border-blue-900',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 border-emerald-900',
    slate: 'bg-slate-600 hover:bg-slate-700 border-slate-900',
  };

  if (checkoutStep === 'success') {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <Check className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-4">Payment successful!</h1>
          <p className="text-slate-600 mb-8">
            Your Bridge {selectedPlan?.name} plan is now active. Welcome to the hub!
          </p>
          <button
            onClick={() => setRoute('app')}
            className="px-8 py-3 bg-yellow-400 hover:bg-yellow-500 text-white font-bold rounded-2xl shadow-[3px_3px_0px_rgba(0,0,0,0.2)] border-2 border-slate-900 active:scale-95"
          >
            Go to dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  if (checkoutStep === 'checkout' && selectedPlan) {
    return (
      <div className="min-h-screen bg-amber-50 font-sans">
        {/* Top nav */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
          <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
            <button
              onClick={() => setRoute('app')}
              className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-amber-700 transition"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to plans
            </button>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Step 1 of 2
            </span>
          </div>
        </nav>

        <div className="max-w-md mx-auto px-6 py-20">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-slate-900 mb-2">Checkout</h1>
            <p className="text-slate-600">Complete your subscription to Bridge {selectedPlan.name}</p>
          </div>

          {/* Plan summary card */}
          <div className="bg-white rounded-[32px] p-6 border-3 border-slate-900 shadow-[4px_4px_0px_rgba(0,0,0,0.2)] mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate-600 uppercase">Your plan</span>
              <span className="text-sm font-bold text-amber-700">{selectedPlan.name}</span>
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-black text-slate-900">${selectedPlan.price}</span>
              <span className="text-sm font-bold text-slate-500">{selectedPlan.interval}</span>
            </div>
            <ul className="space-y-2 text-sm">
              {selectedPlan.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-slate-600 font-semibold">
                  <span className="w-3 h-3 rounded-full bg-slate-200" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Payment form */}
          <form onSubmit={handlePay} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">
                Payment method
              </label>
              <div className="flex gap-3">
                {(['card', 'paypal', 'google'] as const).map((method) => {
                  const labels: Record<string, { label: string; icon: string }> = {
                    card: { label: 'Card', icon: '💳' },
                    paypal: { label: 'PayPal', icon: '🅿️' },
                    google: { label: 'Google Pay', icon: '🔍' },
                  };
                  const active = paymentMethod === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`flex-1 flex flex-col items-center gap-2 px-4 py-4 rounded-2xl border-3 font-bold text-xs transition ${
                        active
                          ? 'bg-yellow-50 border-slate-900 text-amber-700 shadow-[2px_2px_0px_rgba(0,0,0,0.1)]'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-amber-50'
                      }`}
                    >
                      <span className="text-2xl">{labels[method].icon}</span>
                      <span>{labels[method].label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {paymentMethod === 'card' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Card number</label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 text-slate-900 font-bold focus:border-slate-900 focus:ring-2 focus:ring-yellow-100 outline-none bg-amber-50"
                    maxLength="19"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Expiry</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 text-slate-900 font-bold focus:border-slate-900 focus:ring-2 focus:ring-yellow-100 outline-none bg-amber-50"
                      maxLength="5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">CVC</label>
                    <input
                      type="text"
                      placeholder="123"
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 text-slate-900 font-bold focus:border-slate-900 focus:ring-2 focus:ring-yellow-100 outline-none bg-amber-50"
                      maxLength="3"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Name on card</label>
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 text-slate-900 font-bold focus:border-slate-900 focus:ring-2 focus:ring-yellow-100 outline-none bg-amber-50"
                  />
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between text-sm mb-4">
                <span className="text-slate-600 font-semibold">Subtotal</span>
                <span className="font-bold text-slate-900">${selectedPlan.price}.00</span>
              </div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-500">Tax</span>
                <span className="text-slate-900">$0.00</span>
              </div>
              <div className="flex items-center justify-between text-base font-black mb-6">
                <span>Total</span>
                <span>${selectedPlan.price}.00/{selectedPlan.interval.replace('/', '')}</span>
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-4 rounded-2xl font-bold text-lg transition active:scale-95 flex items-center justify-center gap-2 ${colorMap[selectedPlan.color]}`}
            >
              <CreditCard className="w-5 h-5" />
              Pay ${selectedPlan.price}.00 now
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Plans view
  return (
    <div className="min-h-screen bg-amber-50 text-slate-900 font-sans">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-6 h-6 bg-yellow-400 rounded-xl flex items-center justify-center border-2 border-slate-900">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-black text-slate-900 uppercase tracking-tight">Bridge</span>
          </div>
          <a
            href="#"
            className="text-sm font-bold text-amber-700 hover:text-amber-800 transition px-4 py-2 border border-slate-200 rounded-xl bg-yellow-50 active:scale-95"
          >
            Back to hub
          </a>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-32">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4">Choose your plan</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">Simple, transparent pricing for individuals and teams.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              whileHover={{ y: -5 }}
              className={`relative p-8 rounded-[32px] border-3 flex flex-col ${
                plan.popular
                  ? 'bg-yellow-50 border-slate-900 shadow-[6px_6px_0px_rgba(0,0,0,0.2)]'
                  : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-900 text-[10px] font-black px-3 py-1 rounded-full border-2 border-white shadow-sm">
                  Most popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-black text-slate-900">{plan.name}</h3>
                <p className="text-sm text-slate-500">{plan.description}</p>
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-4xl font-black text-slate-900">${plan.price}</span>
                  <span className="text-sm font-bold text-slate-500">{plan.interval}</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[10px] font-black shrink-0">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                    <span className="text-slate-700 font-semibold">{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSelectPlan(plan)}
                className={`w-full py-4 rounded-2xl font-bold text-lg transition active:scale-95 ${colorMap[plan.color]}`}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-slate-500">
            Questions? Email <a href="mailto:support@bridge.ai" className="text-amber-700 font-bold underline">support@bridge.ai</a>
          </p>
        </div>
      </div>
    </div>
  );
};
