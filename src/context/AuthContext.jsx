import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    const ADMIN_EMAIL = "sultanark2004@gmail.com";

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            try {
                if (user) {
                    setCurrentUser(user);
                    const userRef = doc(db, "users", user.uid);
                    const userDoc = await getDoc(userRef);

                    if (userDoc.exists()) {
                        // FIX: Safely get the role without touching the date
                        setUserRole(userDoc.data().role || "student");
                    } else {
                        const role = user.email === ADMIN_EMAIL ? "admin" : "student";

                        // FIX: When saving new users, we use serverTimestamp
                        await setDoc(userRef, {
                            uid: user.uid,
                            email: user.email,
                            displayName: user.displayName || "New Student",
                            role: role,
                            createdAt: serverTimestamp()
                        });
                        setUserRole(role);
                    }
                } else {
                    setCurrentUser(null);
                    setUserRole(null);
                }
            } catch (error) {
                console.error("Auth Error:", error);
                setUserRole("student");
            } finally {
                setLoading(false);
            }
        });
        return unsubscribe;
    }, []);

    // This is the "White Screen" prevention
    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-black text-white">
                <div className="text-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-xs font-black uppercase tracking-[0.3em]">Authenticating...</p>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ currentUser, userRole, loading }}>
            {children}
        </AuthContext.Provider>
    );
};