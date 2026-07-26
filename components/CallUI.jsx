"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { StreamTheme, SpeakerLayout, useCallStateHooks, useCall, CallingState, CallControls } from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { Chat, Channel, MessageList, MessageComposer, Window, useCreateChatClient } from "stream-chat-react";
import "stream-chat-react/dist/css/index.css";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Sparkles, Loader2, Clock, X } from "lucide-react";
import AIQuestionsPanel from "./AIQuestions";

export default function CallUI({ callId, isInterviewer, booking, onLeave, apiKey, token, currentUser }) {
  const { useCallCallingState } = useCallStateHooks();
  const call = useCall();
  const callingState = useCallCallingState();

  const [activeTab, setActiveTab] = useState("chat");
  const [timeLeft, setTimeLeft] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const leavingRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  const handleLeave = useCallback(async () => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    try {
      await fetch(`/api/bookings/${booking.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).catch((err) => console.error("Error auto-completing booking:", err));

      if (call) {
        const isRecording = call.state?.recording;
        if (isRecording) {
          await call.stopRecording().catch(() => { });
        }
        await call.leave().catch(() => { });
      }
    } finally {
      onLeave();
    }
  }, [call, onLeave, booking.id]);

  useEffect(() => {
    const checkTime = () => {
      if (!booking.endTime) return;
      const end = new Date(booking.endTime).getTime();
      const now = Date.now();
      const remaining = end - now;

      if (remaining <= 0) {
        handleLeave();
      } else {
        setTimeLeft(Math.max(0, Math.ceil(remaining / 1000)));
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [booking.endTime, handleLeave]);

  const chatClient = useCreateChatClient({
    apiKey,
    tokenOrProvider: token,
    userData: {
      id: currentUser.id,
      name: currentUser.name,
      image: currentUser.imageUrl,
    },
  });

  const [chatChannel, setChatChannel] = useState(null);

  useEffect(() => {
    if (!chatClient) return;

    const channel = chatClient.channel("messaging", callId, {
      name: "Interview Chat",
      members: [
        booking.interviewer.clerkUserId,
        booking.interviewee.clerkUserId,
      ],
    });

    channel
      .watch()
      .then(() => setChatChannel(channel))
      .catch(console.error);

    return () => {
      channel.stopWatching().catch(() => { });
    };
  }, [chatClient, callId, booking]);

  if (callingState === CallingState.LEFT) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center gap-3">
        <p className="text-stone-400 text-md">Leaving call…</p>
      </div>
    );
  }

  return (
    <div className="min-h-[92vh] bg-[#0a0a0b] flex flex-col overflow-hidden mt-18">
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/8 shrink-0">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-white/10 text-stone-500 text-xs"
          >
            {booking.interviewer.name}
            <span className="text-stone-700 mx-1.5">X</span>
            {booking.interviewee.name}
          </Badge>
          {isInterviewer && (
            <Badge
              variant="outline"
              className="border-amber-400/20 bg-amber-400/5 text-amber-400 text-xs"
            >
              Interviewer
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          {timeLeft !== null && (
            <div
              className={`px-3 py-1 rounded-lg border text-xs font-mono font-medium flex items-center gap-1.5 transition-all duration-300 ${
                timeLeft < 60
                  ? "bg-red-500/10 border-red-500/30 text-red-400 animate-pulse"
                  : timeLeft < 300
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              }`}
            >
              <Clock size={13} className={timeLeft < 60 ? "animate-spin" : ""} />
              <span>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg border border-white/10 text-stone-400 hover:text-white hover:bg-white/5 transition-colors"
            title={isSidebarOpen ? "Hide chat/questions" : "Show chat/questions"}
          >
            <MessageSquare size={14} />
          </button>
        </div>
      </div>
      <div className="flex flex-1 min-h-0 relative">
        <div className="flex flex-col flex-1 min-w-0">
          <StreamTheme>
            <SpeakerLayout participantBarPosition="bottom" />
            <CallControls onLeave={handleLeave} />
          </StreamTheme>
        </div>

        {isSidebarOpen && (
          <div className="w-full md:w-85 shrink-0 flex flex-col border-l border-white/8 bg-[#0a0a0b] absolute inset-y-0 right-0 z-40 md:relative">
            <div className="flex items-center border-b border-white/8 shrink-0 px-2">
              <button
                type="button"
                onClick={() => setActiveTab("chat")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-colors ${activeTab === "chat"
                  ? "text-amber-400 border-b-2 border-amber-400"
                  : "text-stone-500 hover:text-stone-300"
                  }`}
              >
                <MessageSquare size={13} />
                Chat
              </button>

              {isInterviewer && (
                <button
                  type="button"
                  onClick={() => setActiveTab("ai")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-colors ${activeTab === "ai"
                    ? "text-amber-400 border-b-2 border-amber-400"
                    : "text-stone-500 hover:text-stone-300"
                    }`}
                >
                  <Sparkles size={13} />
                  AI Questions
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 text-stone-500 hover:text-stone-300 transition-colors ml-auto md:hidden"
                title="Close Panel"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              {activeTab === "chat" ? (
                chatClient && chatChannel ? (
                  <Chat client={chatClient} theme="str-chat__theme-dark">
                    <Channel channel={chatChannel}>
                      <Window>
                        <MessageList />
                        <MessageComposer focus />
                      </Window>
                    </Channel>
                  </Chat>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 size={18} className="text-stone-600 animate-spin" />
                  </div>
                )
              ) : (
                <div className="p-4 h-full overflow-y-scroll max-h-screen">
                  <AIQuestionsPanel categories={booking.categories} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}