"use client";

import { PLANS } from "@/lib/data";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function PricingSection() {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState(null);

  const handlePlanClick = async (plan) => {
    const amount = plan.planId === "credit_1" ? 1 : plan.planId === "credit_3" ? 3 : 5;
    setLoadingPlan(plan.planId);
    try {
      const res = await fetch("/api/user/credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (res.status === 401) {
        toast.error("Please log in to purchase credits.");
        router.push("/login?nextUrl=/dashboard/interviewee");
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initiate checkout");

      if (data.url) {
        toast.info("Redirecting to Stripe Checkout...");
        window.location.href = data.url;
      } else {
        throw new Error("Checkout session URL not returned from server");
      }
    } catch (err) {
      toast.error(err.message);
      router.push("/dashboard/interviewee");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-white">
          Get More Credits
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl p-8 h-full flex flex-col transition-all duration-300 hover:-translate-y-1 ${plan.featured
                ? "bg-[#141417] border border-amber-400/40 shadow-lg shadow-amber-500/5"
                : "bg-[#0f0f11] border border-white/10 hover:border-amber-400/20"
              }`}
          >
            {/* Badge (e.g. POPULAR) */}
            {plan.badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-[#0a0a0b] text-xs font-bold tracking-wider uppercase px-3.5 py-1 rounded-full whitespace-nowrap">
                {plan.badge}
              </span>
            )}

            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <p className="text-xs text-stone-400 font-medium mt-0.5">
                  {plan.tagline}
                </p>
              </div>
              {plan.savings && (
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                  {plan.savings}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-1 my-4">
              <span
                className={`font-serif text-5xl leading-none tracking-tight ${plan.featured
                    ? "bg-linear-to-br from-amber-300 to-amber-500 bg-clip-text text-transparent"
                    : "bg-linear-to-br from-stone-100 to-stone-400 bg-clip-text text-transparent"
                  }`}
              >
                {plan.price}
              </span>
            </div>

            <p className="text-sm text-amber-400/90 mb-6 font-medium">
              {plan.credits}
            </p>

            <div className="h-px bg-white/10 mb-6" />

            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-sm text-stone-400"
                >
                  <span className="text-amber-400 text-xs mt-0.5">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handlePlanClick(plan)}
              disabled={loadingPlan !== null}
              className={`w-full py-2.5 rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${plan.featured
                  ? "bg-amber-400 text-amber-950 hover:bg-amber-500 font-semibold"
                  : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                }`}
            >
              {loadingPlan === plan.planId ? "Processing..." : `Buy ${plan.name}`}
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-md text-stone-500 max-w-lg mx-auto leading-relaxed">
        Credits do not expire. 1 credit is deducted when your interview call ends.
      </p>
    </div>
  );
}