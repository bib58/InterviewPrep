"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { StreamVideoClient, StreamVideo, StreamCall } from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import "stream-chat-react/dist/css/index.css";
import { Loader2 } from "lucide-react";
import CallUI from "./CallUI";
import { useSelector } from "react-redux";

export default function CallRoom({ callId, token, apiKey, currentUser, booking }) {
  const router = useRouter();
  const [videoClient, setVideoClient] = useState(null);
  const [call, setCall] = useState(null);
  const clientRef = useRef(null);
  const joinedRef = useRef(false);

  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    if (joinedRef.current) return;
    joinedRef.current = true;

    const client = new StreamVideoClient({
      apiKey,
      user: {
        id: currentUser.id,
        name: currentUser.name,
        image: currentUser.imageUrl,
      },
      token,
    });

    const callInstance = client.call("default", callId);

    callInstance
      .join({ create: false })
      .then(() => {
        clientRef.current = client;
        setVideoClient(client);
        setCall(callInstance);
      })
      .catch(console.error);

    return () => {
      callInstance.leave().catch(() => { });
      client.disconnectUser().catch(() => { });
      clientRef.current = null;
      joinedRef.current = false;
    };
  }, [
    apiKey,
    callId,
    currentUser.Userid,
    currentUser.UserNmae,
    currentUser.Interviewerid,
    currentUser.InterviewerName,
    token,
  ]);

  const handleLeave = useCallback(() => {
    if (user?.role === "user-interviewer") {
      router.push("/dashboard/interviewer");
    } else {
      router.push(`/dashboard/interviewee?reviewBookingId=${booking.id}`);
    }
  }, [user, router, booking]);

  if (!videoClient || !call) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center gap-3">
        <Loader2 size={28} className="text-pink-500 animate-spin" />
        <p className="text-stone-500 text-sm font-light">Connecting to call…</p>
      </div>
    );
  }

  return (
    <StreamVideo client={videoClient}>
      <StreamCall call={call}>
        <CallUI
          callId={callId}
          isInterviewer={user?.role === "user-interviewer"}
          booking={booking}
          onLeave={handleLeave}
          apiKey={apiKey}
          token={token}
          currentUser={currentUser}
        />
      </StreamCall>
    </StreamVideo>
  );
}
