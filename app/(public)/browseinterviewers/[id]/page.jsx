"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Building2, Clock, ChevronLeft, Calendar, ArrowRight, X, Sparkles, AlertCircle, Star } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { GravityStarsBackground } from "@/components/animate-ui/components/backgrounds/gravity-stars";

export default function InterviewerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [interviewer, setInterviewer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [slots, setSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isSubmittingBook, setIsSubmittingBook] = useState(false);
  const [bookingTopic, setBookingTopic] = useState("");

  useEffect(() => {
    const fetchInterviewerAndSlots = async () => {
      try {
        const res = await fetch(`/api/interviewers/${params.id}`);
        if (!res.ok) {
          throw new Error("Interviewer not found");
        }
        const data = await res.json();
        const mapped = {
          ...data.interviewer,
          name: data.interviewer.firstName + (data.interviewer.lastName ? ` ${data.interviewer.lastName}` : "")
        };
        setInterviewer(mapped);

        if (mapped.categories && mapped.categories.length > 0) {
          setBookingTopic(mapped.categories[0]);
        } else {
          setBookingTopic("Full Stack Mock Interview");
        }

        setIsLoadingSlots(true);
        const availRes = await fetch(`/api/interviewers/${params.id}/availability`);
        if (availRes.ok) {
          const availData = await availRes.json();
          const fetchedSlots = availData.slots || [];
          setSlots(fetchedSlots);

          if (fetchedSlots.length > 0) {
            const firstDateKey = new Date(fetchedSlots[0].startTime).toDateString();
            setSelectedDateKey(firstDateKey);
            setSelectedSlot(fetchedSlots[0]);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        setIsLoadingSlots(false);
      }
    };

    if (params?.id) {
      fetchInterviewerAndSlots();
    }
  }, [params.id]);

  const slotsByDate = slots.reduce((acc, slot) => {
    const dateKey = new Date(slot.startTime).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(slot);
    return acc;
  }, {});

  const availableDates = Object.keys(slotsByDate);

  const handleDateSelect = (dateKey) => {
    setSelectedDateKey(dateKey);
    const dateSlots = slotsByDate[dateKey] || [];
    if (dateSlots.length > 0) {
      setSelectedSlot(dateSlots[0]);
    } else {
      setSelectedSlot(null);
    }
  };

  const handleBookInterview = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      toast.error("Please select an available date and time slot.");
      return;
    }

    setIsSubmittingBook(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewerId: interviewer._id,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          slotId: selectedSlot._id,
          topic: bookingTopic || "Mock Interview Call",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");

      toast.success("Interview session booked! Redirecting to your dashboard...");
      setIsBookModalOpen(false);

      const availRes = await fetch(`/api/interviewers/${params.id}/availability`);
      if (availRes.ok) {
        const availData = await availRes.json();
        setSlots(availData.slots || []);
      }

      setTimeout(() => {
        router.push("/dashboard/interviewee");
      }, 1200);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmittingBook(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex justify-center items-center">
        <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !interviewer) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col justify-center items-center gap-4 text-stone-300 font-sans">
        <p>{error || "Interviewer not found."}</p>
        <button
          onClick={() => router.push('/browseinterviewers')}
          className="text-amber-400 hover:text-amber-300 text-sm flex items-center gap-2"
        >
          <ChevronLeft size={16} /> Go back
        </button>
      </div>
    );
  }

  const initial = (interviewer.firstName || interviewer.name || "?").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#09090b] text-stone-200 py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-amber-400/30 selection:text-amber-200 mt-10">
      <Link href="/browseinterviewers" className="w-fit flex items-center gap-1 text-md mb-[6px] text-stone-500 hover:text-stone-300 transition-colors"><ChevronLeft size={16} />Back to Interviewers
      </Link>

      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <GravityStarsBackground
          starsCount={80}
          starsSize={2}
          starsOpacity={0.8}
          movementSpeed={0.3}
          mouseInfluence={120}
          mouseGravity="attract"
          gravityStrength={60}
          className="border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative !bg-[#151518] text-amber-400"
        >
          <div className="h-32 bg-gradient-to-r from-amber-500/10 via-amber-700/5 to-transparent absolute top-0 left-0 right-0 pointer-events-none" />
          <div className="px-6 py-8 sm:px-10 sm:py-12 relative z-10 flex flex-col md:flex-row gap-8 sm:gap-12 items-start text-stone-200">
            <div className="flex flex-col items-center gap-4 shrink-0">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#2a2a2f] to-[#1a1a1d] border border-white/10 flex items-center justify-center shadow-xl">
                <span className="text-5xl font-medium text-stone-200">
                  {initial}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0 w-full">
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">
                {interviewer.name || interviewer.firstName}
              </h1>
              <p className="text-lg text-amber-400/90 font-medium mb-6 flex items-center gap-3 flex-wrap">
                <span>{interviewer.title}</span>
                {interviewer.reviewCount > 0 && (
                  <span className="text-sm bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                    ★ {interviewer.averageRating} ({interviewer.reviewCount} {interviewer.reviewCount === 1 ? 'review' : 'reviews'})
                  </span>
                )}
              </p>

              <div className="flex flex-wrap items-center gap-6 mb-8 text-sm">
                <div className="flex items-center gap-2.5 text-stone-400">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                    <Building2 size={16} />
                  </div>
                  <span>{interviewer.company}</span>
                </div>
                <div className="flex items-center gap-2.5 text-stone-400">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                    <Clock size={16} />
                  </div>
                  <span>{interviewer.yearsExp} Years Experience</span>
                </div>
              </div>

              {interviewer.categories && interviewer.categories.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {interviewer.categories.map((cat, idx) => (
                      <span key={idx} className="text-xs font-medium px-3 py-1 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">About</h3>
                <p className="text-stone-300 leading-relaxed text-sm sm:text-base">
                  {interviewer.bio || "This interviewer is keeping it brief! Book a session to get to know them and prep for your next big role."}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsBookModalOpen(true)}
              className="shrink-0 bg-amber-400 hover:bg-amber-300 text-amber-950 font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-amber-400/20 flex items-center gap-2 cursor-pointer text-lg"
            >
              Book Session <ArrowRight size={18} />
            </button>
          </div>
        </GravityStarsBackground>


        <div className="bg-[#151518] border border-white/10 rounded-3xl p-6 sm:p-10 flex flex-col gap-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Star className="text-amber-400 fill-amber-400" size={20} /> Candidate Reviews
          </h2>

          {!interviewer.reviews || interviewer.reviews.length === 0 ? (
            <p className="text-stone-500 text-md">
              No reviews yet for {interviewer.firstName}. Complete a mock interview to be the first to review!
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {interviewer.reviews.map((rev) => {
                const author = rev.intervieweeId
                  ? `${rev.intervieweeId.firstName || 'Candidate'} ${rev.intervieweeId.lastName || ''}`.trim()
                  : 'Anonymous Candidate';
                return (
                  <div key={rev._id} className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-stone-300">{author}</span>
                      <span className="text-xs text-stone-500">{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < rev.rating ? "text-amber-400 fill-amber-400" : "text-stone-600"}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-stone-300 leading-relaxed font-light">
                      "{rev.reviewText}"
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151519] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full relative shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsBookModalOpen(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-200 p-1 rounded-lg hover:bg-white/5"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                <Calendar size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Select Available Time Slot</h3>
              </div>
            </div>

            <form onSubmit={handleBookInterview} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2">
                  Interview Topic / Domain
                </label>
                <select
                  value={bookingTopic}
                  onChange={(e) => setBookingTopic(e.target.value)}
                  className="w-full bg-[#1c1c22] border border-white/10 rounded-xl px-4 py-3 text-sm text-stone-200 focus:outline-none focus:border-amber-400"
                >
                  {interviewer.categories?.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                  {(!interviewer.categories || interviewer.categories.length === 0) && (
                    <option value="Full Stack Mock Interview">Full Stack Mock Interview</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2">
                  Available Dates & Slots
                </label>

                {isLoadingSlots ? (
                  <div className="py-8 text-center text-stone-400 text-xs">
                    <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading available slots...
                  </div>
                ) : availableDates.length === 0 ? (
                  <div className="bg-[#1c1c22] border border-amber-500/20 rounded-2xl p-4 text-center space-y-2">
                    <AlertCircle className="w-6 h-6 text-amber-400 mx-auto" />
                    <p className="text-sm text-stone-300 font-medium">No open slots available currently</p>   
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {availableDates.map((dateKey) => {
                        const dateObj = new Date(dateKey);
                        const isSelected = dateKey === selectedDateKey;
                        return (
                          <button
                            key={dateKey}
                            type="button"
                            onClick={() => handleDateSelect(dateKey)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all whitespace-nowrap cursor-pointer ${isSelected
                              ? "bg-amber-400 text-amber-950 border-amber-400 font-semibold shadow-md shadow-amber-400/20"
                              : "bg-[#1c1c22] text-stone-300 border-white/10 hover:border-white/20"
                              }`}
                          >
                            {dateObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                          </button>
                        );
                      })}
                    </div>

                    {selectedDateKey && (
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        {(slotsByDate[selectedDateKey] || []).map((slot) => {
                          const isSelected = selectedSlot?._id === slot._id;
                          const startFormatted = new Date(slot.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          });
                          const endFormatted = new Date(slot.endTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          });

                          return (
                            <button
                              key={slot._id}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={`p-3 rounded-xl text-xs flex flex-col items-center justify-center border transition-all cursor-pointer ${isSelected
                                ? "bg-amber-400/20 text-amber-300 border-amber-400 font-semibold ring-1 ring-amber-400"
                                : "bg-[#1c1c22] text-stone-300 border-white/10 hover:border-amber-400/40"
                                }`}
                            >
                              <span className="font-semibold">{startFormatted} - {endFormatted}</span>
                              <span className="text-[10px] text-stone-400 mt-0.5">45 min Session</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-3 flex items-center justify-between text-xs text-amber-300 mt-4">
                <span className="flex items-center gap-1.5 font-medium">
                  <Sparkles size={14} className="text-amber-400" /> Booking Fee:
                </span>
                <span className="font-bold">1 Credit</span>
              </div>
              
              <button
                type="submit"
                disabled={isSubmittingBook || !selectedSlot}
                className="w-full mt-4 bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingBook ? "Confirming..." : "Confirm Booking"} <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}