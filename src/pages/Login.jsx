import { useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Login = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleGoogleLogin = async () => {
        setLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user exists in 'users' collection
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                // If not exists, create as 'student' by default
                // In a real app, admins might be pre-seeded or manually updated
                await setDoc(userRef, {
                    email: user.email,
                    role: "student",
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    createdAt: serverTimestamp()
                });
                toast.success("Account created! Redirecting...");
            } else {
                toast.success(`Welcome back, ${user.displayName}!`);
            }

            // Navigation is handled by PublicRoute/ProtectedRoute automatically based on AuthContext state update
            // but strictly speaking we can force check or let the effect run.
            // We'll let the routing logic handle the redirect.

        } catch (error) {
            console.error("Login Error:", error);
            toast.error("Login Failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-900 px-4">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-slate-800 p-8 shadow-2xl ring-1 ring-white/10">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-white">
                        Student Attendance
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                        Sign in to mark attendance or manage sessions
                    </p>
                </div>

                <div className="mt-8 space-y-6">
                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="group relative flex w-full justify-center rounded-lg border border-transparent bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:bg-blue-800 disabled:cursor-not-allowed transition-all"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Signing in...
                            </span>
                        ) : (
                            "Sign in with Google"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
