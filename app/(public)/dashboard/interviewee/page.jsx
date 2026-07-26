"use client";

import { useState, useEffect, Suspense } from "react";
import { Calendar, Clock, Sparkles, CreditCard, Plus, Video, CheckCircle2, AlertCircle, MessageSquare, Award, TrendingUp, User, FileText, Camera, Star, X, ArrowRight, RefreshCw, ExternalLink, Zap } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function IntervieweeDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reviewBookingId = searchParams?.get("reviewBookingId");
  const paymentSuccess = searchParams?.get("success");
  const paymentCancelled = searchParams?.get("cancelled");
  const sessionId = searchParams?.get("session_id");
  const [activeTab, setActiveTab] = useState("sessions");
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [credits, setCredits] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [interviewers, setInterviewers] = useState([]);

  const [isBuyCreditsOpen, setIsBuyCreditsOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [isSubmittingBuy, setIsSubmittingBuy] = useState(false);
  const [isSubmittingBook, setIsSubmittingBook] = useState(false);

  const [bookingForm, setBookingForm] = useState({
    interviewerId: "",
    topic: "Full Stack Mock Interview",
    date: "",
    time: "10:00",
  });

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    reviewText: "",
  });

  const handleLeaveReview = async (e) => {
    e.preventDefault();
    if (!selectedBookingForReview) return;

    if (!reviewForm.reviewText.trim()) {
      toast.error("Please enter review feedback.");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/bookings/${selectedBookingForReview._id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: reviewForm.rating,
          reviewText: reviewForm.reviewText,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit review");

      toast.success("Thank you for your feedback! Review submitted successfully.");
      setIsReviewModalOpen(false);
      setReviewForm({ rating: 5, reviewText: "" });
      loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const userRes = await fetch("/api/user/check");
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
      }

      const creditsRes = await fetch("/api/user/credits");
      if (creditsRes.ok) {
        const credData = await creditsRes.json();
        setCredits(credData.credits || 0);
        setTransactions(credData.transactions || []);
      }

      const bookingsRes = await fetch("/api/bookings");
      if (bookingsRes.ok) {
        const bookData = await bookingsRes.json();
        setBookings(bookData.bookings || []);
      }

      const interviewersRes = await fetch("/api/interviewers");
      if (interviewersRes.ok) {
        const intData = await interviewersRes.json();
        const list = intData.interviewers || intData || [];
        setInterviewers(list);
        if (list.length > 0) {
          setBookingForm((prev) => ({ ...prev, interviewerId: list[0]._id }));
        }
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (reviewBookingId && bookings.length > 0) {
      const targetBooking = bookings.find(
        (b) => (b._id === reviewBookingId || b.id === reviewBookingId) && !b.review
      );
      if (targetBooking) {
        setSelectedBookingForReview(targetBooking);
        setIsReviewModalOpen(true);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, [reviewBookingId, bookings]);

  useEffect(() => {
    const verifyPayment = async () => {
      if (paymentSuccess === "true" && sessionId) {
        const toastId = toast.loading("Verifying payment and updating credits...");
        try {
          const res = await fetch("/api/user/credits/verify-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          });
          const data = await res.json();
          toast.dismiss(toastId);
          if (res.ok && data.success) {
            toast.success(data.message || "Payment completed successfully! Credits added to your balance.");
          } else {
            toast.error(data.error || "Payment verification failed.");
          }
        } catch (err) {
          toast.dismiss(toastId);
          toast.error("Failed to verify payment: " + err.message);
        } finally {
          const newUrl = window.location.pathname;
          window.history.replaceState({}, "", newUrl);
          loadData();
        }
      } else if (paymentSuccess === "true") {
        toast.success("Payment completed successfully! Credits added to your balance.");
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
        loadData();
      } else if (paymentCancelled === "true") {
        toast.error("Payment was cancelled. Feel free to try again.");
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
    };

    verifyPayment();
  }, [paymentSuccess, paymentCancelled, sessionId]);

  const handleBuyCredits = async (amount) => {
    setIsSubmittingBuy(true);
    try {
      const res = await fetch("/api/user/credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initiate payment");

      if (data.url) {
        toast.info("Redirecting to Stripe Checkout...");
        window.location.href = data.url;
      } else {
        throw new Error("Checkout session URL not returned from server");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmittingBuy(false);
    }
  };

  const upcomingSessions = bookings.filter((b) => {
    const isScheduled = b.status === "SCHEDULED";
    const isFuture = new Date(b.endTime).getTime() > Date.now();
    return isScheduled && isFuture;
  });

  const completedSessions = bookings.filter((b) => {
    const isCompleted = b.status === "COMPLETED";
    const isExpiredScheduled = b.status === "SCHEDULED" && new Date(b.endTime).getTime() <= Date.now();
    return isCompleted || isExpiredScheduled;
  });

  const feedbacksReceived = bookings.filter((b) => b.feedback);

  return (
    <div className="min-h-screen bg-[#09090b] text-stone-200 py-8 px-4 sm:px-6 lg:px-12 font-sans selection:bg-amber-400/30 selection:text-amber-200 mt-14">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        <div className="relative overflow-hidden bg-gradient-to-r from-[#17171c] via-[#1c1c23] to-[#141418] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                {user ? user.firstName || "Candidate" : "Candidate Dashboard"}
              </h1>
              <p className="text-stone-400 text-sm sm:text-base mt-1 max-w-xl">
                Book mock interview sessions with top engineers, manage your session credits, and track performance feedback.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={() => setIsBuyCreditsOpen(true)}
                className="bg-amber-400 hover:bg-amber-300 text-amber-950 font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-400/20 flex items-center gap-2 text-md cursor-pointer"
              >
                <Plus size={18} /> Get More Credits
              </button>
              <button onClick={() => { router.push('/browseinterviewers') }}
                className="bg-stone-800 hover:bg-stone-700 text-stone-100 font-semibold px-4 py-2.5 rounded-xl transition-all border border-white/10 flex items-center gap-2 text-md cursor-pointer"
              >
                <Calendar size={18} className="text-amber-400" /> Book Interview Call
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/10 relative z-10">
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-stone-400 text-sm font-medium mb-1">
                <span>Available Credits</span>
                <Sparkles size={16} className="text-amber-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-400">{credits}</span>
                <span className="text-sm text-stone-400">credits</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-stone-400 text-sm font-medium mb-1">
                <span>Upcoming Calls</span>
                <Clock size={16} className="text-blue-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{upcomingSessions.length}</span>
                <span className="text-sm text-stone-400">scheduled</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-stone-400 text-sm font-medium mb-1">
                <span>Completed Sessions</span>
                <CheckCircle2 size={16} className="text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{completedSessions.length}</span>
                <span className="text-sm text-stone-400">interviews</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-stone-400 text-sm font-medium mb-1">
                <span>Feedbacks Received</span>
                <MessageSquare size={16} className="text-purple-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{feedbacksReceived.length}</span>
                <span className="text-sm text-stone-400">reviews</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab("sessions")}
                className={`px-4 py-2.5 rounded-xl text-md font-medium transition-all flex items-center gap-2 shrink-0 ${activeTab === "sessions"
                  ? "bg-amber-400 text-amber-950 font-semibold shadow-md shadow-amber-400/10"
                  : "text-stone-400 hover:text-stone-200 hover:bg-white/5"
                  }`}
              >
                <Calendar size={16} /> My Sessions ({bookings.length})
              </button>
              {/* 
              <button
                onClick={() => setActiveTab("feedback")}
                className={`px-4 py-2.5 rounded-xl text-md font-medium transition-all flex items-center gap-2 shrink-0 ${activeTab === "feedback"
                  ? "bg-amber-400 text-amber-950 font-semibold shadow-md shadow-amber-400/10"
                  : "text-stone-400 hover:text-stone-200 hover:bg-white/5"
                  }`}
              >
                <Award size={16} /> Performance Feedback ({feedbacksReceived.length})
              </button>
               */}
              <button
                onClick={() => setActiveTab("credits")}
                className={`px-4 py-2.5 rounded-xl text-md font-medium transition-all flex items-center gap-2 shrink-0 ${activeTab === "credits"
                  ? "bg-amber-400 text-amber-950 font-semibold shadow-md shadow-amber-400/10"
                  : "text-stone-400 hover:text-stone-200 hover:bg-white/5"
                  }`}
              >
                <CreditCard size={16} /> Credit History ({transactions.length})
              </button>
            </div>

            <button onClick={loadData} disabled={isLoading} className="p-3 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
              title="Refresh Dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-400" : "group-hover:rotate-180 transition-transform duration-500"}`} />
              <span className="text-sm font-medium hidden sm:inline">Refresh</span>
            </button>
          </div>

          {activeTab === "sessions" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Clock size={18} className="text-amber-400" /> Upcoming Interview Calls
                </h2>
                {upcomingSessions.length === 0 ? (
                  <div className="bg-[#141418] border border-white/5 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3">
                    <Calendar size={36} className="text-stone-600" />
                    <p className="text-stone-400 text-md">You have no upcoming interview calls scheduled.</p>

                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcomingSessions.map((item) => (
                      <div
                        key={item._id}
                        className="bg-[#141418] border border-white/10 hover:border-amber-400/30 rounded-2xl p-4 sm:p-5 transition-all flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              SCHEDULED
                            </span>
                            <span className="text-[10px] text-stone-400 flex items-center gap-1">
                              <Sparkles size={11} className="text-amber-400" /> 1 Credit
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-white mb-1 truncate" title={item.topic || "Mock Interview"}>{item.topic || "Mock Interview"}</h3>
                          <p className="text-[11px] text-stone-400 flex items-center gap-1.5 mb-3">
                            <User size={12} className="text-amber-400" /> Interviewer:{" "}
                            <span className="text-stone-200 font-medium truncate max-w-[150px]" title={item.interviewerId?.firstName || "Senior Engineer"}>
                              {item.interviewerId?.firstName || "Senior Engineer"}
                              {item.interviewerId?.company ? ` (${item.interviewerId.company})` : ""}
                            </span>
                          </p>

                          <div className="bg-white/5 rounded-xl p-2.5 flex items-center justify-between text-[11px] text-stone-300 mb-2">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={12} className="text-stone-400" />
                              <span>{new Date(item.startTime).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock size={12} className="text-stone-400" />
                              <span>
                                {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {(() => {
                          const isLinkActive = Date.now() >= new Date(item.startTime).getTime() - 5 * 60 * 1000;
                          if (item.streamCallId && isLinkActive) {
                            return (
                              <Link href={`/call/${item.streamCallId}`}
                                className="w-full bg-amber-400 hover:bg-amber-300 text-amber-950 font-semibold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                              >
                                <Video size={14} /> Join Interview Call <ExternalLink size={12} />
                              </Link>
                            );
                          } else if (item.streamCallId) {
                            return (
                              <button
                                onClick={() => toast.warning("The meeting link will be active 5 minutes before the scheduled time.")}
                                className="w-full bg-stone-800 text-stone-500 font-semibold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-not-allowed border border-white/5"
                              >
                                <Video size={14} /> Join Interview Call <ExternalLink size={12} />
                              </button>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-400" /> Previous Sessions & Feedback
                </h2>
                {completedSessions.length === 0 ? (
                  <div className="bg-[#141418] border border-white/5 rounded-2xl p-8 text-center text-stone-400 text-sm">
                    No completed sessions yet. Once your interview call ends, interviewer feedback will appear here.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {completedSessions.map((item) => (
                      <div
                        key={item._id}
                        className="bg-[#141418] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            {item.status === "COMPLETED" ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                COMPLETED
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                PAST / EXPIRED
                              </span>
                            )}
                            <span className="text-sm text-stone-400">
                              {new Date(item.startTime).toLocaleDateString()}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-white mb-1 truncate" title={item.topic || "Mock Interview"}>{item.topic || "Mock Interview"}</h3>
                          <p className="text-md text-stone-400 flex items-center gap-1.5 mb-3">
                            <User size={12} className="text-amber-400" /> Interviewer:{" "}
                            <span className="text-stone-200 font-medium truncate" title={item.interviewerId?.firstName || "Interviewer"}>
                              {item.interviewerId?.firstName || "Interviewer"}
                            </span>
                          </p>

                          {item.feedback ? (
                            <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-2.5 mb-2">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                                  <Star size={12} className="fill-amber-400" /> Feedback: {item.feedback.overallRating || "GOOD"}
                                </span>
                              </div>
                              <p className="text-xs text-stone-300 line-clamp-2">
                                {item.feedback.summary || "Great interview session with solid communication."}
                              </p>
                            </div>
                          ) : (
                            <div className="bg-stone-800/50 border border-stone-700/50 rounded-xl p-2 text-sm text-stone-400 flex items-center gap-1.5 mb-2">
                              <AlertCircle size={12} className="text-amber-400 shrink-0" />
                              Feedback pending from interviewer.
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-1.5 mt-1.5">
                          {item.recordingUrl ? (
                            <a href={item.recordingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold py-2 px-4 rounded-xl text-sm  flex items-center justify-center gap-1.5 transition-all border border-white/10"
                            >
                              <Camera size={14} className="text-amber-400" /> Watch Recording
                            </a>
                          ) : (
                            <button
                              onClick={() => toast.info("Recording is being processed or was not enabled for this session.")}
                              className="w-full bg-stone-900/50 text-stone-500 font-medium py-2 px-4 rounded-xl text-sm flex items-center justify-center gap-1.5 border border-white/5 cursor-pointer hover:bg-stone-900 transition-all"
                            >
                              <Camera size={14} /> Watch Recording (Pending/Unavailable)
                            </button>
                          )}

                          {item.feedback ? (
                            <button
                              onClick={() => setSelectedFeedback(item.feedback)}
                              className="w-full bg-amber-400 hover:bg-amber-300 text-amber-950 font-semibold py-2 px-4 rounded-xl text-sm flex items-center justify-center gap-1.5 transition-all mt-1"
                            >
                              <FileText size={14} className="fill-amber-950 text-amber-950" /> Read Feedback & Improvements
                            </button>
                          ) : (
                            <button
                              onClick={() => toast.info("Feedback is pending from the interviewer. Once submitted, you can view your areas for improvement here.")}
                              className="w-full bg-stone-800/80 text-stone-400 mt-1 font-semibold py-2 px-4 rounded-xl text-sm flex items-center justify-center gap-1.5 transition-all border border-white/5 cursor-pointer hover:bg-stone-800"
                            >
                              <FileText size={14} /> Read Feedback & Improvements (Pending)
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* {activeTab === "feedback" && (
            <div className="flex flex-col gap-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Award size={18} className="text-purple-400" /> Interviewer Feedback Reviews
              </h2>

              {feedbacksReceived.length === 0 ? (
                <div className="bg-[#141418] border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
                  <Award size={40} className="text-stone-600" />
                  <p className="text-stone-400 text-sm">No feedback reviews available yet.</p>
                  <p className="text-xs text-stone-500">Book an interview call and complete the session to receive detailed feedback from your interviewer.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {feedbacksReceived.map((item) => {
                    const fb = item.feedback;
                    return (
                      <div
                        key={item._id}
                        className="bg-[#141418] border border-white/10 rounded-2xl p-6 flex flex-col gap-6"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                          <div>
                            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 mb-2 inline-block">
                              {fb.overallRating || "GOOD"} PERFORMANCE
                            </span>
                            <h3 className="text-xl font-bold text-white">{item.topic || "Mock Interview Session"}</h3>
                            <p className="text-xs text-stone-400 mt-1">
                              Interviewer: <span className="text-stone-200 font-medium">{item.interviewerId?.firstName || "Senior Engineer"}</span> · Date: {new Date(item.startTime).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5 shrink-0 w-fit">
                            <Star size={18} className="text-amber-400 fill-amber-400" />
                            <span className="text-lg font-bold text-white">{fb.score || 8}</span>
                            <span className="text-xs text-stone-400">/ 10</span>
                          </div>
                        </div>


                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Technical Skills</h4>
                            <p className="text-sm text-stone-200">{fb.technical || "N/A"}</p>
                          </div>
                          <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Communication</h4>
                            <p className="text-sm text-stone-200">{fb.communication || "N/A"}</p>
                          </div>
                          <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Problem Solving</h4>
                            <p className="text-sm text-stone-200">{fb.problemSolving || "N/A"}</p>
                          </div>
                        </div>


                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-xl">
                            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <CheckCircle2 size={14} /> Key Strengths
                            </h4>
                            <ul className="list-disc list-inside text-xs text-stone-300 space-y-1">
                              {(fb.strengths && fb.strengths.length > 0 ? fb.strengths : ["Clear articulation of code", "Structured problem-solving"]).map((st, i) => (
                                <li key={i}>{st}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-amber-950/20 border border-amber-500/20 p-4 rounded-xl">
                            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <TrendingUp size={14} /> Areas for Improvement
                            </h4>
                            <ul className="list-disc list-inside text-xs text-stone-300 space-y-1">
                              {(fb.improvements && fb.improvements.length > 0 ? fb.improvements : ["Deepen system scalability knowledge", "Optimize edge case handling"]).map((imp, i) => (
                                <li key={i}>{imp}</li>
                              ))}
                            </ul>
                          </div>
                        </div>


                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-2">
                          <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Interviewer Recommendation & Summary</h4>
                          <p className="text-xs text-stone-300 leading-relaxed">{fb.summary}</p>
                          {fb.recommendation && (
                            <p className="text-xs text-amber-400 font-medium pt-2 border-t border-white/5">
                              Recommendation: {fb.recommendation}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )} */}

          {activeTab === "credits" && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <CreditCard size={18} className="text-amber-400" /> Credit Balance & Transactions
                </h2>
              </div>

              {transactions.length === 0 ? (
                <div className="bg-[#141418] border border-white/5 rounded-2xl p-8 text-center text-stone-400 text-md">
                  No credit transactions logged yet. Starting credits (5) were allocated upon registration.
                </div>
              ) : (
                <div className="bg-[#141418] border border-white/10 rounded-2xl overflow-hidden">
                  <div className="divide-y divide-white/10">
                    {transactions.map((tx) => (
                      <div key={tx._id} className="p-4 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${tx.amount > 0 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}>
                            <CreditCard size={16} />
                          </div>

                          <div>
                            <p className="font-semibold text-white">
                              {tx.type === "CREDIT_PURCHASE" ? "Credit Top-Up / Purchase" : tx.type === "BOOKING_DEDUCTION" ? "Interview Session Charge" : tx.type === "WELCOME_BONUS" ? "Welcome Bonus" : tx.type}
                            </p>

                            <p className="text-xs text-stone-400">
                              {new Date(tx.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <span className={`font-bold text-base ${tx.amount > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {tx.amount > 0 ? `+${tx.amount}` : tx.amount} credit{Math.abs(tx.amount) > 1 ? "s" : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isBuyCreditsOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151519] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsBuyCreditsOpen(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-200 p-1 rounded-lg hover:bg-white/5"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Get More Credits</h3>
                <p className="text-sm text-stone-400">1 Credit = 1 Mock Interview Session</p>
              </div>
            </div>

            <div className="my-6 space-y-3">
              <div
                onClick={() => handleBuyCredits(1)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/50 p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-white text-base">1 Credit</h4>
                  <p className="text-xs text-stone-400">Single Session Pass</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-amber-400">$10</span>
                  <p className="text-[10px] text-stone-500">Instant add</p>
                </div>
              </div>

              <div
                onClick={() => handleBuyCredits(3)}
                className="bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between relative overflow-hidden"
              >
                <span className="absolute top-0 right-0 bg-amber-400 text-amber-950 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                  POPULAR
                </span>
                <div>
                  <h4 className="font-bold text-white text-base">3 Credits</h4>
                  <p className="text-xs text-stone-300">3 Full Mock Sessions</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-amber-400">$25</span>
                  <p className="text-[10px] text-amber-400/80">Save $5</p>
                </div>
              </div>

              <div
                onClick={() => handleBuyCredits(5)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/50 p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-white text-base">5 Credits</h4>
                  <p className="text-xs text-stone-400">Pro Prep Bundle</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-amber-400">$40</span>
                  <p className="text-[10px] text-stone-500">Save $10</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedFeedback && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151519] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-2xl w-full relative shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedFeedback(null)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-200 p-1 rounded-lg hover:bg-white/5"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                <Award size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Interview Feedback Report</h3>
                <p className="text-xs text-stone-400">Detailed performance evaluation by your interviewer</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                <div>
                  <span className="text-xs text-stone-400 font-medium uppercase tracking-wider">Overall Grade</span>
                  <h4 className="text-xl font-bold text-amber-400">{selectedFeedback.overallRating || "GOOD"}</h4>
                </div>
                <div className="text-right">
                  <span className="text-xs text-stone-400 font-medium uppercase tracking-wider">Score</span>
                  <h4 className="text-2xl font-extrabold text-white">{selectedFeedback.score || 8} / 10</h4>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Core Skill Evaluation</h4>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2 text-xs">
                  <p><strong className="text-stone-300">Technical Proficiency:</strong> {selectedFeedback.technical}</p>
                  <p><strong className="text-stone-300">Communication Skills:</strong> {selectedFeedback.communication}</p>
                  <p><strong className="text-stone-300">Problem Solving:</strong> {selectedFeedback.problemSolving}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-xl">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Key Strengths</h4>
                  <ul className="list-disc list-inside text-xs text-stone-300 space-y-1">
                    {(selectedFeedback.strengths || ["Great communication"]).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-amber-950/20 border border-amber-500/20 p-4 rounded-xl">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Areas of Growth</h4>
                  <ul className="list-disc list-inside text-xs text-stone-300 space-y-1">
                    {(selectedFeedback.improvements || ["System design depth"]).map((imp, i) => (
                      <li key={i}>{imp}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Detailed Summary</h4>
                <p className="text-xs text-stone-300 leading-relaxed">{selectedFeedback.summary}</p>
                {selectedFeedback.recommendation && (
                  <p className="text-xs text-amber-400 font-semibold mt-3 pt-2 border-t border-white/5">
                    Recommendation: {selectedFeedback.recommendation}
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {isReviewModalOpen && selectedBookingForReview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151519] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setIsReviewModalOpen(false);
                setReviewForm({ rating: 5, reviewText: "" });
              }}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-200 p-1 rounded-lg hover:bg-white/5"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                <Star size={20} className="fill-amber-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Review Interviewer</h3>
                <p className="text-xs text-stone-400">
                  Interviewer: {selectedBookingForReview.interviewerId?.firstName || "Senior Engineer"}
                </p>
              </div>
            </div>

            <form onSubmit={handleLeaveReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                  Rating (1-5 stars)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm((prev) => ({ ...prev, rating: star }))}
                      className="text-2xl transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        size={28}
                        className={star <= reviewForm.rating ? "text-amber-400 fill-amber-400" : "text-stone-600"}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                  Review Details
                </label>
                <textarea
                  value={reviewForm.reviewText}
                  onChange={(e) => setReviewForm((prev) => ({ ...prev, reviewText: e.target.value }))}
                  placeholder="Share your experience with this interviewer... How was their feedback, explanations, and advice?"
                  rows={4}
                  className="w-full bg-[#1c1c22] border border-white/10 rounded-xl px-4 py-3 text-sm text-stone-200 focus:outline-none focus:border-amber-400 resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingReview ? "Submitting..." : "Submit Review"} <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function IntervieweeDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09090b] text-stone-200 flex items-center justify-center font-sans">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-stone-400 text-sm">Loading dashboard...</p>
          </div>
        </div>
      }
    >
      <IntervieweeDashboardContent />
    </Suspense>
  );
}