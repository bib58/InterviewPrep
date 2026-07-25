import { GoogleGenerativeAI } from "@google/generative-ai";
import dbConnect from "@/lib/db";
import { Booking, BookingStatus } from "@/lib/models/Booking";
import Interviewer from "@/lib/models/Interviewer";
import User from "@/lib/models/User";
import { Feedback } from "@/lib/models/Feedback";
import { CreditTransaction, TransactionType } from "@/lib/models/CreditTransaction";

export async function POST(request) {
    const body = await request.json();
    const eventType = body.type;

    console.log(`\n[stream-webhook] ← Received event: ${eventType}`);

    if (
        eventType !== "call.recording_ready" &&
        eventType !== "call.transcription_ready"
    ) {
        console.log(`[stream-webhook] Ignoring event type: ${eventType}`);
        return Response.json({ ok: true });
    }

    // call_cid arrives as "default:mock_123_abc" — we stored just "mock_123_abc"
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
            console.log(
                `[stream-webhook] No booking found for streamCallId: ${streamCallId}`
            );
            return Response.json({ ok: true });
        }

        console.log(
            `[stream-webhook] Booking found: ${booking._id} | interviewer: ${booking.interviewerId?.firstName} | interviewee: ${booking.intervieweeId?.firstName}`
        );

        // ── Recording ready ───────────────────────────────────────────────────────
        if (eventType === "call.recording_ready") {
            const recordingUrl = body.call_recording?.url;

            if (!recordingUrl) {
                console.log(
                    `[stream-webhook] call.recording_ready received but no URL in payload`
                );
                return Response.json({ ok: true });
            }

            console.log(`[stream-webhook] Saving recording URL to booking...`);
            booking.recordingUrl = recordingUrl;
            booking.status = BookingStatus.COMPLETED;
            await booking.save();

            console.log(
                `[stream-webhook] ✓ Recording URL saved & booking marked COMPLETED for booking ${booking._id}`
            );

            return Response.json({ ok: true });
        }

        // ── Transcription ready ───────────────────────────────────────────────────
        if (eventType === "call.transcription_ready") {
            // Outer guard — catches sequential retries
            const existingFeedback = await Feedback.findOne({ bookingId: booking._id });
            if (existingFeedback) {
                console.log(
                    `[stream-webhook] Feedback already exists for booking ${booking._id}, skipping duplicate webhook`
                );
                return Response.json({ ok: true });
            }

            const transcriptUrl = body.call_transcription?.url;
            if (!transcriptUrl) {
                console.log(
                    `[stream-webhook] call.transcription_ready received but no transcript URL in payload`
                );
                return Response.json({ ok: true });
            }

            // 1. Download JSONL from Stream CDN
            console.log(`[stream-webhook] Downloading transcript from Stream CDN...`);
            const transcriptRes = await fetch(transcriptUrl);
            const transcriptText = await transcriptRes.text();
            console.log(
                `[stream-webhook] Transcript downloaded (${transcriptText.length} chars)`
            );

            // 2. Parse JSONL into readable conversation
            console.log(`[stream-webhook] Parsing JSONL transcript...`);
            const lines = transcriptText
                .trim()
                .split("\n")
                .filter(Boolean)
                .map((line) => {
                    try {
                        return JSON.parse(line);
                    } catch {
                        return null;
                    }
                })
                .filter((entry) => entry?.type === "speech");

            console.log(`[stream-webhook] Parsed ${lines.length} speech segments`);

            if (lines.length === 0) {
                console.log(
                    `[stream-webhook] No speech segments found in transcript, skipping`
                );
                return Response.json({ ok: true });
            }

            // Map MongoDB ObjectId string to display name
            const interviewerIdStr = booking.interviewerId?._id?.toString() || "";
            const intervieweeIdStr = booking.intervieweeId?._id?.toString() || "";

            const speakerMap = {
                [interviewerIdStr]: booking.interviewerId?.firstName ?? "Interviewer",
                [intervieweeIdStr]: booking.intervieweeId?.firstName ?? "Candidate",
            };

            const transcript = lines
                .map((l) => `${speakerMap[l.speaker_id] ?? l.speaker_id}: ${l.text}`)
                .join("\n");

            console.log(
                `[stream-webhook] Transcript preview:\n${transcript.slice(0, 300)}${transcript.length > 300 ? "..." : ""}`
            );

            // 3. Generate feedback via Gemini
            console.log(
                `[stream-webhook] Sending transcript to Gemini (gemini-2.5-flash-lite)...`
            );
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash-lite",
            });

            const categories =
                booking.interviewerId?.categories?.join(", ") ?? "General";

            const prompt = `You are an expert technical interviewer evaluating a mock interview.

Interview categories: ${categories}
Interviewer: ${booking.interviewerId?.firstName}
Candidate: ${booking.intervieweeId?.firstName}

TRANSCRIPT:
${transcript}

Analyze the candidate's performance. Respond ONLY with a valid JSON object, no markdown, no backticks, no explanation:
{
  "summary": "2-3 sentence overall summary of the session",
  "technical": "Assessment of technical knowledge and accuracy",
  "communication": "Assessment of clarity, structure, and communication style",
  "problemSolving": "Assessment of problem-solving approach and thought process",
  "recommendation": "HIRE / CONSIDER / NO_HIRE with a one-sentence reason",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "overallRating": "POOR or AVERAGE or GOOD or EXCELLENT"
}`;

            const result = await model.generateContent(prompt);
            const raw = result.response
                .text()
                .trim()
                .replace(/^```json|^```|```$/gm, "")
                .trim();

            console.log(
                `[stream-webhook] Gemini raw response:\n${raw.slice(0, 500)}${raw.length > 500 ? "..." : ""}`
            );

            const feedbackData = JSON.parse(raw);
            console.log(
                `[stream-webhook] Feedback parsed — overallRating: ${feedbackData.overallRating} | recommendation: ${feedbackData.recommendation}`
            );

            // 4. Write to DB
            console.log(`[stream-webhook] Writing feedback to DB...`);
            const feedback = await Feedback.findOneAndUpdate(
                { bookingId: booking._id },
                {
                    bookingId: booking._id,
                    summary: feedbackData.summary,
                    technical: feedbackData.technical,
                    communication: feedbackData.communication,
                    problemSolving: feedbackData.problemSolving,
                    recommendation: feedbackData.recommendation,
                    strengths: feedbackData.strengths,
                    improvements: feedbackData.improvements,
                    overallRating: feedbackData.overallRating,
                },
                { upsert: true, new: true }
            );

            booking.feedback = feedback._id;
            booking.status = BookingStatus.COMPLETED;
            await booking.save();

            console.log(
                `[stream-webhook] Feedback upserted + booking marked COMPLETED`
            );

            // Credit transaction and updates
            const earnExists = await CreditTransaction.findOne({
                bookingId: booking._id,
                type: TransactionType.BOOKING_EARNING,
            });

            if (!earnExists) {
                const creditsToEarn = booking.creditsCharged || 1;

                // Increment credits & creditBalance for the interviewer
                await Interviewer.findByIdAndUpdate(booking.interviewerId?._id, {
                    $inc: { creditBalance: creditsToEarn, credits: creditsToEarn },
                });

                await CreditTransaction.create({
                    userId: booking.interviewerId?._id,
                    amount: creditsToEarn,
                    type: TransactionType.BOOKING_EARNING,
                    bookingId: booking._id,
                });

                console.log(
                    `[stream-webhook] Credit earning transaction created (+${creditsToEarn} credits for interviewer)`
                );
            } else {
                console.log(
                    `[stream-webhook] Earning transaction already exists, skipping`
                );
            }

            console.log(`[stream-webhook] ✓ All done for booking ${booking._id}`);
        }

        return Response.json({ ok: true });
    } catch (err) {
        console.error(`[stream-webhook] ✗ ${eventType} error:`, err);
        // Always 200 — non-2xx triggers Stream retries, making the race worse
        return Response.json({ ok: true });
    }
}
