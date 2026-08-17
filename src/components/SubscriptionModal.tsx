import { useState, useEffect } from 'react';
import { useAppStore, useAuthStore } from '../store/useStore';
import { getTranslation } from '../lib/i18n';
import { 
  X, Crown, Check, ShieldCheck, Zap, Sparkles, 
  ExternalLink, Loader2, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { motion } from 'motion/react';
import { auth, getAccessToken } from '../lib/firebase';

export default function SubscriptionModal() {
  const { isSubscriptionModalOpen, setSubscriptionModalOpen, language, darkMode, appSettings } = useAppStore();
  const { user, setUser } = useAuthStore();
  const t = (key: string) => getTranslation(language, key);

  // Dynamic Plans from Admin Settings or defaults
  const proTitle = appSettings?.proPlanTitle || (language === 'uz' ? 'Pro Obuna' : language === 'ru' ? 'Pro Подписка' : 'Pro Plan');
  const proPrice = appSettings?.proPlanPriceUzs || (language === 'uz' ? "49,000 so'm/oy" : language === 'ru' ? '49,000 сум/мес' : '49,000 UZS/mo');
  const proAmount = Number(appSettings?.proPlanPriceNum) || 49000;
  const proFeat1 = appSettings?.proPlanFeature1 || (language === 'uz' ? 'Full HD 1080p 60fps' : language === 'ru' ? 'Full HD 1080p 60fps' : 'Full HD 1080p 60fps');
  const proFeat2 = appSettings?.proPlanFeature2 || (language === 'uz' ? '15 ta oflayn yuklash' : language === 'ru' ? '15 офлайн загрузок' : '15 offline downloads');

  const vipTitle = appSettings?.vipPlanTitle || (language === 'uz' ? 'VIP Oylik' : language === 'ru' ? 'VIP Ежемесячный' : 'VIP Monthly');
  const vipPrice = appSettings?.vipPlanPriceUzs || (language === 'uz' ? "99,000 so'm/oy" : language === 'ru' ? '99,000 сум/мес' : '99,000 UZS/mo');
  const vipAmount = Number(appSettings?.vipPlanPriceNum) || 99000;
  const vipFeat1 = appSettings?.vipPlanFeature1 || (language === 'uz' ? 'Cheksiz 4K HDR & Dublyaj' : language === 'ru' ? 'Безлимитный 4K HDR и Дубляж' : 'Unlimited 4K HDR & Dubbing');
  const vipFeat2 = appSettings?.vipPlanFeature2 || (language === 'uz' ? 'Cheksiz Oflayn Xotira' : language === 'ru' ? 'Безлимитное Офлайн Хранилище' : 'Unlimited Offline Vault');

  const yearlyTitle = appSettings?.vipYearlyTitle || (language === 'uz' ? 'VIP 1 Yillik' : language === 'ru' ? 'VIP 1 Год' : 'VIP 1 Year');
  const yearlyPrice = appSettings?.vipYearlyPriceUzs || (language === 'uz' ? "890,000 so'm/yil" : language === 'ru' ? '890,000 сум/год' : '890,000 UZS/yr');
  const yearlyAmount = Number(appSettings?.vipYearlyPriceNum) || 890000;
  const yearlyBadge = appSettings?.vipYearlyDiscountBadge || (language === 'uz' ? '-25% CHEGIRMA' : language === 'ru' ? '-25% СКИДКА' : '-25% DISCOUNT');
  const yearlyFeat1 = appSettings?.vipYearlyFeature1 || (language === 'uz' ? '12 oy to\'liq VIP imkoniyat' : language === 'ru' ? '12 месяцев полный VIP доступ' : '12 months full VIP access');
  const yearlyFeat2 = appSettings?.vipYearlyFeature2 || (language === 'uz' ? 'Shaxsiy qo\'llab-quvvatlash' : language === 'ru' ? 'Персональная поддержка' : 'Priority VIP support');

  const isClickEnabled = appSettings?.enableClick !== false;
  const isPaymeEnabled = appSettings?.enablePayme !== false;
  const isGPayEnabled = appSettings?.enableGooglePay !== false;

  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'vip' | 'vip_yearly'>('vip');
  const [paymentMethod, setPaymentMethod] = useState<'click' | 'payme' | 'gpay'>('click');
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Set default payment method based on what is enabled
    if (isClickEnabled) setPaymentMethod('click');
    else if (isPaymeEnabled) setPaymentMethod('payme');
    else if (isGPayEnabled) setPaymentMethod('gpay');
  }, [isClickEnabled, isPaymeEnabled, isGPayEnabled]);

  if (!isSubscriptionModalOpen) return null;

  const getPlanAmount = () => {
    if (selectedPlan === 'pro') return proAmount;
    if (selectedPlan === 'vip_yearly') return yearlyAmount;
    return vipAmount;
  };

  const getPlanDisplayPrice = () => {
    if (selectedPlan === 'pro') return proPrice;
    if (selectedPlan === 'vip_yearly') return yearlyPrice;
    return vipPrice;
  };

  const handleCheckout = async () => {
    setProcessing(true);
    setErrorMessage(null);

    try {
      let token: string | null = null;
      if (auth.currentUser) {
        try {
          token = await auth.currentUser.getIdToken(true);
        } catch (e) {
          console.warn("Error getting ID token from auth.currentUser:", e);
        }
      }
      if (!token) {
        token = await getAccessToken();
      }

      if (!token) {
        throw new Error(
          language === 'uz' 
            ? "To'lovni amalga oshirish uchun avval tizimga kiring." 
            : language === 'ru' 
            ? "Пожалуйста, сначала войдите в свой аккаунт для оформления подписки." 
            : "Please sign in to your account to complete subscription."
        );
      }

      const amount = getPlanAmount();

      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          plan: selectedPlan,
          provider: paymentMethod,
          amountUzs: amount,
          userUid: user?.uid || auth.currentUser?.uid,
          userEmail: user?.email || auth.currentUser?.email,
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (language === 'uz' ? "To'lov jarayonida xatolik." : language === 'ru' ? "Ошибка платежа." : "Payment initiation failed."));
      }

      // If checkout URL is generated (Click / Payme)
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      // For instant activation / Google Pay success
      setSuccess(true);
      if (user) {
        setUser({
          ...user,
          subscriptionStatus: 'active',
          subscriptionTier: selectedPlan === 'pro' ? 'pro' : 'vip'
        });
      }

      setTimeout(() => {
        setSuccess(false);
        setSubscriptionModalOpen(false);
      }, 2500);

    } catch (err: any) {
      console.error("Payment error:", err);
      setErrorMessage(err.message || (language === 'uz' ? "To'lov xizmati bilan bog'lanishda xatolik yuz berdi." : language === 'ru' ? "Ошибка соединения с платежной системой." : "Failed to connect to payment provider."));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`relative w-full max-w-2xl ${
          darkMode ? 'bg-[#0d0d12] border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-900'
        } border rounded-[32px] p-6 sm:p-8 shadow-2xl overflow-hidden transition-colors duration-200`}
      >
        
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-orange-500/20 to-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button 
          onClick={() => setSubscriptionModalOpen(false)}
          className={`absolute top-6 right-6 p-2 rounded-full ${
            darkMode ? 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900'
          } transition-all`}
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
            <Crown className="text-black" size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">
              {appSettings?.brandName || "Innovation Plus"} {language === 'uz' ? 'VIP Obunasi' : language === 'ru' ? 'VIP Подписка' : 'VIP Membership'}
            </h2>
            <p className={`text-xs ${darkMode ? 'text-white/60' : 'text-zinc-500'}`}>
              {language === 'uz' 
                ? "Click, Payme va Google Pay orqali 4K Reklamasiz Kirish" 
                : language === 'ru' 
                ? "Доступ 4K без рекламы через Click, Payme и Google Pay" 
                : "Ad-free 4K Ultra HD access via Click, Payme & Google Pay"}
            </p>
          </div>
        </div>

        {/* Subscription Plan Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          
          {/* Pro Plan */}
          <div 
            onClick={() => setSelectedPlan('pro')}
            className={`cursor-pointer rounded-2xl p-4 border transition-all ${
              selectedPlan === 'pro'
                ? 'bg-orange-500/10 border-orange-500 shadow-lg shadow-orange-500/15 ring-1 ring-orange-500'
                : darkMode ? 'bg-white/5 border-white/10 hover:border-white/20' : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-xs">{proTitle}</h3>
            </div>
            <p className="text-base font-black text-orange-500 mb-2">{proPrice}</p>
            <ul className={`space-y-1 text-[10px] ${darkMode ? 'text-white/70' : 'text-zinc-600'}`}>
              <li className="flex items-center gap-1"><Check size={11} className="text-orange-500 shrink-0" /> {proFeat1}</li>
              <li className="flex items-center gap-1"><Check size={11} className="text-orange-500 shrink-0" /> {proFeat2}</li>
            </ul>
          </div>

          {/* VIP Monthly Plan */}
          <div 
            onClick={() => setSelectedPlan('vip')}
            className={`cursor-pointer rounded-2xl p-4 border relative transition-all ${
              selectedPlan === 'vip'
                ? 'bg-gradient-to-b from-amber-500/20 to-orange-500/20 border-orange-500 shadow-xl shadow-orange-500/20 ring-1 ring-orange-500'
                : darkMode ? 'bg-white/5 border-white/10 hover:border-white/20' : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
            }`}
          >
            <span className="absolute -top-2.5 right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-black text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow">
              {language === 'uz' ? 'TAVSIYA' : language === 'ru' ? 'РЕКОМЕНДУЕМ' : 'RECOMMENDED'}
            </span>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-xs flex items-center gap-1">{vipTitle} <Sparkles size={11} className="text-amber-400" /></h3>
            </div>
            <p className="text-base font-black text-amber-400 mb-2">{vipPrice}</p>
            <ul className={`space-y-1 text-[10px] ${darkMode ? 'text-white/80' : 'text-zinc-600'}`}>
              <li className="flex items-center gap-1"><Check size={11} className="text-amber-400 shrink-0" /> {vipFeat1}</li>
              <li className="flex items-center gap-1"><Check size={11} className="text-amber-400 shrink-0" /> {vipFeat2}</li>
            </ul>
          </div>

          {/* VIP Yearly Plan */}
          <div 
            onClick={() => setSelectedPlan('vip_yearly')}
            className={`cursor-pointer rounded-2xl p-4 border relative transition-all ${
              selectedPlan === 'vip_yearly'
                ? 'bg-gradient-to-b from-purple-500/20 to-orange-500/20 border-purple-500 shadow-xl shadow-purple-500/20 ring-1 ring-purple-500'
                : darkMode ? 'bg-white/5 border-white/10 hover:border-white/20' : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
            }`}
          >
            <span className="absolute -top-2.5 right-3 bg-emerald-500 text-black text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow">
              {yearlyBadge}
            </span>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-xs">{yearlyTitle}</h3>
            </div>
            <p className="text-base font-black text-purple-400 mb-2">{yearlyPrice}</p>
            <ul className={`space-y-1 text-[10px] ${darkMode ? 'text-white/80' : 'text-zinc-600'}`}>
              <li className="flex items-center gap-1"><Check size={11} className="text-purple-400 shrink-0" /> {yearlyFeat1}</li>
              <li className="flex items-center gap-1"><Check size={11} className="text-purple-400 shrink-0" /> {yearlyFeat2}</li>
            </ul>
          </div>

        </div>

        {/* Payment Gateways Selection (Click, Payme, Google Pay) */}
        <div className="mb-6 space-y-2">
          <label className={`text-[10px] font-black uppercase tracking-wider ${darkMode ? 'text-white/50' : 'text-zinc-500'}`}>
            {language === 'uz' 
              ? "To'lov Tizimini Tanlang (Click, Payme, Google Pay)" 
              : language === 'ru' 
              ? "Выберите Платежную Систему (Click, Payme, Google Pay)" 
              : "Select Payment Method (Click, Payme, Google Pay)"}
          </label>
          <div className="grid grid-cols-3 gap-3">
            
            {/* Click */}
            {isClickEnabled && (
              <button
                type="button"
                onClick={() => setPaymentMethod('click')}
                className={`flex items-center justify-center gap-2 py-3.5 px-3 rounded-2xl border text-xs font-bold transition-all ${
                  paymentMethod === 'click' 
                    ? 'bg-blue-600/15 border-blue-500 text-blue-400 ring-1 ring-blue-500 shadow-md' 
                    : darkMode ? 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10' : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                <div className="w-5 h-5 rounded-md bg-blue-500 text-white flex items-center justify-center font-black text-[10px]">
                  C
                </div>
                <span>Click.uz</span>
              </button>
            )}

            {/* Payme */}
            {isPaymeEnabled && (
              <button
                type="button"
                onClick={() => setPaymentMethod('payme')}
                className={`flex items-center justify-center gap-2 py-3.5 px-3 rounded-2xl border text-xs font-bold transition-all ${
                  paymentMethod === 'payme' 
                    ? 'bg-teal-500/15 border-teal-500 text-teal-400 ring-1 ring-teal-500 shadow-md' 
                    : darkMode ? 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10' : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                <div className="w-5 h-5 rounded-md bg-teal-400 text-black flex items-center justify-center font-black text-[10px]">
                  P
                </div>
                <span>Payme</span>
              </button>
            )}

            {/* Google Pay */}
            {isGPayEnabled && (
              <button
                type="button"
                onClick={() => setPaymentMethod('gpay')}
                className={`flex items-center justify-center gap-2 py-3.5 px-3 rounded-2xl border text-xs font-bold transition-all ${
                  paymentMethod === 'gpay' 
                    ? 'bg-amber-500/15 border-amber-500 text-amber-400 ring-1 ring-amber-500 shadow-md' 
                    : darkMode ? 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10' : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                <Zap size={15} className="text-amber-400" />
                <span>Google Pay</span>
              </button>
            )}

          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{language === 'uz' ? "VIP A'zolik Muvaffaqiyatli Faollashtirildi! ✓" : language === 'ru' ? "VIP Подписка Успешно Активирована! ✓" : "VIP Membership Successfully Activated! ✓"}</span>
          </div>
        )}

        {/* Security & Action */}
        <div className="space-y-3.5">
          <div className={`flex items-center gap-2 text-[10px] ${darkMode ? 'text-white/40' : 'text-zinc-500'} justify-center`}>
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>
              {language === 'uz' 
                ? "Click, Payme & Google Pay Shifrlangan Xavfsiz To'lov • Istalgan vaqt bekor qilish mumkin" 
                : language === 'ru' 
                ? "Click, Payme и Google Pay Защищенный Платеж • Отмена в любое время" 
                : "Encrypted Secure Payment with Click, Payme & Google Pay • Cancel anytime"}
            </span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={processing || success}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-black font-black text-sm uppercase tracking-wider shadow-xl shadow-orange-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>{language === 'uz' ? "To'lov tizimiga yo'naltirilmoqda..." : language === 'ru' ? "Перенаправление на оплату..." : "Redirecting to gateway..."}</span>
              </>
            ) : success ? (
              <span>{language === 'uz' ? "VIP Status Faollashdi! ✓" : language === 'ru' ? "VIP Статус Активен! ✓" : "VIP Status Active! ✓"}</span>
            ) : (
              <>
                <span>{getPlanDisplayPrice()} {language === 'uz' ? "To'lash" : language === 'ru' ? "Оплатить" : "Pay"} ({paymentMethod.toUpperCase()})</span>
                <ExternalLink size={15} />
              </>
            )}
          </button>
        </div>

      </motion.div>
    </div>
  );
}
