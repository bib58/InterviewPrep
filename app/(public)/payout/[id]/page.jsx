"use client";

import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, Clock, Copy, Check, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function PayoutReviewPage({ params }) {
  const resolvedParams = React.use(params);
  const id = resolvedParams?.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [payout, setPayout] = useState(null);
  const [interviewer, setInterviewer] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    const fetchPayoutDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/payouts/${id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load payout details");
        }

        setPayout(data.payout);
        setInterviewer(data.interviewer);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPayoutDetails();
  }, [id]);

  const handleCopy = () => {
    if (!payout?.paymentDetail) return;
    navigator.clipboard.writeText(payout.paymentDetail);
    setCopied(true);
    toast.success("UPI ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleComplete = async () => {
    try {
      setUpdating(true);
      const res = await fetch(`/api/payouts/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to complete payout");
      }

      setPayout(prev => ({
        ...prev,
        status: "COMPLETED",
        processedAt: new Date().toISOString()
      }));
      toast.success("Payout request marked as completed successfully!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-stone-200">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
        <p className="text-md text-stone-400">Loading payout details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-stone-200 p-4">
        <div className="bg-red-500/10 border border-red-500/20 max-w-md rounded-2xl p-6 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Error Loading Payout</h2>
          <p className="text-sm text-stone-400">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-stone-850 text-md hover:bg-stone-800 text-xs font-semibold rounded-xl border border-white/10 transition"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-stone-200 py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-amber-400/30 selection:text-amber-200">
      <div className="max-w-3xl mx-auto space-y-8 mt-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-stone-400 hover:text-white transition text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <span className="text-xs text-stone-500 font-mono">ID: {payout?._id}</span>
        </div>
        <div className="border-b border-white/5 pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-amber-500" />
            Payout Request Review
          </h1>
          <p className="text-stone-400 text-xs sm:text-sm mt-1">
            Review the interviewer's withdrawal request and process the transaction.
          </p>
        </div>

        <div className="bg-[#141418] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
            <div>
              <span className="text-[12px] text-stone-500 uppercase tracking-widest block font-bold">Net Payout Amount</span>
              <span className="text-4xl font-extrabold text-white font-mono mt-1 block">
                ${Number(payout?.netAmount || 0).toFixed(2)}
              </span>
            </div>

            {payout?.status === "COMPLETED" ? (
              <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                COMPLETED
              </span>
            ) : (
              <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5 animate-pulse">
                <Clock className="w-3.5 h-3.5" />
                PROCESSING
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Transaction Info</h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-400 text-md">Credits Requested</span>
                  <span className="font-semibold text-white text-md">{payout?.credits} Cr</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-400 text-md">Platform Fee (20%)</span>
                  <span className="font-mono text-stone-400 text-md">-${Number(payout?.platformFee || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2">
                  <span className="text-stone-400 text-md">Payment Method</span>
                  <span className="font-semibold text-white text-md">{payout?.paymentMethod}</span>
                </div>

                <div className="bg-stone-900/50 border border-white/5 rounded-xl p-3 mt-4 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] text-stone-500 uppercase tracking-wider font-bold">UPI ID</span>
                    <button
                      onClick={handleCopy}
                      className="text-stone-400 hover:text-white transition flex items-center gap-1 text-[10px]"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="text-md font-semibold text-white font-mono truncate">{payout?.paymentDetail}</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider">Interviewer Profile</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-400">Name</span>
                  <span className="font-semibold text-white">{interviewer?.firstName || "Unknown"}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-400">Email</span>
                  <span className="font-semibold text-white truncate max-w-[180px]" title={interviewer?.emailId}>{interviewer?.emailId || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-400">Title / Company</span>
                  <span className="font-semibold text-white text-right">
                    {interviewer?.title ? `${interviewer.title} at ${interviewer.company || 'N/A'}` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2">
                  <span className="text-stone-400">Requested At</span>
                  <span className="font-mono text-stone-300 text-right">
                    {payout?.createdAt ? new Date(payout.createdAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
                {payout?.status === "COMPLETED" && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-400">Completed At</span>
                    <span className="font-mono text-emerald-400 text-right">
                      {payout?.processedAt ? new Date(payout.processedAt).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 mt-8">
            {payout?.status === "PROCESSING" ? (
              <button
                onClick={handleComplete}
                disabled={updating}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold py-3.5 px-6 rounded-2xl transition shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2 text-md cursor-pointer"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing transaction...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark Payout as Completed</span>
                  </>
                )}
              </button>
            ) : (
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 text-center text-emerald-400 text-md flex items-center justify-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                This withdrawal request has been completed and marked as processed.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
