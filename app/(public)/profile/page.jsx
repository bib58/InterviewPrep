'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { updateUser, logoutUser, deleteUser } from "../../../slices/authSlice";
import { User, Mail, Phone, Briefcase, Edit2, Save, LogOut, Trash2 } from "lucide-react";

export default function ProfilePage() {
    const dispatch = useDispatch();
    const router = useRouter();
    const { user, isAuthenticated, loading, error } = useSelector((state) => state.auth);

    const [isEditing, setIsEditing] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (!isAuthenticated && !loading) {
            router.push('/login');
        }
    }, [isAuthenticated, loading, router]);

    useEffect(() => {
        if (user) {
            setFirstName(user.firstName || '');
        }
    }, [user]);

    const handleSave = async () => {
        if (!firstName.trim()) return;

        try {
            await dispatch(updateUser({ firstName })).unwrap();
            setIsEditing(false);
            setSuccessMessage('Profile updated successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error('Failed to update profile:', err);
        }
    };

    const handleLogout = async () => {
        try {
            await dispatch(logoutUser()).unwrap();
            router.push('/');
        } catch (err) {
            console.error('Failed to logout:', err);
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
        try {
            await dispatch(deleteUser()).unwrap();
            router.push('/signup');
        } catch (err) {
            console.error('Failed to delete account:', err);
        }
    };

    if (!user) return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center">
            <span className="loading loading-spinner loading-xl text-white"></span>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center px-4 py-10 mt-12">
            <div className="w-full max-w-2xl">
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl overflow-hidden relative">
                    <div className="h-32 bg-white/5 relative">
                        <div className="absolute -bottom-12 left-8">
                            <div className="w-24 h-24 rounded-full">
                                <img
                                    src={`https://images.unsplash.com/photo-1781757595926-d34ba27d3fa0?q=80&w=1997&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D`}
                                    alt="Nature"
                                    className="w-full h-full rounded-full object-cover border-4 border-white/20"
                                />
                            </div>
                        </div>
                        <div className="absolute top-6 right-6">
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all backdrop-blur-md"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    <span>Edit Profile</span>
                                </button>
                            ) : (
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-indigo-900 font-bold rounded-full transition-all shadow-lg disabled:opacity-70"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="pt-16 px-8 pb-8">
                        <h1 className="text-3xl font-bold text-white mb-1">{user.firstName}</h1>
                        <p className="text-white/70 mb-6 text-lg capitalize">{user.role?.replace(/user[- ]?/i, '').replace('-', ' ')}</p>

                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-400 text-red-200">
                                {error}
                            </div>
                        )}
                        {successMessage && (
                            <div className="mb-6 p-4 rounded-xl bg-green-500/20 border border-green-400 text-green-200">
                                {successMessage}
                            </div>
                        )}

                        <div className="space-y-6">

                            <div className="group">
                                <label className="flex items-center gap-2 text-white/80 text-md mb-2 font-medium">
                                    <User className="w-4 h-4" /> First Name
                                </label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    disabled={!isEditing}
                                    className={`w-full rounded-xl px-5 py-3 text-white text-lg transition-all ${isEditing
                                        ? "bg-white/20 border border-white/40 focus:ring-2 focus:ring-yellow-400 outline-none"
                                        : "bg-white/5 border border-white/10 cursor-not-allowed opacity-80"
                                        }`}
                                />
                            </div>


                            <div className="group">
                                <label className="flex items-center gap-2 text-white/80 text-md mb-2 font-medium">
                                    <Mail className="w-4 h-4" /> Email Address
                                </label>
                                <input
                                    type="email"
                                    value={user.emailId}
                                    disabled
                                    className="w-full text-lg rounded-xl px-5 py-3 text-white bg-white/5 border border-white/10 cursor-not-allowed opacity-70"
                                />
                                <p className="text-sm text-white/50 mt-1">Email cannot be changed.</p>
                            </div>


                            <div className="group">
                                <label className="flex items-center gap-2 text-white/80 text-md mb-2 font-medium">
                                    <Phone className="w-4 h-4" /> Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={user.phoneNumber || 'Not provided'}
                                    disabled
                                    className="w-full rounded-xl px-5 text-lg py-3 text-white bg-white/5 border border-white/10 cursor-not-allowed opacity-70"
                                />
                                <p className="text-sm text-white/50 mt-1">Phone number cannot be changed.</p>
                            </div>


                            <div className="group">
                                <label className="flex items-center gap-2 text-white/80 text-md mb-2 font-medium">
                                    <Briefcase className="w-4 h-4" /> Account Role
                                </label>
                                <input
                                    type="text"
                                    value={user.role}
                                    disabled
                                    className="w-full rounded-xl px-5 text-lg py-3 text-white bg-white/5 border border-white/10 cursor-not-allowed opacity-70 capitalize"
                                />
                            </div>
                        </div>


                        <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row gap-4 justify-between">
                            <button
                                onClick={handleLogout}
                                disabled={loading}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={loading}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-500/40 border border-red-500/50 text-black font-medium rounded-xl cursor-pointer transition-all disabled:opacity-50"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Account
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
