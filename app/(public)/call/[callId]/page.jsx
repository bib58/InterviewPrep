import { redirect, notFound } from "next/navigation";
import { getCallData } from "../../../../actions/call";
import CallRoom from "../../../../components/CallRoom";

export default async function CallPage({ params }) {
  const { callId } = await params;
  const result = await getCallData(callId);

  if (result.error === "Call not found") {
    notFound();
  }
  if (result.error === "Forbidden") {
    redirect("/");
  }

  const { token, currentUser, booking } = result;

  return (
    <CallRoom
      callId={callId}
      token={token}
      apiKey={process.env.STREAM_API_KEY}
      currentUser={currentUser}
      booking={booking}
    />
  );
}
