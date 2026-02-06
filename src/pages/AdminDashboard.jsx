import React, { useState, useEffect } from "react";
import { collection, addDoc, updateDoc, doc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { QRCodeCanvas } from "qrcode.react";
import { useAuth } from "../context/AuthContext";
import { Shield, QrCode, ClipboardList, LogOut, RefreshCw, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MonthlyReport from "../components/MonthlyReport";
import toast from "react-hot-toast";

const AdminDashboard = () => {
    const { currentUser, userRole } = useAuth();
    const [activeTab, setActiveTab] = useState("qr");
    const [sessionId, setSessionId] = useState("");
    const [qrToken, setQrToken] = useState("");
    const [classId] = useState("CS101"); // Default class
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(11);

    // 🛡️ Admin Access Check
    const ADMIN_WHITELIST = ["sultanark2004@gmail.com"];
    const isAuthorized = ADMIN_WHITELIST.includes(currentUser?.email);

    // 🔄 Rotating QR Logic (11 seconds)
    useEffect(() => {
        if (!sessionId) return;

        const rotateTimer = setInterval(async () => {
            if (timeLeft > 1) {
                setTimeLeft(prev => prev - 1);
            } else {
                // Time to rotate
                const newToken = Math.random().toString(36).substring(2, 15);
                setQrToken(newToken);
                setTimeLeft(11);

                try {
                    const sessionRef = doc(db, `classes/${classId}/sessions`, sessionId);
                    await updateDoc(sessionRef, {
                        qrToken: newToken,
                        lastRotation: serverTimestamp()
                    });
                } catch (err) {
                    console.error("Rotation sync error:", err);
                }
            }
        }, 1000);

        return () => clearInterval(rotateTimer);
    }, [sessionId, timeLeft, classId]);

    const startSession = async () => {
        setLoading(true);
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const initialToken = Math.random().toString(36).substring(2, 15);
                const sessionRef = await addDoc(collection(db, `classes/${classId}/sessions`), {
                    active: true,
                    qrToken: initialToken,
                    centerLat: pos.coords.latitude,
                    centerLng: pos.coords.longitude,
                    radius: 100,
                    createdAt: serverTimestamp(),
                    lastRotation: serverTimestamp()
                });
                setSessionId(sessionRef.id);
                setQrToken(initialToken);
                setTimeLeft(11);
                toast.success("Attendance checking started!", {
                    style: { borderRadius: '1rem', background: '#333', color: '#fff' }
                });
            } catch (err) {
                toast.error("Failed to start session");
                console.error(err);
            } finally {
                setLoading(false);
            }
        }, (err) => {
            toast.error("GPS required for Geofencing");
            setLoading(false);
        });
    };

    const stopSession = async () => {
        if (!sessionId) return;
        try {
            await updateDoc(doc(db, `classes/${classId}/sessions`, sessionId), {
                active: false
            });
            setSessionId("");
            setQrToken("");
            toast("Session Closed", { icon: '🛑' });
        } catch (err) {
            console.error(err);
        }
    };

    if (!isAuthorized) {
        return (
            <div className="flex h-screen items-center justify-center bg-black text-white p-6">
                <div className="glass p-8 rounded-[2rem] text-center max-w-sm border border-red-500/20">
                    <Shield className="mx-auto text-red-500 mb-4" size={48} />
                    <h1 className="text-xl font-bold mb-2 tracking-tight">Access Restricted</h1>
                    <p className="text-white/40 text-sm mb-6">Your email ({currentUser?.email}) is not authorized for Admin access.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0f1e] text-white p-4 md:p-8 selection:bg-ios-blue selection:text-white">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-ios-blue flex items-center justify-center ios-shadow">
                            <Layers className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter">ADMIN CORE</h1>
                            <p className="text-xs text-white/30 uppercase tracking-widest font-bold">Attendance Systems v4.2</p>
                        </div>
                    </div>

                    {/* iOS Tab Switcher */}
                    <nav className="inline-flex p-1 bg-white/5 rounded-2xl border border-white/5 glass">
                        <button
                            onClick={() => setActiveTab("qr")}
                            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === 'qr' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
                        >
                            <QrCode size={18} /> QR Manager
                        </button>
                        <button
                            onClick={() => setActiveTab("reports")}
                            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === 'reports' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
                        >
                            <ClipboardList size={18} /> Monthly List
                        </button>
                    </nav>
                </header>

                <main>
                    <AnimatePresence mode="wait">
                        {activeTab === "qr" ? (
                            <motion.div
                                key="qr-tab"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                            >
                                {/* QR Display Card */}
                                <div className="lg:col-span-12">
                                    <div className="glass rounded-[2rem] p-8 md:p-12 text-center border border-white/10 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                                            <motion.div
                                                className="h-full bg-ios-blue"
                                                initial={{ width: "100%" }}
                                                animate={{ width: "0%" }}
                                                transition={{ duration: 11, ease: "linear", repeat: Infinity }}
                                                key={qrToken}
                                            />
                                        </div>

                                        {!sessionId ? (
                                            <div className="py-20">
                                                <QrCode className="mx-auto text-white/10 mb-6" size={120} strokeWidth={1} />
                                                <h2 className="text-3xl font-bold mb-8">Ready to start?</h2>
                                                <button
                                                    onClick={startSession}
                                                    disabled={loading}
                                                    className="px-10 py-4 bg-ios-blue hover:bg-blue-600 active:scale-95 transition-all text-white rounded-2xl font-bold text-lg ios-shadow disabled:opacity-50"
                                                >
                                                    {loading ? "INITIALIZING GPS..." : "START NEW SESSION"}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <div className="mb-6 px-4 py-2 bg-green-500/10 text-green-400 rounded-full text-xs font-bold tracking-widest uppercase border border-green-500/20 flex items-center gap-2">
                                                    <RefreshCw size={12} className="animate-spin" />
                                                    Active & Rotating
                                                </div>

                                                <div className="bg-white p-8 rounded-[3rem] ios-shadow mb-8 border-8 border-white/10">
                                                    <QRCodeCanvas
                                                        value={`${window.location.origin}/mark-attendance/${sessionId}?t=${qrToken}`}
                                                        size={280}
                                                        level="H"
                                                        includeMargin={false}
                                                    />
                                                </div>

                                                <div className="flex items-center gap-4 mb-10">
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-black">Security Token</p>
                                                        <p className="font-mono text-xl text-white font-bold">{qrToken}</p>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-ios-blue">
                                                        {timeLeft}s
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={stopSession}
                                                    className="px-8 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all rounded-2xl font-bold text-sm border border-red-500/10"
                                                >
                                                    TERMINATE SESSION
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="reports-tab"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="glass rounded-[2.5rem] p-8 pb-12 border border-white/10"
                            >
                                <MonthlyReport classId={classId} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>

            {/* Background Decorations */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-ios-blue/10 blur-[120px] rounded-full -z-10" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full -z-10" />
        </div>
    );
};

export default AdminDashboard;