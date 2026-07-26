"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { verifyUser } from "../lib/auth";

const CATEGORY_PROMPTS = {
  FRONTEND: "React, JavaScript, CSS, performance, accessibility, browser APIs",
  BACKEND: "Node.js, REST APIs, databases, authentication, caching, scalability",
  FULLSTACK: "full-stack architecture, API design, state management, deployment",
  DSA: "data structures, algorithms, time complexity, problem solving",
  SYSTEM_DESIGN: "distributed systems, scalability, databases, microservices, caching",
  BEHAVIORAL: "leadership, teamwork, conflict resolution, career growth, STAR method",
  DEVOPS: "CI/CD, Docker, Kubernetes, cloud infrastructure, monitoring",
  MOBILE: "React Native, iOS/Android, performance, offline support, app lifecycle",
};

export const generateInterviewQuestions = async ({ category }) => {
  const { user } = await verifyUser();
  if (!user) throw new Error("Unauthorized");

  const normalizedCategory = String(category || "")
    .toUpperCase()
    .trim()
    .replace(/[-\s]+/g, "_");

  if (!normalizedCategory || !CATEGORY_PROMPTS[normalizedCategory])
    throw new Error("Invalid category");

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const prompt = `You are an expert technical interviewer. Generate 6 interview questions for a ${normalizedCategory} role covering: ${CATEGORY_PROMPTS[normalizedCategory]}. For each question, provide a concise but complete answer (2-4 sentences) that an interviewer can use to evaluate responses. 
    Respond ONLY with a valid JSON array. No markdown, no backticks, no explanation. Example format:
    [{"question": "...", "answer": "..."}, {"question": "...", "answer": "..."}]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const clean = text.replace(/^```json|^```|```$/gm, "").trim();
    
    try {
      const questions = JSON.parse(clean);
      if (!Array.isArray(questions)) {
        throw new Error("AI output was not a valid array");
      }
      return { questions };
    } catch (parseErr) {
      console.error("[generateInterviewQuestions] JSON parse failed, text output:", clean, parseErr);
      throw new Error("Failed to parse AI generated questions. Please try again.");
    }
  } catch (err) {
    console.error("[generateInterviewQuestions] Gemini API error:", err);
    throw new Error(err.message || "Failed to generate AI questions. Please verify your Gemini API key.");
  }
};
