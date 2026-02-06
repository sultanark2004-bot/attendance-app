import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Download, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MonthlyReport = ({ classId = "CS101" }) => {
    const [attendanceData, setAttendanceData] = useState([]);
    const [totalSessions, setTotalSessions] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch total sessions for the class
                const sessionsQuery = query(collection(db, `classes/${classId}/sessions`));
                const sessionsSnap = await getDocs(sessionsQuery);
                setTotalSessions(sessionsSnap.size);

                // 2. Listen to attendance records
                const attendanceQuery = query(
                    collection(db, `classes/${classId}/attendance`),
                    orderBy("timestamp", "desc")
                );

                const unsubscribe = onSnapshot(attendanceQuery, (snapshot) => {
                    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.id, ...doc.data() }));

                    // Group by student
                    const studentMap = {};
                    records.forEach(record => {
                        if (!studentMap[record.uid]) {
                            studentMap[record.uid] = {
                                uid: record.uid,
                                name: record.studentName || "Unknown",
                                rollNo: record.rollNo || "N/A",
                                count: 0,
                                logs: []
                            };
                        }
                        studentMap[record.uid].count += 1;
                        studentMap[record.uid].logs.push(record);
                    });

                    setAttendanceData(Object.values(studentMap));
                    setLoading(false);
                });

                return () => unsubscribe();
            } catch (error) {
                console.error("Error fetching report:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, [classId]);

    const exportToCSV = () => {
        if (attendanceData.length === 0) return;

        const headers = ["Name", "Roll No", "Attendance %", "Absences", "Status"];
        const rows = attendanceData.map(student => {
            const percentage = totalSessions > 0 ? ((student.count / totalSessions) * 100).toFixed(1) : 0;
            const absences = Math.max(0, totalSessions - student.count);
            return [
                student.name,
                student.rollNo,
                `${percentage}%`,
                absences,
                absences >= 4 ? "Critical" : "Good"
            ];
        });

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Attendance_Report_${classId}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="text-center p-10 text-white/50">Loading Analytics...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Monthly Analytics</h2>
                    <p className="text-white/40 text-sm">Class: {classId} • {totalSessions} Total Sessions</p>
                </div>
                <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 transition-all rounded-xl text-white text-sm font-semibold border border-white/10 glass"
                >
                    <Download size={18} />
                    Export CSV
                </button>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-white/10 glass bg-black/20">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 text-white/50 text-xs uppercase tracking-widest">
                            <th className="px-6 py-4 font-bold">Student</th>
                            <th className="px-6 py-4 font-bold">Roll No</th>
                            <th className="px-6 py-4 font-bold text-center">Attendance %</th>
                            <th className="px-6 py-4 font-bold text-center">Absences</th>
                            <th className="px-6 py-4 font-bold">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {attendanceData.map((student) => {
                            const percentage = totalSessions > 0 ? ((student.count / totalSessions) * 100).toFixed(1) : 0;
                            const absences = Math.max(0, totalSessions - student.count);
                            const isCritical = absences >= 4;

                            return (
                                <motion.tr
                                    key={student.uid}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className={`${isCritical ? "bg-red-500/10" : "hover:bg-white/5"} transition-colors`}
                                >
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-white">{student.name}</div>
                                    </td>
                                    <td className="px-6 py-4 text-white/60 font-mono text-sm">{student.rollNo}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col items-center">
                                            <span className={`text-sm font-bold ${isCritical ? "text-red-400" : "text-green-400"}`}>
                                                {percentage}%
                                            </span>
                                            <div className="w-20 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                                                <div
                                                    className={`h-full ${isCritical ? "bg-red-500" : "bg-green-500"}`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center text-white/60 font-medium">{absences}</td>
                                    <td className="px-6 py-4">
                                        {isCritical ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20">
                                                <AlertTriangle size={12} />
                                                CRITICAL
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/20">
                                                <CheckCircle size={12} />
                                                GOOD
                                            </span>
                                        )}
                                    </td>
                                </motion.tr>
                            );
                        })}
                    </tbody>
                </table>
                {attendanceData.length === 0 && (
                    <div className="p-20 text-center text-white/30">
                        No records found for this period.
                    </div>
                )}
            </div>
        </div>
    );
};

export default MonthlyReport;
