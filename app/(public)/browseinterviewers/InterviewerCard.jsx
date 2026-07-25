"use client";

import { Building2, Clock, Mail, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function InterviewerCard({ interviewer }) {
  const router = useRouter();
  const { name, firstName, title, company, yearsExp, categories, bio, emailId } = interviewer;
  const initial = (firstName || name || "?").charAt(0).toUpperCase();
  const id = interviewer.id || interviewer._id;

  const handleCardClick = () => {
    if (id) { router.push(`/browseinterviewers/${id}`); }
  };

  return (
    <div onClick={handleCardClick}
      className="group relative flex flex-col justify-between bg-[#151518] border border-white/5 rounded-2xl overflow-hidden hover:border-amber-400/30 transition-all duration-300 shadow-xl cursor-pointer"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-amber-400/0 via-amber-400/0 to-amber-400/0 group-hover:from-amber-400/5 group-hover:to-transparent transition-all duration-500" />
      <div className="p-5 flex flex-col gap-4 relative z-10">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#2a2a2f] to-[#1a1a1d] border border-white/10 flex items-center justify-center shadow-inner group-hover:border-amber-400/50 transition-colors">
              <span className="text-xl font-medium text-stone-200 group-hover:text-amber-400 transition-colors">
                {initial}
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-stone-100 truncate">
                {name || firstName}
              </h3>
              {interviewer.reviewCount > 0 ? (
                <span className="text-md text-amber-400 font-bold flex items-center gap-1 shrink-0" title={`${interviewer.averageRating} out of 5 stars`}>
                  ★ {interviewer.averageRating}
                  <span className="text-md text-stone-500 font-normal">({interviewer.reviewCount})</span>
                </span>
              ) : (
                <span className="text-md text-stone-500 font-normal shrink-0">
                </span>
              )}
            </div>

            <p className="text-md text-stone-400 truncate mt-0.5">{title}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="flex items-center gap-2 text-md text-stone-400 bg-black/20 py-1.5 px-2 rounded-lg border border-white/5">
            <Building2 size={12} className="text-stone-500" />
            <span className="truncate" title={company}>{company}</span>
          </div>
          <div className="flex items-center gap-2 text-md text-stone-400 bg-black/20 py-1.5 px-2 rounded-lg border border-white/5">
            <Clock size={12} className="text-stone-500" />
            <span>{yearsExp} Yrs Exp</span>
          </div>
        </div>

        {categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {categories.slice(0, 3).map((cat, idx) => (
              <span key={idx} className="text-sm font-medium px-2 py-0.5 rounded-full bg-white/5 text-stone-300 border border-white/10">
                {cat}
              </span>
            ))}
            {categories.length > 3 && (
              <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-white/5 text-stone-400 border border-white/10">
                +{categories.length - 3}
              </span>
            )}
          </div> 
        )}

        <p className="text-xs text-stone-500 line-clamp-2 mt-2 leading-relaxed h-8">
          {bio || "This interviewer hasn't added a bio yet. They are ready to help you prep though!"}
        </p>
      </div>

      <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between bg-black/10 relative z-10 group-hover:bg-amber-400/5 transition-colors">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (id) router.push(`/browseinterviewers/${id}?booking=true`);
          }}
          className="flex items-center gap-1.5 text-sm font-medium text-amber-400/80 hover:text-amber-400 transition-colors"
        >
          Book Session
          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
