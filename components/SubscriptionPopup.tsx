'use client';

import { useState, useEffect } from 'react';
import { X, Check, Clock, CreditCard, Crown, Zap, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';

const PLAN_ICONS = [Zap, Crown, Shield, CreditCard];
const PLAN_GRADIENTS = [
  'from-blue-500 to-cyan-400',
  'from-violet-500 to-purple-400',
  'from-amber-500 to-orange-400',
  'from-emerald-500 to-teal-400',
];

interface SubscriptionPopupProps {
  open: boolean;
  onClose: () => void;
  subscription: any;
  preloadedPlans?: any[];
}

export default function SubscriptionPopup({ open, onClose, subscription, preloadedPlans }: SubscriptionPopupProps) {
  const [plans, setPlans] = useState<any[]>(preloadedPlans || []);
  const [loading, setLoading] = useState(false);
  const [startingTrial, setStartingTrial] = useState(false);
  const user = getCurrentUser();

  // Use preloaded plans if available, otherwise fetch on open
  useEffect(() => {
    if (preloadedPlans && preloadedPlans.length > 0) {
      setPlans(preloadedPlans);
      setLoading(false);
      return;
    }
    if (open && plans.length === 0) {
      setLoading(true);
      fetch('/api/plans?t=' + Date.now())
        .then(r => r.json())
        .then(data => setPlans(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open, preloadedPlans]);

  const handleStartTrial = async (plan: any) => {
    if (!user?.id) return;
    setStartingTrial(true);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action: 'start-trial', planId: plan._id }),
      });
      if (res.ok) {
        window.dispatchEvent(new Event('subscriptionUpdated'));
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to start trial');
      }
    } catch (e) {
      alert('Failed to start trial');
    }
    setStartingTrial(false);
  };

  const handlePayment = async (plan: any) => {
    if (!user?.id) return;

    try {
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan._id, userId: user.id }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        alert(err.error || 'Failed to create order');
        return;
      }

      const orderData = await orderRes.json();

      const options = {
        key: orderData.razorpayKeyId,
        amount: orderData.amount,
        currency: 'INR',
        name: 'BEMS',
        description: `${plan.name} Subscription`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                userId: user.id,
                planId: plan._id,
                planName: plan.name,
                amount: plan.price,
                durationDays: plan.durationDays,
              }),
            });

            if (verifyRes.ok) {
              window.dispatchEvent(new Event('subscriptionUpdated'));
              onClose();
            } else {
              alert('Payment verification failed. Contact admin.');
            }
          } catch (e) {
            alert('Payment verification error. Contact admin.');
          }
        },
        prefill: { name: user.displayName || user.username },
        theme: { color: '#2563eb' },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (e) {
      alert('Payment initialization failed');
    }
  };

  if (!open) return null;

  const isExpired = subscription?.status === 'expired';
  const hasNoSub = subscription?.status === 'none';
  const trialUsed = subscription?.trialUsed === true;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Popup */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
              isExpired ? 'bg-red-500' : 'bg-blue-600'
            }`}>
              {isExpired ? <AlertTriangle className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {isExpired ? 'Subscription Expired' : 'Subscription Required'}
              </h2>
              <p className="text-sm text-slate-500">
                {isExpired
                  ? 'Renew your plan to continue using the software.'
                  : 'Choose a plan to unlock all features of BEMS.'}
              </p>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="p-6">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : plans.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No plans available. Contact admin.
            </div>
          ) : (
            <div className={`grid gap-4 ${
              plans.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' :
              plans.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
              plans.length <= 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-' + Math.min(plans.length, 4) :
              'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            }`}>
              {plans.map((plan, idx) => {
                const Icon = PLAN_ICONS[idx % PLAN_ICONS.length];
                const gradient = PLAN_GRADIENTS[idx % PLAN_GRADIENTS.length];
                return (
                  <div
                    key={plan._id}
                    className={`relative bg-white rounded-xl border-2 border-slate-200 overflow-hidden transition-all hover:shadow-md`}
                  >
                    <div className="p-5 pt-5">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-3`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <h3 className="text-base font-bold text-slate-800">{plan.name}</h3>
                      {plan.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{plan.description}</p>
                      )}

                      <div className="mt-3 mb-4">
                        <span className="text-3xl font-black text-slate-900">₹{plan.price.toLocaleString('en-IN')}</span>
                        <span className="text-xs text-slate-500 ml-1">/ {plan.durationDays} days</span>
                      </div>

                      <ul className="space-y-1.5 mb-4 text-xs text-slate-600">
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          Full software access
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          Unlimited reports
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          All features included
                        </li>
                      </ul>

                      {plan.trialDays > 0 && !trialUsed && (
                        <button
                          onClick={() => handleStartTrial(plan)}
                          disabled={startingTrial}
                          className="w-full py-2.5 mb-2 rounded-lg font-bold text-sm transition-all active:scale-[0.97] flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                        >
                          {startingTrial ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                          Start {plan.trialDays}-Day Trial
                        </button>
                      )}

                      <button
                        onClick={() => handlePayment(plan)}
                        className="w-full py-2.5 rounded-lg font-bold text-sm transition-all active:scale-[0.97] flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800"
                      >
                        <CreditCard className="w-4 h-4" />
                        Subscribe Now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .animate-in {
          animation: popIn 0.2s ease-out;
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
