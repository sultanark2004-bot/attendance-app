import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { getDistance } from "geolib";
import { useAuth } from "../context/AuthContext";

function MarkAttendance() {
    const { token } = useParams();
    const { currentUser } = useAuth();
    const [message, setMessage] = useState("Checking Profile...");
    const [status, setStatus] = useState("verifying");

    useEffect(() => {
        if (!token || !currentUser) return;

        const processAttendance = async () => {
            try {
                // 1. Fetch Session Data
                const sessionSnap = await getDoc(doc(db, "sessions", token));
                if (!sessionSnap.exists()) throw new Error("QR Code is invalid or expired.");
                const sessionData = sessionSnap.data();

                // 2. Fetch User/Student Profile (Syncing your two formats)
                const userRef = doc(db, "users", currentUser.uid);
                const userSnap = await getDoc(userRef);
                const userData = userSnap.exists() ? userSnap.data() : {};

                // Field Mapping: Check for 'name' first (Student format), then 'displayName' (User format)
                const studentName = userData.name || userData.displayName || currentUser.displayName || "Unknown Student";
                const rollNo = userData.rollNo || "N/A";

                setMessage("Verifying Location...");

                navigator.geolocation.getCurrentPosition(async (pos) => {
                    const dist = getDistance(
                        { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
                        { latitude: sessionData.centerLat, longitude: sessionData.centerLng }
                    );

                    // Radius check (using the 50m from your session or defaulting to 100m)
                    const allowedRadius = sessionData.radius || 100;

                    if (dist > allowedRadius) {
                        setStatus("error");
                        setMessage(`Too far! You are ${dist}m away. Limit is ${allowedRadius}m.`);
                        return;
                    }

                    // 3. Save Attendance with the clean fields
                    await addDoc(collection(db, "attendance"), {
                        sessionId: token,
                        uid: currentUser.uid,
                        studentName: studentName,
                        rollNo: rollNo,
                        className: sessionData.name || "General Class",
                        timestamp: serverTimestamp(),
                        status: "Present"
                    });

                    setStatus("success");
                    setMessage(`Success! ${studentName}, your attendance is marked.`);
                }, (err) => {
                    setStatus("error");
                    setMessage("GPS Error: Please enable location services in your browser settings.");
                });
            } catch (err) {
                setStatus("error");
                setMessage(err.message);
            }
        };

        processAttendance();
    }, [token, currentUser]);

    return (
        <div className="flex h-screen items-center justify-center bg-black text-white p-6">
            <div className="bg-gray-900 border border-blue-600 p-8 rounded-2xl text-center w-full max-w-sm shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                <h2 className="text-blue-500 font-black text-2xl mb-4 tracking-tighter uppercase">Scanner</h2>
                <div className={`p-4 rounded-lg font-medium ${status === "error" ? "bg-red-900/20 text-red-400" : "bg-blue-900/20 text-blue-300"}`}>
                    {message}
                </div>
                {status === "success" && (
                    <div className="mt-4 text-green-400 animate-bounce">✓ Verified</div>
                )}
            </div>
        </div>
    );
}

export default MarkAttendance;