'use client';

import { useState, useEffect } from 'react';
import { Loader2, Check, Clock, AlertTriangle, CreditCard, Crown, Zap, Shield } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { cachedFetch, CACHE_TTL, invalidateCache } from '@/lib/api-cache';

const PLAN_ICONS = [Zap, Crown, Shield, CreditCard];
const PLAN_GRADIENTS = [
  'from-blue-500 to-cyan-400',
  'from-violet-500 to-purple-400',
  'from-amber-500 to-orange-400',
  'from-emerald-500 to-teal-400',
];

export default function PricingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startingTrial, setStartingTrial] = useState(false);
  const user = getCurrentUser();

  const fetchData = async (force = false) => {
    if (!user?.id) return;
    if (plans.length === 0) setLoading(true);
    try {
      const [plansData, subData] = await Promise.all([
        cachedFetch<any[]>('/api/plans', { ttl: CACHE_TTL.plans, force }),
        cachedFetch<any>(`/api/subscriptions?userId=${user.id}`, {
          ttl: CACHE_TTL.plans,
          force,
        }),
      ]);
      setPlans(plansData);
      setSubscription(subData);
    } catch (e) {
      console.error('Failed to load pricing data');
    }
    setLoading(false);
  };

  useEffect(() => {
              fetchData(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        fetchData(true);
        // Trigger refresh in layout
        window.dispatchEvent(new Event('subscriptionUpdated'));
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
      // Create Razorpay order
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

      // Open Razorpay checkout
      const options = {
        key: orderData.razorpayKeyId,
        amount: orderData.amount,
        currency: 'INR',
        name: 'BEMS',
        description: `${plan.name} Subscription`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          // Verify payment
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
              fetchData(true);
              window.dispatchEvent(new Event('subscriptionUpdated'));
            } else {
              alert('Payment verification failed. Contact admin.');
            }
          } catch (e) {
            alert('Payment verification error. Contact admin.');
          }
        },
        prefill: {
          name: user.displayName || user.username,
        },
        theme: {
          color: '#2563eb',
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (e) {
      alert('Payment initialization failed');
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const isSubscribed = subscription?.status === 'active' || subscription?.status === 'trial';
  const isExpired = subscription?.status === 'expired';
  const hasNoSub = subscription?.status === 'none';
  const trialUsed = subscription?.trialUsed === true;

  return (
    <div className="space-y-8">
      {/* Current Subscription Status */}
      {isSubscribed && (
        <div className={`rounded-xl border p-5 ${
          subscription.status === 'trial'
            ? 'bg-amber-50 border-amber-200'
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                subscription.status === 'trial' ? 'bg-amber-500' : 'bg-green-500'
              }`}>
                {subscription.status === 'trial' ? <Clock className="w-5 h-5" /> : <Check className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-slate-800">
                  {subscription.status === 'trial' ? 'Free Trial Active' : `${subscription.planName} — Active`}
                </h3>
                <p className="text-sm text-slate-600">
                  Expires on {new Date(subscription.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  <span className="font-bold ml-2">({subscription.daysLeft} day{subscription.daysLeft !== 1 ? 's' : ''} left)</span>
                </p>
              </div>
            </div>
            {subscription.daysLeft <= 3 && (
              <div className="flex items-center gap-2 text-amber-700 bg-amber-100 px-3 py-1.5 rounded-lg text-sm font-medium">
                <AlertTriangle className="w-4 h-4" />
                Expiring soon — renew below!
              </div>
            )}
          </div>
        </div>
      )}

      {isExpired && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-red-800">Subscription Expired</h3>
              <p className="text-sm text-red-600">Your subscription has expired. Choose a plan below to continue using the software.</p>
            </div>
          </div>
        </div>
      )}

      {hasNoSub && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-400 flex items-center justify-center text-white">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">No Active Subscription</h3>
                <p className="text-sm text-slate-600">Choose a plan below to start using the software.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plans / Pricing Cards */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">
          {isSubscribed ? 'Upgrade or Renew' : 'Choose Your Plan'}
        </h2>
        <p className="text-sm text-gray-500 mb-6">Select a plan to get full access to BEMS Software.</p>

        {plans.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm bg-white rounded-xl border border-slate-200">
            No plans available. Contact admin.
          </div>
        ) : (
          <div className={`grid gap-6 ${
            plans.length === 1 ? 'grid-cols-1 max-w-sm' :
            plans.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-2xl' :
            plans.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
          }`}>
            {plans.map((plan, idx) => {
              const Icon = PLAN_ICONS[idx % PLAN_ICONS.length];
              const gradient = PLAN_GRADIENTS[idx % PLAN_GRADIENTS.length];
              return (
                <div
                  key={plan._id}
                  className="relative bg-white rounded-2xl border-2 border-slate-200 overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="p-6">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-4`}>
                      <Icon className="w-6 h-6" />
                    </div>

                    {/* Plan Name */}
                    <h3 className="text-lg font-bold text-slate-800">{plan.name}</h3>
                    {plan.description && (
                      <p className="text-xs text-slate-500 mt-1">{plan.description}</p>
                    )}

                    {/* Price */}
                    <div className="mt-4 mb-6">
                      <span className="text-4xl font-black text-slate-900">₹{plan.price.toLocaleString('en-IN')}</span>
                      <span className="text-sm text-slate-500 ml-1">/ {plan.durationDays} days</span>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2 mb-6 text-sm text-slate-600">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        Full software access
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        Unlimited reports
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        All features included
                      </li>
                    </ul>

                    {/* CTA Button */}
                    {plan.trialDays > 0 && !trialUsed && (
                      <button
                        onClick={() => handleStartTrial(plan)}
                        disabled={startingTrial}
                        className="w-full py-3 mb-3 rounded-xl font-bold text-sm transition-all active:scale-[0.97] flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                      >
                        {startingTrial ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                        Start {plan.trialDays}-Day Trial
                      </button>
                    )}

                    <button
                      onClick={() => handlePayment(plan)}
                      className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.97] flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800"
                    >
                      <CreditCard className="w-4 h-4" />
                      {isSubscribed ? 'Renew' : 'Subscribe Now'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
