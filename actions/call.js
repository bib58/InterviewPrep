"use server";

import dbConnect from "@/lib/db";
import { StreamClient } from "@stream-io/node-sdk";
import { Booking } from "../lib/models/Booking";
import { verifyUser } from "@/lib/auth";

export const getCallData = async (callId) => {
    await dbConnect();

    let user;
    try {
        const auth = await verifyUser();
        user = auth.user;
    } catch (err) {
        return { error: "Forbidden" };
    }

    const booking = await Booking.findOne({ streamCallId: callId })
        .populate({
            path: "interviewerId",
            select: "_id firstName categories",
        })
        .populate({
            path: "intervieweeId",
            select: "_id firstName",
        });

    if (!booking) return { error: "Call not found" };

    // Ensure the authenticated user is either the interviewee or interviewer of this booking
    const isInterviewer = booking.interviewerId._id.toString() === user._id.toString();
    const isInterviewee = booking.intervieweeId._id.toString() === user._id.toString();

    if (!isInterviewer && !isInterviewee) {
        return { error: "Forbidden" };
    }

    const streamClient = new StreamClient(
        process.env.STREAM_API_KEY,
        process.env.STREAM_API_SECRET
    );

    const token = streamClient.generateUserToken({
        user_id: user._id.toString(),
        validity_in_seconds: 2 * 60 * 60,
    });

    return {
        token,
        isInterviewer,
        currentUser: {
            id: user._id.toString(),
            name: user.firstName,
            imageUrl: "",
            Userid: booking.intervieweeId._id.toString(),
            UserNmae: booking.intervieweeId.firstName,
            Interviewerid: booking.interviewerId._id.toString(),
            InterviewerName: booking.interviewerId.firstName,
        },
        booking: {
            id: booking._id.toString(),
            interviewer: {
                id: booking.interviewerId._id.toString(),
                clerkUserId: booking.interviewerId._id.toString(),
                name: booking.interviewerId.firstName,
                categories: booking.interviewerId.categories || [],
            },
            interviewee: {
                id: booking.intervieweeId._id.toString(),
                clerkUserId: booking.intervieweeId._id.toString(),
                name: booking.intervieweeId.firstName,
            },
            categories: booking.interviewerId.categories || [],
            startTime: booking.startTime.toISOString(),
            endTime: booking.endTime.toISOString(),
        },
    };
};
