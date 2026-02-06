import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, query, orderBy, getDocs } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { CSVLink } from 'react-csv';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('live'); // 'live' or 'monthly'
    const [selectedClass, setSelectedClass] = useState('Class-A');
    const [students, setStudents] = useState([]);
    const [sessionId, setSessionId] = useState("");
    const [timeLeft, setTimeLeft] = useState(11);

    const classList = ['Class-A', 'Class-B', 'Class-C'];

    // 1. iOS-Style QR Rotation Logic
    useEffect(() => {
        const rotateQR = async () => {
            const newId = Math.random().toString(36).substring(2, 9);
            setSessionId(newId);
            setTimeLeft(11);
            await setDoc(doc(db, "classes", selectedClass, "session", "current"), {
                id: newId,
                expires: Date.now() + 11000
            });
        };
        rotateQR();
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    rotateQR();
                    return 11;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [selectedClass]);

    // 2. Real-time Attendance Listener
    useEffect(() => {
        const q = query(collection(db, "classes", selectedClass, "attendance"), orderBy("timestamp", "desc"));
        return onSnapshot(q, (snap) => {
            setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
    }, [selectedClass]);

    const qrLink = `${window.location.origin}/mark-attendance/${selectedClass}/${sessionId}`;

    return (
        <div className="min-h-screen bg-ios-bg p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-10">
                    <div className="flex gap-4">
                        {classList.map(c => (
                            <button
                                key={c}
                                onClick={() => setSelectedClass(c)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedClass === c ? 'bg-ios-blue text-white' : 'bg-white/50 text-gray-500'}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                    <div className="bg-gray-200/50 p-1 rounded-2xl flex">
                        <button
                            onClick={() => setActiveTab('live')}
                            className={`px-6 py-2 rounded-xl text-sm font-bold ${activeTab === 'live' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                        >
                            Live QR
                        </button>
                        <button
                            onClick={() => setActiveTab('monthly')}
                            className={`px-6 py-2 rounded-xl text-sm font-bold ${activeTab === 'monthly' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                        >
                            Analytics
                        </button>
                    </div>
                </header>

                {activeTab === 'live' ? (
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* QR Card */}
                        <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-8 shadow-xl border border-white flex flex-col items-center">
                            <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold mb-4">ACTIVE: {selectedClass}</span>
                            <div className="p-4 bg-white rounded-3xl shadow-inner mb-6">
                                <QRCodeSVG value={qrLink} size={220} />
                            </div>
                            <p className="text-gray-400 text-sm">Refreshing in <span className="text-blue-600 font-mono font-bold">{timeLeft}s</span></p>
                        </div>
                        {/* Live List */}
                        <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-8 shadow-xl border border-white">
                            <h2 className="text-xl font-bold mb-4">Recent Scans</h2>
                            <div className="space-y-3">
                                {students.slice(0, 5).map(s => (
                                    <div key={s.id} className="flex justify-between items-center bg-white/50 p-4 rounded-2xl">
                                        <span className="font-semibold">{s.name}</span>
                                        <span className="text-xs text-gray-400">{s.timestamp?.toDate().toLocaleTimeString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Monthly View with Red Flags */
                    <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-8 shadow-xl border border-white overflow-x-auto">
                        <div className="flex justify-between mb-6">
                            <h2 className="text-xl font-bold">Attendance Analysis</h2>
                            <CSVLink data={students} filename="report.csv" className="text-blue-600 font-semibold text-sm">Export CSV</CSVLink>
                        </div>
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-gray-400 text-xs uppercase tracking-widest border-b">
                                    <th className="pb-4">Student</th>
                                    <th className="pb-4">Absences</th>
                                    <th className="pb-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {students.map(s => {
                                    const isCritical = (s.absences || 0) >= 4;
                                    return (
                                        <tr key={s.id} className="group">
                                            <td className="py-4 font-medium">{s.name}</td>
                                            <td className={`py-4 font-bold ${isCritical ? 'text-red-500' : 'text-gray-700'}`}>{s.absences || 0}</td>
                                            <td className="py-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${isCritical ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                    {isCritical ? 'DROPOUT RISK' : 'STABLE'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;