"use client";

import { useEffect, useState } from "react";
import ExploreGrid from "./ExploreGrid";

export default function BrowseInterviewersPage() {
  const [interviewers, setInterviewers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInterviewers = async () => {
      try {
        const response = await fetch('/api/interviewers');
        if (response.ok) {
          const data = await response.json();
          const mapped = (data.interviewers || []).map(i => ({
            ...i,
            id: i._id?.toString(),
            name: i.firstName + (i.lastName ? ` ${i.lastName}` : '')
          }));
          setInterviewers(mapped);
        } else {
          console.error("Failed to fetch interviewers");
        }
      } catch (error) {
        console.error("Error fetching interviewers:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInterviewers();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex justify-center items-center">
        <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#09090b] py-16 px-4 sm:px-6 lg:px-8 font-sans selection:bg-amber-400/30 selection:text-amber-200 mt-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Find your <span className="text-amber-400">interviewer</span>
          </h1>
          <p className="text-lg text-stone-400">
            Book mock interviews with industry professionals to ace your next job application.
          </p>
        </div>

        <ExploreGrid interviewers={interviewers} />
      </div>
    </div>
  );
}
