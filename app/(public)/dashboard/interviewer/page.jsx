"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Calendar, Clock, Award, CheckCircle2, AlertCircle, Wallet, Send, TrendingUp, Video, Plus, RefreshCw, CreditCard, Sparkles, ChevronRight, ShieldCheck, Star, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function InterviewerDashboardContent() {
  const searchParams = useSearchParams();
  const feedbackBookingId = searchParams?.get("feedbackBookingId");

  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    creditBalance: 0,
    creditRate: 1,
    totalEarned: 0,
    completedSessions: 0,
  });
  const [availability, setAvailabilityState] = useState(null);
  const [availabilityForm, setAvailabilityForm] = useState({
    startTime: "",
    endTime: "",
  });
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);

  const [appointments, setAppointments] = useState([]);
  const [appointmentFilter, setAppointmentFilter] = useState("ALL");

  const [withdrawals, setWithdrawals] = useState([]);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    credits: "",
    paymentMethod: "UPI",
    paymentDetail: "",
  });
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);

  const [selectedApptToComplete, setSelectedApptToComplete] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({
    summary: "",
    technical: "",
    communication: "",
    problemSolving: "",
    recommendation: "",
    overallRating: "GOOD",
    score: 8,
  });
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const handleCompleteSession = async (e) => {
    e.preventDefault();
    if (!selectedApptToComplete) return;

    setIsSubmittingFeedback(true);
    try {
      const apptId = selectedApptToComplete.id || selectedApptToComplete._id;
      const res = await fetch(`/api/bookings/${apptId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedbackForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to complete session");

      toast.success(data.message || "Session completed! +1 Credit added to your balance.");
      setSelectedApptToComplete(null);
      loadDashboardData(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const loadDashboardData = async (showToast = false) => {
    setIsRefreshing(true);
    try {
      const [statsRes, availRes, apptsRes, historyRes] = await Promise.allSettled([
        fetch("/api/interviewer/stats").then((r) => r.json()),
        fetch("/api/interviewer/availability").then((r) => r.json()),
        fetch("/api/bookings").then((r) => r.json()),
        fetch("/api/interviewer/payouts").then((r) => r.json()),
      ]);

      if (statsRes.status === "fulfilled" && statsRes.value && !statsRes.value.error) {
        setStats(statsRes.value);
      }

      if (availRes.status === "fulfilled" && availRes.value && availRes.value.slots) {
        setAvailabilityState(availRes.value.slots);
      }

      if (apptsRes.status === "fulfilled" && apptsRes.value && apptsRes.value.bookings) {
        setAppointments(apptsRes.value.bookings);
      }

      if (historyRes.status === "fulfilled" && historyRes.value && historyRes.value.withdrawals) {
        setWithdrawals(historyRes.value.withdrawals);
      }

      if (showToast) {
        toast.success("Dashboard refreshed");
      }
    } catch (err) {
      console.error("Error loading dashboard:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (feedbackBookingId && appointments.length > 0) {
      const appt = appointments.find(
        (a) => (a.id === feedbackBookingId || a._id === feedbackBookingId) && !a.feedback
      );
      if (appt) {
        setSelectedApptToComplete(appt);
        setFeedbackForm({
          summary: `Completed 45-minute mock interview session with ${appt.interviewee?.name || 'candidate'}.`,
          technical: "Demonstrated solid technical competence and problem solving strategy.",
          communication: "Clear, structured, and effective communication throughout.",
          problemSolving: "Methodical approach to algorithm and system challenges.",
          recommendation: "Strong candidate for upcoming tech role interviews.",
          overallRating: "GOOD",
          score: 8,
        });
      }
    }
  }, [feedbackBookingId, appointments]);

  const handleSaveAvailability = async (e) => {
    e.preventDefault();
    if (!availabilityForm.startTime || !availabilityForm.endTime) {
      toast.error("Please select both start and end time");
      return;
    }
    if (new Date(availabilityForm.startTime) >= new Date(availabilityForm.endTime)) {
      toast.error("Start time must be strictly before end time");
      return;
    }

    setIsSavingAvailability(true);
    try {
      const res = await fetch("/api/interviewer/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: new Date(availabilityForm.startTime).toISOString(),
          endTime: new Date(availabilityForm.endTime).toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add availability slot");

      toast.success("Availability slot added!");
      if (data.slots) {
        setAvailabilityState(data.slots);
      } else {
        loadDashboardData();
      }
      setAvailabilityForm({ startTime: "", endTime: "" });
    } catch (err) {
      console.warn("setAvailability error:", err.message);
      toast.error(err.message || "Failed to add availability slot");
    } finally {
      setIsSavingAvailability(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      const res = await fetch(`/api/interviewer/availability?slotId=${slotId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete slot");

      toast.success("Availability slot removed");
      if (data.slots) {
        setAvailabilityState(data.slots);
      } else {
        setAvailabilityState((prev) =>
          Array.isArray(prev) ? prev.filter((s) => (s.id || s._id) !== slotId) : []
        );
      }
    } catch (err) {
      toast.error(err.message || "Failed to remove slot");
      setAvailabilityState((prev) =>
        Array.isArray(prev) ? prev.filter((s) => (s.id || s._id) !== slotId) : []
      );
    }
  };

  const applyAvailabilityPreset = (hoursFromNow, durationHours) => {
    const start = new Date(Date.now() + hoursFromNow * 3600000);
    const end = new Date(start.getTime() + durationHours * 3600000);

    const formatToLocalISO = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setAvailabilityForm({
      startTime: formatToLocalISO(start),
      endTime: formatToLocalISO(end),
    });
  };

  const handleOpenWithdrawModal = () => {
    setWithdrawForm((prev) => ({
      ...prev,
      paymentDetail: prev.paymentDetail || stats.upiId || "",
    }));
    setIsWithdrawModalOpen(true);
  };

  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault();
    const creditsToWithdraw = Number(withdrawForm.credits);

    if (!creditsToWithdraw || creditsToWithdraw <= 0) {
      toast.error("Enter a valid credit amount");
      return;
    }
    if (creditsToWithdraw > stats.creditBalance) {
      toast.error("Insufficient credit balance!");
      return;
    }
    if (!withdrawForm.paymentDetail.trim()) {
      toast.error("Please enter your payment details");
      return;
    }

    setIsSubmittingWithdrawal(true);
    try {
      const res = await fetch("/api/interviewer/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credits: creditsToWithdraw,
          paymentMethod: withdrawForm.paymentMethod,
          paymentDetail: withdrawForm.paymentDetail,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Withdrawal request failed");

      toast.success(`Withdrawal of ${creditsToWithdraw} credits submitted! Net amount: $${data.netAmount}`);
      setStats((prev) => ({
        ...prev,
        creditBalance: Math.max(0, prev.creditBalance - creditsToWithdraw),
      }));
      if (data.withdrawal) {
        setWithdrawals((prev) => [data.withdrawal, ...prev]);
      }
      setIsWithdrawModalOpen(false);
      setWithdrawForm({ credits: "", paymentMethod: "UPI", paymentDetail: "" });
    } catch (err) {
      toast.error(err.message || "Withdrawal request failed");
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };

  const filteredAppointments = appointments.filter((app) => {
    if (appointmentFilter === "ALL") return true;
    return app.status === appointmentFilter;
  });

  const upcomingAppts = appointments.filter(
    (a) => a.status === "SCHEDULED" && new Date(a.endTime).getTime() > Date.now()
  );

  const completedAppts = appointments.filter(
    (a) => a.status === "COMPLETED" || (a.status === "SCHEDULED" && new Date(a.endTime).getTime() <= Date.now())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 mt-12 p-4 sm:p-6 lg:p-10 font-sans selection:bg-indigo-500 selection:text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl shadow-2xl shadow-indigo-950/20">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
              Interviewer Dashboard
            </h1>
            <p className="text-slate-400 text-md">
              Manage your availability, view scheduled sessions, track performance, and request credit payouts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadDashboardData(true)}
              disabled={isRefreshing}
              className="p-3 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
              title="Refresh Dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-indigo-400" : "group-hover:rotate-180 transition-transform duration-500"}`} />
              <span className="text-sm font-medium hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-slate-900/90 to-indigo-950/40 border border-indigo-500/20 p-3 rounded-2xl shadow-xl relative overflow-hidden group hover:border-indigo-500/40 transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Wallet className="w-16 h-16 text-indigo-400" />
            </div>
            <div className="flex items-center justify-between text-indigo-400 mb-2">
              <span className="text-sm font-semibold uppercase tracking-wider">Available Balance</span>
              <span className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                <Wallet className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{stats.creditBalance}</span>
              <span className="text-sm text-indigo-300 font-medium">Credits</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900/90 to-emerald-950/40 border border-emerald-500/20 p-3 rounded-2xl shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="w-16 h-16 text-emerald-400" />
            </div>
            <div className="flex items-center justify-between text-emerald-400 mb-2">
              <span className="text-sm font-semibold uppercase tracking-wider">Total Earned</span>
              <span className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{stats.totalEarned}</span>
              <span className="text-sm text-emerald-300 font-medium">Credits</span>
            </div>
          </div>


          <div className="bg-gradient-to-br from-slate-900/90 to-purple-950/40 border border-purple-500/20 p-3 rounded-2xl shadow-xl relative overflow-hidden group hover:border-purple-500/40 transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Award className="w-16 h-16 text-purple-400" />
            </div>
            <div className="flex items-center justify-between text-purple-400 mb-2">
              <span className="text-sm font-semibold uppercase tracking-wider">Completed Sessions</span>
              <span className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
                <Award className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{stats.completedSessions}</span>
              <span className="text-sm text-purple-300 font-medium">Interviews</span>
            </div>
          </div>
        </div>


        <div className="flex border-b border-slate-800 space-x-2 sm:space-x-4 overflow-x-auto pb-1">
          {[
            { id: "overview", label: "Overview & Sessions", icon: Video },
            { id: "availability", label: "Manage Availability", icon: Calendar },
            { id: "earnings", label: "Payouts & History", icon: CreditCard },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-t-xl text-md sm:text-sm font-semibold whitespace-nowrap transition-all border-b-2 cursor-pointer ${isActive
                  ? "bg-slate-900 text-indigo-400 border-indigo-500 shadow-lg shadow-indigo-500/10"
                  : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/50"
                  }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Upcoming & Scheduled Sessions</h2>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Booked Sessions</h3>
                  {isLoading ? (
                    <div className="py-6 text-center text-slate-500">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-400" />
                    </div>
                  ) : upcomingAppts.length === 0 ? (
                    <div className="py-4 border border-dashed border-slate-800 rounded-2xl text-center">
                      <p className="text-sm text-slate-500">No upcoming candidate bookings currently.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingAppts.map((appt) => (
                        <div
                          key={appt._id || appt.id}
                          className="bg-slate-950/80 border border-slate-800 hover:border-indigo-500/40 p-5 rounded-2xl transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold overflow-hidden shrink-0 border border-indigo-400/30">
                              {appt.interviewee?.imageUrl ? (
                                <img
                                  src={appt.interviewee.imageUrl}
                                  alt={appt.interviewee.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                appt.interviewee?.name?.[0] || "C"
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-white group-hover:text-indigo-300 transition">
                                  {appt.interviewee?.name || "Interview Candidate"}
                                </h4>
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
                                  UPCOMING
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">{appt.interviewee?.email}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-slate-300">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                  {new Date(appt.startTime).toLocaleDateString("en-US", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                                  {new Date(appt.startTime).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                              +{appt.creditsCharged || 1} Credits
                            </span>
                            {(() => {
                              const isLinkActive = Date.now() >= new Date(appt.startTime).getTime() - 5 * 60 * 1000;
                              if (appt.streamCallId && isLinkActive) {
                                return (
                                  <Link
                                    href={`/call/${appt.streamCallId}`}
                                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition cursor-pointer"
                                  >
                                    <Video className="w-3.5 h-3.5" />
                                    <span>Join Call</span>
                                  </Link>
                                );
                              } else {
                                return (
                                  <button
                                    onClick={() => {
                                      if (!appt.streamCallId) {
                                        toast.error("Call has not been generated yet.");
                                      } else {
                                        toast.warning("The meeting link will be active 5 minutes before the scheduled time.");
                                      }
                                    }}
                                    className="px-3.5 py-2 bg-slate-800 text-slate-500 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-not-allowed"
                                  >
                                    <Video className="w-3.5 h-3.5" />
                                    <span>Join Call</span>
                                  </button>
                                );
                              }
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3 border-t border-slate-800 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Available / Configured Slots</h3>
                    <span className="text-xs text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                      {Array.isArray(availability) ? availability.length : availability ? 1 : 0} Slots
                    </span>
                  </div>

                  {Array.isArray(availability) && availability.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                      {availability.map((slot, index) => {
                        const slotId = slot.id || slot._id || `slot-${index}`;
                        const isBooked = slot.status === "BOOKED";
                        return (
                          <div
                            key={slotId}
                            className={`p-3.5 border rounded-2xl space-y-2 transition-all ${isBooked
                              ? "bg-indigo-950/20 border-indigo-500/20"
                              : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                              }`}
                          >
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-semibold text-slate-200">
                                {new Date(slot.startTime).toLocaleDateString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded ${isBooked
                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    }`}
                                >
                                  {slot.status || "AVAILABLE"}
                                </span>
                                {!isBooked && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSlot(slotId)}
                                    className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition cursor-pointer"
                                    title="Remove Slot"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="text-xs font-mono text-indigo-300">
                              {new Date(slot.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              {" - "}
                              {new Date(slot.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : !Array.isArray(availability) && availability?.startTime ? (
                    <div className="p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-indigo-400 font-bold">STATUS</span>
                        <span className="text-emerald-400 font-bold px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
                          {availability.status}
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Start</span>
                          <span className="text-white font-mono font-medium">
                            {new Date(availability.startTime).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">End</span>
                          <span className="text-white font-mono font-medium">
                            {new Date(availability.endTime).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-500 space-y-2 border border-dashed border-slate-800 rounded-2xl">
                      <Calendar className="w-6 h-6 text-slate-600 mx-auto" />
                      <p className="text-sm">No active slots defined yet</p>
                    </div>
                  )}
                </div>
              </div>


              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Recent Completed & Past Sessions</h2>
                  </div>
                </div>
                <div className="space-y-4">
                  {completedAppts
                    .slice(0, 5)
                    .map((appt) => {
                      const feedbackSubmitted = !!appt.feedback;
                      return (
                        <div
                          key={appt._id || appt.id}
                          className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-2xl space-y-3 w-[90%] mx-auto"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-md font-bold text-slate-300 overflow-hidden text-center leading-9">
                                {appt.interviewee?.imageUrl ? (
                                  <img src={appt.interviewee.imageUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  appt.interviewee?.name?.[0] || "C"
                                )}
                              </div>
                              <div>
                                <h4 className="text-md font-semibold text-white">{appt.interviewee?.name}</h4>
                                <p className="text-sm text-slate-400">
                                  {new Date(appt.startTime).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <span className={`text-sm font-bold px-2 py-1 rounded-lg border ${feedbackSubmitted
                              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                              : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                              }`}>
                              {feedbackSubmitted ? `+${appt.creditsCharged || 1} Credits` : "FEEDBACK REQUIRED"}
                            </span>
                          </div>

                          {!feedbackSubmitted && (
                            <button
                              onClick={() => {
                                setSelectedApptToComplete(appt);
                                setFeedbackForm({
                                  summary: `Completed 45-minute mock interview session with ${appt.interviewee?.name || 'candidate'}.`,
                                  technical: "Demonstrated solid technical competence and problem solving strategy.",
                                  communication: "Clear, structured, and effective communication throughout.",
                                  problemSolving: "Methodical approach to algorithm and system challenges.",
                                  recommendation: "Strong candidate for upcoming tech role interviews.",
                                  overallRating: "GOOD",
                                  score: 8,
                                });
                              }}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Give Feedback (+1 Credit)
                            </button>
                          )}

                          {appt.review && (
                            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                              <div className="flex items-center justify-between text-amber-400">
                                <span className="font-semibold flex items-center gap-1">
                                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                                  Rating: {appt.review.rating} / 5
                                </span>
                                <span className="text-[10px] text-slate-500">Candidate Review</span>
                              </div>
                              <p className="text-slate-300 italic">"{appt.review.reviewText}"</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Credit Payout</h3>
                    <p className="text-sm text-slate-400">Convert credits to cash ($5/credit)</p>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>Available Balance:</span>
                    <span className="font-bold text-white">{stats.creditBalance} Credits</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Platform Fee:</span>
                    <span className="text-amber-400 font-semibold">20%</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-2 text-slate-200 font-bold">
                    <span>Est. Payout Value:</span>
                    <span className="text-emerald-400 font-mono">${(stats.creditBalance * 4).toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleOpenWithdrawModal}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-md rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Request Cash Withdrawal</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "availability" && (
          <div className="max-w-3xl mx-auto bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                  Set Available Time Window
                </h2>
              </div>
            </div>

            <form onSubmit={handleSaveAvailability} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={availabilityForm.startTime}
                    onChange={(e) =>
                      setAvailabilityForm({ ...availabilityForm, startTime: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition font-mono"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={availabilityForm.endTime}
                    onChange={(e) =>
                      setAvailabilityForm({ ...availabilityForm, endTime: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition font-mono"
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={isSavingAvailability} className="w-[80%] mx-auto py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSavingAvailability ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />Saving Availability...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />Save Availability Schedule
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {activeTab === "earnings" && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                    Withdrawal & Payout History
                  </h2>
                </div>
                <button
                  onClick={handleOpenWithdrawModal}
                  className="px-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-md font-semibold rounded-xl flex items-center gap-2 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Withdrawal Request</span>
                </button>
              </div>

              {withdrawals.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <CreditCard className="w-10 h-10 text-slate-700 mx-auto" />
                  <p className="text-sm">No withdrawal history available yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-[90%] mx-auto text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Credits</th>
                        <th className="py-3 px-4">Platform Fee</th>
                        <th className="py-3 px-4">Net Payout</th>
                        <th className="py-3 px-4">Payment Method</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-sm">
                      {withdrawals.map((w) => (
                        <tr key={w.id} className="hover:bg-slate-950/50 transition">
                          <td className="py-3.5 px-4 font-mono text-slate-300">
                            {new Date(w.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-white">{w.credits} Cr</td>
                          <td className="py-3.5 px-4 text-amber-400 font-mono">
                            ${Number(w.platformFee).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-emerald-400 font-bold font-mono">
                            ${Number(w.netAmount).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">
                            <span className="font-semibold text-white block">{w.paymentMethod}</span>
                            <span className="text-[12px] text-slate-500 font-mono">{w.paymentDetail}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-md border ${w.status === "COMPLETED"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : w.status === "PROCESSING"
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                                  : "bg-red-500/10 text-red-400 border-red-500/20"
                                }`}
                            >
                              {w.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl shadow-emerald-950/30">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Request Withdrawal</h3>
                </div>
              </div>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <label className="font-semibold text-slate-300">Credits to Redeem</label>
                  <span className="text-slate-400">Balance: <strong className="text-white">{stats.creditBalance} Cr</strong></span>
                </div>
                <input
                  type="number"
                  min="1"
                  max={stats.creditBalance || 1000}
                  value={withdrawForm.credits}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, credits: e.target.value })}
                  placeholder="e.g. 50"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>

              {Number(withdrawForm.credits) > 0 && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Gross Value ($5/credit):</span>
                    <span>${(Number(withdrawForm.credits) * 5).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-amber-400">
                    <span>Platform Fee (20%):</span>
                    <span>-${(Number(withdrawForm.credits) * 5 * 0.2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold border-t border-slate-800 pt-1.5 text-sm">
                    <span>Estimated Net Payout:</span>
                    <span>${(Number(withdrawForm.credits) * 5 * 0.8).toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Payment Account / Details</label>
                <input
                  type="text"
                  value={withdrawForm.paymentDetail}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, paymentDetail: e.target.value })}
                  placeholder={
                    withdrawForm.paymentMethod === "UPI"
                      ? "e.g. user@okaxis"
                      : "Account No, IFSC or Email ID"
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsWithdrawModalOpen(false)} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmittingWithdrawal} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer">
                  {isSubmittingWithdrawal ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedApptToComplete && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111116] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full relative shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto text-slate-200">
            <button
              onClick={() => setSelectedApptToComplete(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">End Call & Submit Feedback</h3>
                <p className="text-sm text-slate-400">
                  Candidate: <span className="text-emerald-400 font-semibold">{selectedApptToComplete.interviewee?.name || "Candidate"}</span> · Transfers +1 Credit
                </p>
              </div>
            </div>

            <form onSubmit={handleCompleteSession} className="space-y-4">

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Overall Performance
                  </label>
                  <select
                    value={feedbackForm.overallRating}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, overallRating: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="EXCELLENT">EXCELLENT</option>
                    <option value="GOOD">GOOD</option>
                    <option value="AVERAGE">AVERAGE</option>
                    <option value="POOR">POOR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Score (1 to 10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={feedbackForm.score}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, score: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Technical Proficiency Evaluation
                </label>
                <input
                  type="text"
                  value={feedbackForm.technical}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, technical: e.target.value })}
                  placeholder="e.g. Strong understanding of React, state management, & API integration."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Communication Skills
                </label>
                <input
                  type="text"
                  value={feedbackForm.communication}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, communication: e.target.value })}
                  placeholder="e.g. Clear explanation of thought process and trade-offs."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Problem Solving & Logic
                </label>
                <input
                  type="text"
                  value={feedbackForm.problemSolving}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, problemSolving: e.target.value })}
                  placeholder="e.g. Structured step-by-step problem breakdown."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Detailed Feedback Summary
                </label>
                <textarea
                  rows={3}
                  value={feedbackForm.summary}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, summary: e.target.value })}
                  placeholder="Comprehensive feedback notes for the candidate..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Final Recommendation
                </label>
                <input
                  type="text"
                  value={feedbackForm.recommendation}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, recommendation: e.target.value })}
                  placeholder="e.g. Strong Hire for Senior Frontend Developer"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-300">
                <span>Credit reward:</span>
                <span className="font-bold">+1 Credit to your Interviewer Balance</span>
              </div>

              <button
                type="submit"
                disabled={isSubmittingFeedback}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmittingFeedback ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Completing Session...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} /> Submit Feedback & Transfer Credit
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InterviewerDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-slate-400 text-sm">Loading dashboard...</p>
          </div>
        </div>
      }
    >
      <InterviewerDashboardContent />
    </Suspense>
  );
}