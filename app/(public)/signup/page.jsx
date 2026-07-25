'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerUser } from "../../../slices/authSlice";
import { UserRound, UserCheck, Briefcase } from "lucide-react";

const YEARS_OPTIONS = [
  { label: '0-2 years', value: '0-2' },
  { label: '3-5 years', value: '3-5' },
  { label: '6-10 years', value: '6-10' },
  { label: '10+ years', value: '10+' },
];

const CATEGORIES = [
  { label: 'Frontend', value: 'Frontend' },
  { label: 'Backend', value: 'Backend' },
  { label: 'Fullstack', value: 'Fullstack' },
  { label: 'Mobile', value: 'Mobile' },
  { label: 'DevOps', value: 'DevOps' },
  { label: 'System Design', value: 'System Design' },
  { label: 'Behavioral', value: 'Behavioral' },
];

const baseSchema = z.object({
    firstName: z.string().min(3, "Minimum character should be 3"),
    emailId: z.string().email("Invalid Email"),
    phoneNumber: z.string().min(10, "Phone number must be at least 10 digits").max(10, "Phone number is too long"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Must contain at least one uppercase letter")
        .regex(/[a-z]/, "Must contain at least one lowercase letter")
        .regex(/[0-9]/, "Must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
    confirmPassword: z.string(),
});

const signupSchema = z.discriminatedUnion("role", [
    baseSchema.extend({ role: z.literal("user-interviewee") }),
    baseSchema.extend({
        role: z.literal("user-interviewer"),
        title: z.string().min(1, "Title is required"),
        company: z.string().min(1, "Company is required"),
        yearsExp: z.string().min(1, "Years of experience is required"),
        categories: z.array(z.string()).min(1, "Select at least one category"),
        bio: z.string().min(10, "Bio must be at least 10 characters").max(300, "Bio is too long"),
        upiId: z.string().min(1, "UPI ID is required").regex(/^[\w.-]+@[\w.-]+$/, "Invalid UPI ID format (e.g. name@bank)"),
    })
]);

export default function Signup() {
    const [showPassword, setShowPassword] = useState(false);
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const dispatch = useDispatch();
    const router = useRouter();
    const { isAuthenticated, loading, error: authError } = useSelector((state) => state.auth);

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            role: 'user-interviewee',
            categories: [],
        }
    });

    const selectedRole = watch('role');
    const selectedYearsExp = watch('yearsExp');
    const selectedCategories = watch('categories') || [];

    const toggleCategory = (val) => {
        if (selectedCategories.includes(val)) {
            setValue('categories', selectedCategories.filter((c) => c !== val));
        } else {
            setValue('categories', [...selectedCategories, val]);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            router.push('/');
        }
    }, [isAuthenticated, router]);

    const onSubmit = (data) => {
        if (data.password !== data.confirmPassword) {
            setConfirmPasswordError("Passwords don't match");
            return;
        }
        setConfirmPasswordError("");
        dispatch(registerUser(data));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-lg">
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
                    <div className="text-center px-8 pt-8">
                        <div className="w-15 h-15 rounded-full bg-white/20 mx-auto flex items-center justify-center mb-5">
                            <UserRound />
                        </div>
                        <h1 className="text-4xl font-bold text-white">Create Account</h1>
                    </div>

                    <div className="p-8">
                        {authError && (
                            <div className="mb-5 p-4 rounded-xl bg-red-500/20 border border-red-400 text-red-200 text-center font-medium">
                                {authError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            {/* Role Selection */}
                            <div>
                                <label className="block text-white text-lg mb-2 font-medium">
                                    I am joining as a
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setValue('role', 'user-interviewee')}
                                        className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all cursor-pointer ${selectedRole === 'user-interviewee'
                                                ? 'bg-white text-purple-700 border-white font-bold shadow-lg scale-[1.02]'
                                                : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                                            }`}
                                    >
                                        <UserCheck className="h-7 w-7 mb-1" />
                                        <span className="text-base">Interviewee</span>
                                        <span className="text-xs opacity-75">Practice Interviews</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setValue('role', 'user-interviewer')}
                                        className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all cursor-pointer ${selectedRole === 'user-interviewer'
                                                ? 'bg-white text-purple-700 border-white font-bold shadow-lg scale-[1.02]'
                                                : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                                            }`}
                                    >
                                        <Briefcase className="h-7 w-7 mb-1" />
                                        <span className="text-base">Interviewer</span>
                                        <span className="text-xs opacity-75">Conduct Interviews</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-white text-lg mb-2 font-medium">
                                    First Name
                                </label>

                                <input
                                    type="text"
                                    placeholder="John"
                                    {...register("firstName")}
                                    className={`w-full rounded-xl bg-white/20 border ${errors.firstName
                                        ? "border-red-400"
                                        : "border-white/20"
                                        } px-5 py-2 text-white placeholder:text-white/60 outline-none focus:ring-2 focus:ring-white transition`}
                                />

                                {errors.firstName && (
                                    <p className="text-red-300 mt-2 text-md">
                                        {errors.firstName.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-white text-lg mb-2 font-medium">
                                    Email Address
                                </label>

                                <input
                                    type="email"
                                    placeholder="john@example.com"
                                    {...register("emailId")}
                                    className={`w-full rounded-xl bg-white/20 border ${errors.emailId
                                        ? "border-red-400"
                                        : "border-white/20"
                                        } px-5 py-2 text-white placeholder:text-white/60 outline-none focus:ring-2 focus:ring-white transition`}
                                />

                                {errors.emailId && (
                                    <p className="text-red-300 mt-2 text-md">
                                        {errors.emailId.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-white text-lg mb-2 font-medium">
                                    Phone Number
                                </label>

                                <input
                                    type="tel"
                                    maxLength={10}
                                    placeholder="+1234567890"
                                    {...register("phoneNumber")}
                                    className={`w-full rounded-xl bg-white/20 border ${errors.phoneNumber
                                        ? "border-red-400"
                                        : "border-white/20"
                                        } px-5 py-2 text-white placeholder:text-white/60 outline-none focus:ring-2 focus:ring-white transition`}
                                />

                                {errors.phoneNumber && (
                                    <p className="text-red-300 mt-2 text-md">
                                        {errors.phoneNumber.message}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-white text-lg mb-2 font-medium">
                                    Password
                                </label>

                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        {...register("password")}
                                        className={`w-full rounded-xl bg-white/20 border ${errors.password
                                            ? "border-red-400"
                                            : "border-white/20"
                                            } px-5 pr-14 py-2 text-white placeholder:text-white/60 outline-none focus:ring-2 focus:ring-white transition`}
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

                            <div>
                                <label className="block text-white text-lg mb-2 font-medium">
                                    Confirm Password
                                </label>

                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    {...register("confirmPassword")}
                                    className={`w-full rounded-xl bg-white/20 border ${confirmPasswordError
                                        ? "border-red-400"
                                        : "border-white/20"
                                        } px-5 py-2 text-white placeholder:text-white/60 outline-none focus:ring-2 focus:ring-white transition`}
                                />

                                {confirmPasswordError && (
                                    <p className="text-red-300 mt-2 text-md">
                                        {confirmPasswordError}
                                    </p>
                                )}
                            </div>

                            {selectedRole === 'user-interviewer' && (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-6 mt-6">
                                    <h3 className="text-xl font-semibold text-white">Interviewer Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-2">
                                            <label htmlFor="title" className="text-white">Current title</label>
                                            <input
                                                id="title"
                                                placeholder="Senior Software Engineer"
                                                {...register("title")}
                                                className={`w-full rounded-xl bg-white/20 border ${errors.title ? "border-red-400" : "border-white/20"} px-5 py-2 text-white placeholder:text-white/60 outline-none focus:ring-2 focus:ring-white transition`}
                                            />
                                            {errors.title && <p className="text-red-300 text-sm">{errors.title.message}</p>}
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label htmlFor="company" className="text-white">Company</label>
                                            <input
                                                id="company"
                                                placeholder="Google, Meta, Startup…"
                                                {...register("company")}
                                                className={`w-full rounded-xl bg-white/20 border ${errors.company ? "border-red-400" : "border-white/20"} px-5 py-2 text-white placeholder:text-white/60 outline-none focus:ring-2 focus:ring-white transition`}
                                            />
                                            {errors.company && <p className="text-red-300 text-sm">{errors.company.message}</p>}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-white">Years of Experience</label>
                                        <div className="flex flex-wrap gap-2">
                                            {YEARS_OPTIONS.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => setValue('yearsExp', opt.value, { shouldValidate: true })}
                                                    className={`text-sm px-4 py-2 rounded-lg border transition-colors ${selectedYearsExp === opt.value
                                                        ? "border-yellow-400/80 bg-yellow-400/20 text-yellow-300 font-medium"
                                                        : "border-white/20 text-white/70 hover:bg-white/10"
                                                        }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                        {errors.yearsExp && <p className="text-red-300 text-sm">{errors.yearsExp.message}</p>}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-white">Categories</label>
                                        <div className="flex flex-wrap gap-2">
                                            {CATEGORIES.map((cat) => {
                                                const active = selectedCategories.includes(cat.value);
                                                return (
                                                    <button
                                                        key={cat.value}
                                                        type="button"
                                                        onClick={() => toggleCategory(cat.value)}
                                                        className={`text-sm px-4 py-2 rounded-lg border transition-colors ${active
                                                            ? "border-yellow-400/80 bg-yellow-400/20 text-yellow-300 font-medium"
                                                            : "border-white/20 text-white/70 hover:bg-white/10"
                                                            }`}
                                                    >
                                                        {cat.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {errors.categories && <p className="text-red-300 text-sm">{errors.categories.message}</p>}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="bio" className="text-white">Bio</label>
                                        <textarea
                                            id="bio"
                                            rows={4}
                                            maxLength={300}
                                            placeholder="Tell interviewees about your background, what you specialise in, and what they can expect from a session with you."
                                            {...register("bio")}
                                            className={`w-full rounded-xl bg-white/20 border ${errors.bio ? "border-red-400" : "border-white/20"} px-5 py-3 text-white placeholder:text-white/60 outline-none focus:ring-2 focus:ring-white transition resize-none`}
                                        />
                                        {errors.bio && <p className="text-red-300 text-sm">{errors.bio.message}</p>}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="upiId" className="text-white">UPI ID (for payouts)</label>
                                        <input
                                            id="upiId"
                                            type="text"
                                            placeholder="e.g. username@bank"
                                            {...register("upiId")}
                                            className={`w-full rounded-xl bg-white/20 border ${errors.upiId ? "border-red-400" : "border-white/20"} px-5 py-3 text-white placeholder:text-white/60 outline-none focus:ring-2 focus:ring-white transition`}
                                        />
                                        {errors.upiId && <p className="text-red-300 text-sm">{errors.upiId.message}</p>}
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-14 rounded-xl bg-white text-purple-700 font-bold text-xl transition-all duration-300 disabled:opacity-70 disabled:scale-100 cursor-pointer hover:bg-yellow-300 hover:text-black"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center min-h-screen">
                                        <span className="loading loading-spinner loading-xl text-secondary"></span>
                                    </div>
                                ) : (
                                    "Create Account"
                                )}
                            </button>
                        </form>

                        <p className="text-center mt-8 text-white/80">
                            Already have an account?{" "}
                            <Link
                                href="/login"
                                className="font-semibold text-white underline hover:text-yellow-300"
                            >
                                Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
