import React from 'react';
import { UserProfile } from '../services/supabaseClient';

interface PricingProps {
  onUpgrade: () => void;
  currentTier?: string;
  onNavigate: (page: any) => void;
}

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
);

const Pricing: React.FC<PricingProps> = ({ onUpgrade, currentTier, onNavigate }) => {
  const plans = [
    {
      name: "Free",
      price: "$0",
      credits: 5,
      features: ["5 AI Generations", "Basic Gemini Flash Model", "Community Support", "Public Projects"],
      cta: "Current Plan",
      tierId: 'free',
      popular: false
    },
    {
      name: "Pro",
      price: "$10",
      period: "/month",
      credits: 100,
      features: ["100 Credits / month", "Access to Gemini Pro 3.0", "Private Projects", "Priority Support", "Faster Generation"],
      cta: "Upgrade to Pro",
      tierId: 'pro',
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      credits: "Unlimited",
      features: ["Unlimited Generations", "Custom Models", "API Access", "Dedicated Support", "SLA"],
      cta: "Contact Sales",
      tierId: 'enterprise',
      popular: false
    }
  ];

  return (
    <div className="min-h-full bg-gray-50 pt-10 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-base font-semibold text-amber-600 tracking-wide uppercase">Pricing</h2>
          <p className="mt-2 text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
            Simple, transparent pricing
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            Choose the plan that best fits your needs. Start for free, upgrade when you're ready to scale.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-8">
            {plans.map((plan) => (
                <div key={plan.name} className={`relative p-8 bg-white border rounded-3xl shadow-sm flex flex-col ${plan.popular ? 'border-amber-500 ring-4 ring-amber-500/10 scale-105 z-10' : 'border-gray-200'}`}>
                    {plan.popular && (
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-white px-4 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-lg">
                            Most Popular
                        </div>
                    )}
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                        <p className="mt-4 flex items-baseline text-gray-900">
                            <span className="text-5xl font-extrabold tracking-tight">{plan.price}</span>
                            {plan.period && <span className="ml-1 text-xl font-medium text-gray-500">{plan.period}</span>}
                        </p>
                        <p className="mt-2 text-sm text-gray-500 font-medium">
                            {typeof plan.credits === 'number' ? `${plan.credits} credits / month` : plan.credits}
                        </p>
                    </div>
                    
                    <ul className="space-y-4 mb-8 flex-1">
                        {plan.features.map((feature) => (
                            <li key={feature} className="flex items-start">
                                <div className="flex-shrink-0">
                                    <CheckIcon className="h-6 w-6 text-green-500" />
                                </div>
                                <p className="ml-3 text-base text-gray-700">{feature}</p>
                            </li>
                        ))}
                    </ul>

                    <button
                        onClick={plan.tierId === 'free' ? () => onNavigate('dashboard') : onUpgrade}
                        disabled={currentTier === plan.tierId}
                        className={`w-full py-4 px-8 rounded-xl font-bold text-center transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1 ${
                            currentTier === plan.tierId 
                            ? 'bg-gray-100 text-gray-400 cursor-default shadow-none transform-none' 
                            : plan.popular 
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:to-orange-600' 
                                : 'bg-gray-900 text-white hover:bg-black'
                        }`}
                    >
                        {currentTier === plan.tierId ? "Current Plan" : plan.cta}
                    </button>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;