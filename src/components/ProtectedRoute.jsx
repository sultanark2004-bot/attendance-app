import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const ProtectedRoute = ({ children, requiredRole }) => {
    const { currentUser, userRole, loading } = useAuth();
    const location = useLocation();

    if (loading) return null;

    if (!currentUser) {
        // Redirect to login but save where they were trying to go
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // --- FLEXIBLE ROLE CHECK ---
    // If you are trying to reach /admin and you aren't marked as 'student', we let you in.
    // This solves the 'New User' login issue.
    if (requiredRole === 'admin' && userRole === 'student') {
        return <Navigate to="/unauthorized" replace />;
    }

    // If a specific role is required and you don't match, block it
    // We treat null userRole as 'not authorized yet' or 'failed to load'
    if (requiredRole && userRole !== requiredRole) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export const PublicRoute = ({ children }) => {
    const { currentUser, userRole, loading } = useAuth();
    const location = useLocation();

    if (loading) return null;

    if (currentUser) {
        // If they came from a specific link (like a QR code), send them back there
        if (location.state?.from) {
            return <Navigate to={location.state.from} replace />;
        }

        // Default redirects based on role
        if (userRole === 'admin') {
            return <Navigate to="/admin" replace />;
        } else if (userRole === 'student') {
            return <Navigate to="/student" replace />;
        } else {
            // If no role yet, default to admin for your first setup
            return <Navigate to="/admin" replace />;
        }
    }

    return children;
};