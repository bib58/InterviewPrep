import dbConnect from "@/lib/db";
import { Booking, BookingStatus } from "../../../../lib/models/Booking";

export async function POST(request) {
    const body = await request.json();
    const eventType = body.type;

    console.log(`\n[stream-webhook] ← Received event: ${eventType}`);

    if (eventType !== "call.recording_ready") {
        console.log(`[stream-webhook] Ignoring event type: ${eventType}`);
        return Response.json({ ok: true });
    }

    const callCid = body.call_cid ?? "";
    const streamCallId = callCid.includes(":") ? callCid.split(":")[1] : callCid;
    console.log(
        `[stream-webhook] call_cid: ${callCid} → streamCallId: ${streamCallId}`
    );

    if (!streamCallId) {
        console.log(`[stream-webhook] No streamCallId found, skipping`);
        return Response.json({ ok: true });
    }

    try {
        await dbConnect();
        console.log(`[stream-webhook] Looking up booking in DB...`);
        const booking = await Booking.findOne({ streamCallId })
            .populate("interviewerId")
            .populate("intervieweeId");

        if (!booking) {
            console.log(`[stream-webhook] No booking found for streamCallId: ${streamCallId}`);
            return Response.json({ ok: true });
        }

        console.log(
            `[stream-webhook] Booking found: ${booking._id} | interviewer: ${booking.interviewerId?.firstName} | interviewee: ${booking.intervieweeId?.firstName}`
        );

        if (eventType === "call.recording_ready") {
            const recordingUrl = body.call_recording?.url;

            if (!recordingUrl) {
                console.log(`[stream-webhook] call.recording_ready received but no URL in payload`);
                return Response.json({ ok: true });
            }

            console.log(`[stream-webhook] Saving recording URL to booking...`);
            booking.recordingUrl = recordingUrl;
            booking.status = BookingStatus.COMPLETED;
            await booking.save();

            console.log(`[stream-webhook] ✓ Recording URL saved & booking marked COMPLETED for booking ${booking._id}`);

            return Response.json({ ok: true });
        }

        return Response.json({ ok: true });
    } 
    catch (err) {
        console.error(`[stream-webhook] ✗ ${eventType} error:`, err);
        return Response.json({ ok: true });
    }
}
