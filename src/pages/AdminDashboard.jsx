import React, { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { QRCodeCanvas } from "qrcode.react";

function AdminDashboard() {
    const [token, setToken] = useState("");
    const [loading, setLoading] = useState(false);

    const generateSession = () => {
        setLoading(true);
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const docRef = await addDoc(collection(db, "sessions"), {
                    name: "Class Session",
                    active: true,
                    centerLat: pos.coords.latitude,
                    centerLng: pos.coords.longitude,
                    radius: 100,
                    createdAt: serverTimestamp()
                });
                setToken(docRef.id);
            } catch (err) {
                alert("Error: " + err.message);
            } finally {
                setLoading(false);
            }
        });
    };

    return (
        <div className="flex h-screen flex-col items-center justify-center bg-[#0a0f1e] text-white">
            <h1 className="mb-8 text-4xl font-bold">Admin Dashboard</h1>
            {!token ? (
                <button onClick={generateSession} className="rounded-lg bg-blue-600 px-8 py-3 font-bold hover:bg-blue-700">
                    {loading ? "Generating..." : "Generate QR Code"}
                </button>
            ) : (
                <div className="rounded-xl bg-white p-6 shadow-2xl text-center">
                    <QRCodeCanvas value={token} size={256} />
                    <p className="mt-4 text-black font-mono text-sm">{token}</p>
                    <button onClick={() => setToken("")} className="mt-4 text-red-600 text-sm font-bold">RESET / STOP</button>
                </div>
            )}
        </div>
    );
}
export default AdminDashboard;