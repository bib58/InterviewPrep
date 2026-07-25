"use client";

import Link from "next/link";
import Image from "next/image";
import { UserRound } from "lucide-react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";

export default function Navbar() {
    const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

    const router = useRouter();

    const handleDashboardClick = () => {
        if (user?.role === "user-interviewer") {
            router.push("/dashboard/interviewer");
        } else {
            router.push("/dashboard/interviewee");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center bg-black">
            </div>
        );
    }
    return (

        <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 sm:px-10 py-3 border-b border-gray-500 bg-background/80 backdrop-blur-xl">
            <Link href="/">
                <Image
                    src="/logo.png"
                    alt="Interview Prep Logo"
                    width={140}
                    height={40}
                    className="h-11 w-auto rounded-lg"
                />
            </Link>

            <div className="flex items-center gap-4">
                {isAuthenticated ? (
                    <><button onClick={handleDashboardClick} className="    rounded-xl
    px-5 py-1.5
    bg-gradient-to-br
    from-yellow-300
    via-amber-400
    to-yellow-600
    text-black
    font-semibold
    border border-yellow-200/50
    shadow-[0_4px_15px_rgba(245,158,11,0.35)]
    hover:shadow-[0_6px_14px_rgba(245,158,11,0.5)]
    hover:brightness-110
    transition-all
    duration-300
    cursor-pointer text-lg">Dashboard</button>
                        <Link
                            href="/profile"
                            className="flex items-center gap-2 rounded-lg p-2 hover:bg-muted transition-colors"
                        >
                            <UserRound className="h-6 w-6" />

                        </Link>
                    </>

                ) : (
                    <Link href="/login">
                        <button className="rounded-lg bg-white border px-4.5 py-1.5 text-[18px] text-black hover:opacity-90 cursor-pointer transition font-semibold">
                            Login
                        </button>
                    </Link>
                )}


            </div>
        </nav>
    );
}