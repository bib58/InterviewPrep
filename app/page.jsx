import { BubbleBackground } from "@/components/animate-ui/components/backgrounds/bubble";
import { AI_TAGS, AVATARS, ROLES, SLOTS } from "@/lib/data";
import { Bot, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import PricingSection from "../components/PricingSection";

const GoldTitle = ({ children }) => (
  <span className="bg-linear-to-br from-amber-300 to-amber-500 bg-clip-text text-transparent">
    {children}
  </span>
);

const GrayTitle = ({ children }) => (
  <span className="text-white">
    {children}
  </span>
);

const SectionLabel = ({ children }) => (
  <div className="inline-block px-3 py-1 mb-4 rounded-full bg-white/5 border border-white/10 text-stone-400 text-sm font-medium tracking-wide uppercase">
    {children}
  </div>
);

const SectionHeading = ({ gray, gold }) => (
  <h2 className="text-4xl md:text-5xl font-serif tracking-tight">
    <GrayTitle>{gray}</GrayTitle> <GoldTitle>{gold}</GoldTitle>
  </h2>
);

const CodeDemo = () => (
  <div className="w-full max-w-md h-80 bg-[#0d1117] border border-white/10 rounded-xl p-5 font-mono text-sm overflow-hidden shadow-2xl">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-3 h-3 rounded-full bg-red-500"></div>
      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
      <div className="w-3 h-3 rounded-full bg-green-500"></div>
    </div>

    <pre className="leading-7">
      <code>
        <span className="text-purple-400">const</span>{" "}
        <span className="text-blue-400">candidate</span>{" "}
        <span className="text-white">=</span>{" "}
        <span className="text-orange-400">{"{"}</span>{"\n"}

        {"  "}
        <span className="text-cyan-400">name</span>
        <span className="text-white">:</span>{" "}
        <span className="text-green-400">"Alex"</span>,
        {"\n"}

        {"  "}
        <span className="text-cyan-400">skills</span>
        <span className="text-white">:</span>{" "}
        <span className="text-orange-400">[</span>
        <span className="text-green-400">"React"</span>,{" "}
        <span className="text-green-400">"Node"</span>
        <span className="text-orange-400">]</span>,
        {"\n"}

        {"  "}
        <span className="text-cyan-400">experience</span>
        <span className="text-white">:</span>{" "}
        <span className="text-pink-400">3</span>,
        {"\n"}

        <span className="text-orange-400">{"}"}</span>;
        {"\n\n"}

        <span className="text-purple-400">if</span>{" "}
        <span className="text-white">(</span>
        <span className="text-blue-400">candidate</span>.
        <span className="text-cyan-400">skills</span>.
        <span className="text-yellow-400">includes</span>(
        <span className="text-green-400">"React"</span>)
        <span className="text-white"> {"{"}</span>
        {"\n"}

        {"  "}
        <span className="text-yellow-400">console</span>.
        <span className="text-blue-400">log</span>(
        <span className="text-green-400">"🚀 Interview Ready!"</span>);
        {"\n"}

        <span className="text-white">{"}"}</span>;
      </code>
    </pre>
  </div>
);


function MockUI({ rows = 3 }) {
  const widths = ["w-4/5", "w-3/5", "w-2/5", "w-4/5", "w-1/2"];
  const colors = [
    "bg-white/5",
    "bg-white/5",
    "bg-amber-400/15",
    "bg-white/5",
    "bg-white/5",
  ];

  return (
    <div className="mt-5 rounded-xl bg-[#141417] border border-white/10 overflow-hidden">
      <div className="h-9 bg-white/5 border-b border-white/10 flex items-center px-3.5 gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#ff5f57]" />
        <span className="w-2 h-2 rounded-full bg-[#ffbd2e]" />
        <span className="w-2 h-2 rounded-full bg-[#28c840]" />
      </div>
      <div className="p-4 flex flex-col gap-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full ${widths[i]} ${colors[i]}`}
          />
        ))}
      </div>
    </div>
  );
}

export function BentoCard({ icon, title, desc, children, className = "" }) {
  return (
    <div
      className={`relative bg-[#0f0f11] border border-white/10 hover:border-amber-400/20 rounded-2xl p-9 h-full transition duration-300 overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 bg-linear-to-br from-amber-400/5 via-transparent pointer-events-none" />

      <span className="w-11 h-11 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-xl mb-5">
        {icon}
      </span>

      <h3 className="font-serif text-xl tracking-tight mb-2">{title}</h3>

      <p className="text-sm text-stone-400 leading-relaxed">{desc}</p>

      {children}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-black overflow-x-hidden min-h-screen text-white">
      
      <BubbleBackground className="h-[90vh]">
        <section className="relative grid grid-cols-1 lg:grid-cols-5 px-4 sm:px-8 pt-28 sm:pt-32 py-15 overflow-hidden z-10">
          <div className="col-span-full lg:col-span-3 flex flex-col items-center justify-center text-center lg:-rotate-2">
            <h1 className="font-serif relative text-5xl sm:text-6xl lg:text-7xl tracking-tighter max-w-4xl mt-6">
              <GrayTitle>Ace your next interview</GrayTitle>
              <br />
              <GoldTitle>with real experts</GoldTitle>
            </h1>

            <p className="relative text-sm sm:text-base md:text-lg text-stone-400 max-w-xl mt-6 leading-relaxed">
              Book 1:1 mock interviews with senior engineers from top companies.
              Get AI-powered feedback, role-specific questions, and the confidence
              to land your dream job.
            </p>

            <div className="relative flex justify-center gap-2 sm:gap-4 mt-10 sm:w-auto">
              <Link href="/onboarding">
                <button className="px-8 py-2.5 bg-amber-400 text-amber-950 hover:bg-amber-500 cursor-pointer rounded-xl font-semibold transition-colors">
                  Get started
                </button>
              </Link>

              <Link href="/browseinterviewers">
                <button className="px-7 py-2.5 bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-xl font-semibold transition-colors cursor-pointer">
                  Browse Interviewers →
                </button>
              </Link>
            </div>
          </div>

          {/* RIGHT */}
          <div className="col-span-full lg:col-span-2 flex items-center justify-center lg:justify-start mt-12 lg:mt-0 lg:rotate-3">
            <CodeDemo />
          </div>
        </section>
      </BubbleBackground>


      <section className="relative z-10 py-20 max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <SectionLabel>Features</SectionLabel>
          <SectionHeading
            gray="Everything you need,"
            gold="nothing you don't"
          />
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-7">
            <BentoCard
              icon={<Bot size={20} className="text-amber-400" />}
              title={<GrayTitle>AI Question Generator</GrayTitle>}
              desc="Interviewers get a live AI co-pilot generating role-specific questions on demand — system design, behavioural, DSA — all tailored to the candidate's level."
            >
              <div className="flex flex-wrap gap-2 mt-5">
                {AI_TAGS.map((t) => (
                  <Badge key={t.label} variant={t.active ? "default" : "outline"} className="bg-amber-400 text-amber-950 hover:bg-amber-500">
                    {t.label}
                  </Badge>
                ))}
              </div>
            </BentoCard>
          </div>

          <div className="col-span-12 md:col-span-5">
            <BentoCard
              icon={<Wallet size={16} className="text-amber-400" />}
              title={<GrayTitle>Credit System</GrayTitle>}
              desc="Subscribe for monthly credits. Book sessions. Interviewers earn and withdraw any time."
            >
              <div className="mt-5 rounded-xl bg-[#141417] border border-white/10 p-5 flex justify-between items-end">
                <div>
                  <p className="text-xs text-stone-600 mb-1">Your balance</p>
                  <p className="font-serif text-4xl leading-none bg-linear-to-br from-amber-300 to-amber-500 bg-clip-text text-transparent">
                    28
                  </p>
                  <p className="text-xs text-stone-600 mt-1">
                    credits remaining
                  </p>
                </div>

                <Badge variant="secondary" className="bg-white/10 text-white border-none">+10 this month</Badge>
              </div>
            </BentoCard>
          </div>

          <div className="col-span-12 md:col-span-4">
            <BentoCard
              icon="📹"
              title="HD Video Calls"
              desc="Powered by Stream. Screen sharing, recording, and instant playback links — all built in."
            >
              <MockUI rows={3} />
            </BentoCard>
          </div>

          <div className="col-span-12 md:col-span-4">
            <BentoCard
              icon="💬"
              title="Persistent Chat"
              desc="Message your interviewer before and after the call. Share resources, prep notes, and follow-ups in one thread."
            />
          </div>

          <div className="col-span-12 md:col-span-4">
            <BentoCard
              icon="🔒"
              title="Security by Arcjet"
              desc="Bot protection, rate limiting, and abuse prevention baked into every API route."
            />
          </div>

          <div className="col-span-12 md:col-span-6">
            <BentoCard
              icon="📊"
              title={<GrayTitle>AI Feedback Reports</GrayTitle>}
              desc="Post-interview analysis by Gemini with actionable insights."
            >
              <MockUI rows={5} />
            </BentoCard>
          </div>

          <div className="col-span-12 md:col-span-6">
            <BentoCard
              icon="🗓️"
              title={<GoldTitle>Slot-based Scheduling</GoldTitle>}
              desc="Interviewers set availability once. Interviewees pick from open slots and confirm with one click — no back-and-forth needed."
            >
              <div className="flex flex-wrap gap-2 mt-5">
                {SLOTS.map((s) => (
                  <span
                    key={s.label}
                    className={`text-xs px-3 py-1.5 rounded-lg border ${s.cls}`}
                  >
                    {s.label}
                  </span>
                ))}
              </div>
            </BentoCard>
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section className="relative z-10 pb-28 max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <SectionLabel>Who it&apos;s for</SectionLabel>
          <SectionHeading gray="Built for both sides" gold="of the table" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {ROLES.map((role) => (
            <div
              key={role.label}
              className="relative bg-[#0f0f11] border border-white/10 hover:border-amber-400/20 rounded-2xl p-12 h-full transition duration-300 overflow-hidden"
            >
              <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.05)_0%,transparent_70%)] pointer-events-none" />

              <span className="inline-block text-xs font-semibold text-amber-400 tracking-widest uppercase border border-amber-400/20 bg-amber-400/10 rounded-full px-3 py-1.5 mb-5">
                {role.label}
              </span>

              <h3 className="font-serif text-2xl tracking-tight mb-4">
                {role.title}
              </h3>

              <p className="text-sm text-stone-400 leading-relaxed mb-8">
                {role.desc}
              </p>

              <ul className="space-y-3">
                {role.perks.map((p) => (
                  <li key={p} className="flex gap-3 text-sm text-stone-400">
                    <span className="mt-0.5 min-w-4 h-4 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-xs text-amber-400">
                      ✓
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="relative z-10 pb-28 max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <SectionLabel>Pricing</SectionLabel>
          <SectionHeading
            gray="Simple, transparent"
            gold="credit-based plans"
          />
          <p className="text-stone-400 mt-3 text-sm">
            Each credit = one session. Unused credits roll over.
          </p>
        </div>

        <PricingSection />
      </section>

      {/* CTA */}
      <section className="relative z-10 pb-28 max-w-5xl mx-auto px-6">
        <BubbleBackground className="relative border border-amber-400/20 rounded-3xl px-3 sm:px-16 py-20 bg-linear-to-br from-amber-400/5 text-center overflow-hidden">
          <div className="relative z-10">
            <h2 className="font-serif relative text-4xl md:text-5xl leading-tight tracking-tight mb-4">
              <GrayTitle>Your next interview</GrayTitle>
              <br />
              <GoldTitle>starts here</GoldTitle>
            </h2>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/onboarding" className="relative">
                <button className="w-full sm:w-auto px-8 py-3 bg-amber-400 text-amber-950 hover:bg-amber-500 rounded-xl font-semibold transition-colors">
                  Get started
                </button>
              </Link>

              <Link href="/explore" className="relative">
                <button className="w-full sm:w-auto px-8 py-3 bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-xl font-semibold transition-colors">
                  Browse Interviewers →
                </button>
              </Link>
            </div>
          </div>
        </BubbleBackground>
      </section>
      <div className="py-12 flex justify-center items-center text-2xl font-extrabold border-t ">
        Made with ❤️ by Bibhu Kumar Singh
      </div>
    </div>
  );
}
