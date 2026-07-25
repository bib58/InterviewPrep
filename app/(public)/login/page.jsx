'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginUser } from "../../../slices/authSlice";
import { useEffect, useState } from 'react';
import { UserRound } from "lucide-react";

const loginSchema = z.object({
  emailId: z.string().email("Invalid Email"),
  password: z.string().min(8, "Password is too weak")
});

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);
  const { register, handleSubmit, formState: { errors }, } = useForm({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const onSubmit = (data) => {
    dispatch(loginUser(data));
  };

  return (
  <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center px-4 py-10">
    <div className="w-full max-w-md">
      {/* Card */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 text-center">
          <div className="w-15 h-15 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-5">
            <UserRound/>
          </div>

          <h1 className="text-4xl font-bold text-white">
            Welcome Back
          </h1>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Email */}
            <div>
              <label className="text-white text-lg font-medium mb-2 block">
                Email Address
              </label>

              <input
                type="email"
                placeholder="john@example.com"
                className={`w-full rounded-xl bg-white/20 border ${
                  errors.emailId
                    ? "border-red-400"
                    : "border-white/20"
                } px-5 py-2 text-white placeholder:text-white/60 outline-none focus:ring-2 focus:ring-white transition`}
                {...register("emailId")}
              />

              {errors.emailId && (
                <p className="text-red-300 mt-2 text-md">
                  {errors.emailId.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-white text-lg font-medium mb-2 block">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`w-full rounded-xl bg-white/20 border ${
                    errors.password
                      ? "border-red-400"
                      : "border-white/20"
                  } px-5 py-2 text-white placeholder:text-white/60 outline-none focus:ring-2 focus:ring-white transition`}
                  {...register("password")}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.5 0-8.3-3-9.5-7a10.3 10.3 0 012.5-3.8m3-2A9.9 9.9 0 0112 5c4.5 0 8.3 3 9.5 7a10 10 0 01-4 5.2M3 3l18 18"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {errors.password && (
                <p className="text-red-300 mt-2 text-md">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-xl bg-white text-purple-700 font-bold text-lg transition-all duration-300 disabled:opacity-70 disabled:scale-100"
            >
              {loading ? (
                <div className="flex items-center justify-center min-h-screen">
                <span className="loading loading-spinner loading-xl text-secondary"></span>
            </div>
              ) : (
                "Login"
              )}
            </button>
          </form>

          <p className="text-center text-white/80 mt-8">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-white underline hover:text-yellow-300"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  </div>
);
}
