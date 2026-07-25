export const SLOTS = [
  {
    label: "Mon 10:00 AM",
    cls: "border-amber-400/30 text-amber-200 bg-amber-400/5",
  },
  { label: "Mon 2:00 PM", cls: "border-white/7 text-stone-500" },
  {
    label: "Tue 11:00 AM",
    cls: "border-amber-400/30 text-amber-200 bg-amber-400/5",
  },
  {
    label: "Wed 9:00 AM ✓",
    cls: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5",
  },
  {
    label: "Thu 3:00 PM",
    cls: "border-amber-400/30 text-amber-200 bg-amber-400/5",
  },
];

export const PLANS = [
  {
    name: "1 Credit",
    tagline: "Single Session Pass",
    price: "$10",
    credits: "1 Mock Interview Session",
    featured: false,
    planId: "credit_1",
    slug: "1-credit",
    badge: null,
    features: [
      "1 Mock Interview Session",
      "Instant credit addition",
      "Credits do not expire",
      "Deducted after interview call ends",
    ],
  },
  {
    name: "3 Credits",
    tagline: "3 Full Mock Sessions",
    price: "$25",
    savings: "Save $5",
    credits: "3 Mock Interview Sessions",
    featured: true,
    planId: "credit_3",
    slug: "3-credits",
    badge: "POPULAR",
    features: [
      "3 Full Mock Sessions",
      "Save $5 total",
      "Credits do not expire",
      "Deducted after interview call ends",
    ],
  },
  {
    name: "5 Credits",
    tagline: "Pro Prep Bundle",
    price: "$40",
    savings: "Save $10",
    credits: "5 Mock Interview Sessions",
    featured: false,
    planId: "credit_5",
    slug: "5-credits",
    badge: null,
    features: [
      "5 Mock Interview Sessions",
      "Save $10 total",
      "Credits do not expire",
      "Deducted after interview call ends",
    ],
  },
];

export const ROLES = [
  {
    label: "Interviewee",
    title: <span className="text-stone-300">Land the role you deserve</span>,
    desc: "Stop guessing what interviewers want. Practice with people who've been on the other side and know exactly how top companies evaluate candidates.",
    perks: [
      "Browse by category: Frontend, Backend, System Design, PM",
      "Book sessions using monthly credits from your plan",
      "Receive AI-powered feedback after every session",
      "Access session recordings to review your performance",
      "Chat with your interviewer before and after the call",
    ],
  },
  {
    label: "Interviewer",
    title: <span className="bg-linear-to-br from-amber-300 to-amber-500 bg-clip-text text-transparent">Earn doing what you&apos;re <br></br>great at</span>,
    desc: "Share your knowledge, help engineers grow, and earn meaningful income on your own schedule. Set your slots, and we handle the rest.",
    perks: [
      "Set your own availability and session rates",
      "AI question generator tailored to each candidate's role",
      "Earn credits per session — withdraw any time",
      "Dashboard with credit balance and withdrawal requests",
    ],
  },
];

export const CATEGORIES = [
  { value: null, label: "All" },
  { value: "FRONTEND", label: "Frontend" },
  { value: "BACKEND", label: "Backend" },
  { value: "FULLSTACK", label: "Full Stack" },
  { value: "DSA", label: "DSA" },
  { value: "SYSTEM_DESIGN", label: "System Design" },
  { value: "BEHAVIORAL", label: "Behavioral" },
  { value: "DEVOPS", label: "DevOps" },
  { value: "MOBILE", label: "Mobile" },
];

export const CATEGORY_LABEL = {
  FRONTEND: "Frontend",
  BACKEND: "Backend",
  FULLSTACK: "Full Stack",
  DSA: "DSA",
  SYSTEM_DESIGN: "System Design",
  BEHAVIORAL: "Behavioral",
  DEVOPS: "DevOps",
  MOBILE: "Mobile",
};

export const YEARS_OPTIONS = [
  { value: 1, label: "1 yr" },
  { value: 2, label: "2 yrs" },
  { value: 3, label: "3 yrs" },
  { value: 5, label: "5 yrs" },
  { value: 7, label: "7 yrs" },
  { value: 10, label: "10+ yrs" },
];
