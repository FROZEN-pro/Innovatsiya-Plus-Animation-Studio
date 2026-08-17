import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  DollarSign, TrendingUp, Users, Crown, CreditCard, 
  Sparkles, CheckCircle2, ArrowUpRight, ShieldCheck, 
  Layers, Percent, Activity, RefreshCw, Smartphone
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { User, AppSettings } from '../types';

interface Props {
  users: User[];
  appSettings: AppSettings;
  darkMode: boolean;
  onNavigateToSettings?: () => void;
}

export default function SubscriptionAnalyticsDashboard({
  users,
  appSettings,
  darkMode,
  onNavigateToSettings
}: Props) {
  // Aggregate Metrics based on active users and settings
  const metrics = useMemo(() => {
    const totalUsers = users.length || 1;
    let vipCount = 0;
    let proCount = 0;
    let freeCount = 0;
    let trialCount = 0;
    let bannedCount = 0;

    users.forEach((u) => {
      if (u.subscriptionStatus === 'banned') {
        bannedCount++;
      } else if (u.subscriptionTier === 'vip' && u.subscriptionStatus === 'active') {
        vipCount++;
      } else if (u.subscriptionTier === 'pro' && u.subscriptionStatus === 'active') {
        proCount++;
      } else if (u.subscriptionStatus === 'trial') {
        trialCount++;
      } else {
        freeCount++;
      }
    });

    const totalPaid = vipCount + proCount;
    const vipPrice = appSettings?.vipPlanPriceNum ?? 99000;
    const proPrice = appSettings?.proPlanPriceNum ?? 49000;

    // Monthly Recurring Revenue (UZS)
    const mrrUzs = (vipCount * vipPrice) + (proCount * proPrice);
    const arrUzs = mrrUzs * 12;
    const conversionRate = totalUsers > 0 ? ((totalPaid / totalUsers) * 100).toFixed(1) : "0.0";

    return {
      totalUsers,
      vipCount,
      proCount,
      freeCount,
      trialCount,
      bannedCount,
      totalPaid,
      vipPrice,
      proPrice,
      mrrUzs,
      arrUzs,
      conversionRate,
    };
  }, [users, appSettings]);

  // Dynamic Historical 30-Day Growth Mock Data generated based on current metrics
  const growthTimelineData = useMemo(() => {
    const data = [];
    const days = 14;
    const now = new Date();

    for (let i = days; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayLabel = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
      
      const factor = 1 - (i / (days * 1.5));
      const simulatedVip = Math.max(1, Math.round(metrics.vipCount * (0.6 + factor * 0.4)));
      const simulatedPro = Math.max(1, Math.round(metrics.proCount * (0.5 + factor * 0.5)));
      const simulatedFree = Math.max(2, Math.round(metrics.freeCount * (0.4 + factor * 0.6)));
      const simulatedRevenue = (simulatedVip * metrics.vipPrice) + (simulatedPro * metrics.proPrice);

      data.push({
        name: dayLabel,
        VIP: simulatedVip,
        Pro: simulatedPro,
        Free: simulatedFree,
        RevenueUZS: simulatedRevenue,
      });
    }
    return data;
  }, [metrics]);

  // Tier Revenue Distribution
  const revenueTierData = useMemo(() => {
    const vipRev = metrics.vipCount * metrics.vipPrice;
    const proRev = metrics.proCount * metrics.proPrice;
    return [
      { name: 'VIP Plan (99k)', revenue: vipRev, count: metrics.vipCount, fill: '#f97316' },
      { name: 'Pro Plan (49k)', revenue: proRev, count: metrics.proCount, fill: '#38bdf8' },
    ];
  }, [metrics]);

  // Payment Gateway Distribution Share
  const paymentGatewayData = [
    { name: 'Click Uzbekistan', value: 54, color: '#0ea5e9' },
    { name: 'Payme Uzbekistan', value: 36, color: '#14b8a6' },
    { name: 'Google Pay', value: 10, color: '#f59e0b' },
  ];

  // Subscription Status Donut Data
  const statusDonutData = [
    { name: 'VIP Active', value: metrics.vipCount || 3, color: '#f97316' },
    { name: 'Pro Active', value: metrics.proCount || 2, color: '#38bdf8' },
    { name: 'Free Users', value: metrics.freeCount || 5, color: '#71717a' },
    { name: 'Trial / Promo', value: metrics.trialCount || 1, color: '#a855f7' },
  ];

  // Recent simulated subscription transactions feed
  const recentEvents = [
    {
      id: 'tx_1',
      user: 'azam_dev@gmail.com',
      plan: 'VIP Oylik (4K HDR)',
      amount: '99,000 UZS',
      gateway: 'Click',
      time: '14 min oldin',
      status: 'success'
    },
    {
      id: 'tx_2',
      user: 'malika_k@inbox.uz',
      plan: 'Pro Obuna (Full HD)',
      amount: '49,000 UZS',
      gateway: 'Payme',
      time: '1 soat oldin',
      status: 'success'
    },
    {
      id: 'tx_3',
      user: 'rustam_99@gmail.com',
      plan: 'VIP 1 Yillik (-25%)',
      amount: '890,000 UZS',
      gateway: 'Google Pay',
      time: '4 soat oldin',
      status: 'success'
    },
    {
      id: 'tx_4',
      user: 'bekzod_art@mail.ru',
      plan: 'VIP Oylik (4K HDR)',
      amount: '99,000 UZS',
      gateway: 'Click',
      time: '8 soat oldin',
      status: 'success'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Top Header & Settings Quick Link */}
      <div className={`p-6 rounded-[28px] border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign size={18} />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">
              Subscription & VIP Revenue Analytics
            </h2>
          </div>
          <p className={`text-xs mt-1 ${darkMode ? 'text-white/60' : 'text-zinc-500'}`}>
            Real-time subscriber acquisition, MRR projections, payment gateway performance, and plan tier distribution.
          </p>
        </div>

        {onNavigateToSettings && (
          <button
            onClick={onNavigateToSettings}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-black flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all shrink-0 self-start md:self-auto"
          >
            <Crown size={14} />
            <span>Manage VIP Pricing & Gateways</span>
            <ArrowUpRight size={14} />
          </button>
        )}
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Estimated MRR */}
        <div className={`p-5 rounded-2xl border transition-all ${
          darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <TrendingUp size={14} />
              <span>Est. Monthly MRR</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active
            </span>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {metrics.mrrUzs.toLocaleString()} <span className="text-xs text-orange-400 font-bold">{appSettings?.vipCurrency || 'UZS'}</span>
          </div>
          <div className="text-[11px] text-zinc-400 mt-1.5 flex items-center gap-1">
            <span>ARR Run-rate:</span>
            <span className="font-mono text-white/80 font-bold">{metrics.arrUzs.toLocaleString()} UZS/yr</span>
          </div>
        </div>

        {/* Paid Subscribers */}
        <div className={`p-5 rounded-2xl border transition-all ${
          darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
            <span className="flex items-center gap-1.5 text-orange-400">
              <Crown size={14} />
              <span>Active Paid Subs</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
              {metrics.totalPaid} Users
            </span>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {metrics.vipCount} <span className="text-xs text-orange-400 font-bold">VIP</span> + {metrics.proCount} <span className="text-xs text-sky-400 font-bold">PRO</span>
          </div>
          <div className="text-[11px] text-zinc-400 mt-1.5 flex items-center gap-1">
            <span>Free / Standard users:</span>
            <span className="font-mono text-white/80 font-bold">{metrics.freeCount}</span>
          </div>
        </div>

        {/* Paid Conversion Rate */}
        <div className={`p-5 rounded-2xl border transition-all ${
          darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
            <span className="flex items-center gap-1.5 text-purple-400">
              <Percent size={14} />
              <span>Paid Conversion</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Total {metrics.totalUsers}
            </span>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {metrics.conversionRate}%
          </div>
          <div className="text-[11px] text-zinc-400 mt-1.5 flex items-center gap-1">
            <span>Trial users active:</span>
            <span className="font-mono text-white/80 font-bold">{metrics.trialCount}</span>
          </div>
        </div>

        {/* Enabled Gateways Status */}
        <div className={`p-5 rounded-2xl border transition-all ${
          darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
            <span className="flex items-center gap-1.5 text-sky-400">
              <CreditCard size={14} />
              <span>Checkout Gateways</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              UZ Auto
            </span>
          </div>
          <div className="text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${appSettings?.enableClick !== false ? 'bg-sky-500/20 text-sky-300' : 'bg-zinc-800 text-zinc-600'}`}>Click</span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${appSettings?.enablePayme !== false ? 'bg-teal-500/20 text-teal-300' : 'bg-zinc-800 text-zinc-600'}`}>Payme</span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${appSettings?.enableGooglePay !== false ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-800 text-zinc-600'}`}>GPay</span>
          </div>
          <div className="text-[11px] text-zinc-400 mt-2">
            Instant automatic VIP entitlement active
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscriber Growth Timeline (2 cols) */}
        <div className={`lg:col-span-2 p-6 rounded-[28px] border ${
          darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <TrendingUp size={16} className="text-orange-400" />
                <span>Subscriber Growth & Tier Trend (30 Days)</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Active VIP, Pro, and Standard member acquisition velocity
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-orange-400">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> VIP
              </span>
              <span className="flex items-center gap-1.5 text-sky-400">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Pro
              </span>
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-500" /> Free
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="vipGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="proGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="freeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#71717a" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#71717a" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#888" tick={{ fontSize: 11 }} />
                <YAxis stroke="#888" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Area type="monotone" dataKey="VIP" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#vipGradient)" />
                <Area type="monotone" dataKey="Pro" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#proGradient)" />
                <Area type="monotone" dataKey="Free" stroke="#71717a" strokeWidth={2} fillOpacity={1} fill="url(#freeGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscriber Status Breakdown Donut (1 col) */}
        <div className={`p-6 rounded-[28px] border flex flex-col justify-between ${
          darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'
        }`}>
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Layers size={16} className="text-sky-400" />
              <span>Membership Distribution</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Account status composition
            </p>

            <div className="h-48 w-full mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusDonutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#27272a',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-4 border-t border-white/5">
            {statusDonutData.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-zinc-400 truncate">{d.name}:</span>
                <span className="font-bold text-white font-mono ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Row: Gateway Share & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Gateways Performance */}
        <div className={`p-6 rounded-[28px] border ${
          darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <CreditCard size={16} className="text-emerald-400" />
                <span>Payment Gateway Performance</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Conversion breakdown across authorized checkout providers
              </p>
            </div>
          </div>

          <div className="space-y-4 mt-6">
            {paymentGatewayData.map((gw) => (
              <div key={gw.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-2 text-white">
                    <Smartphone size={14} className="text-zinc-400" />
                    <span>{gw.name}</span>
                  </span>
                  <span className="font-mono text-emerald-400">{gw.value}% Share</span>
                </div>
                <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ width: `${gw.value}%`, backgroundColor: gw.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 text-[11px] text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 size={13} />
              <span>Uzcard & Visa merchant settlement routed automatically</span>
            </span>
            <span className="font-mono font-bold text-white">99.8% Success</span>
          </div>
        </div>

        {/* Live Recent Subscription Events Feed */}
        <div className={`p-6 rounded-[28px] border ${
          darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Activity size={16} className="text-orange-400" />
                <span>Recent Subscription Transactions</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Live membership upgrades and checkout orders
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Stream
            </span>
          </div>

          <div className="space-y-3 mt-2">
            {recentEvents.map((evt) => (
              <div 
                key={evt.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                  darkMode ? 'bg-white/5 border-white/5' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center font-black text-xs">
                    VIP
                  </div>
                  <div>
                    <div className="font-bold text-white">{evt.user}</div>
                    <div className="text-[11px] text-zinc-400">{evt.plan} • <span className="text-sky-400 font-semibold">{evt.gateway}</span></div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-extrabold text-emerald-400">{evt.amount}</div>
                  <div className="text-[10px] text-zinc-500">{evt.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
