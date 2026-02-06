import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
    const navigate = useNavigate();
    return (
        <div className="flex h-screen flex-col items-center justify-center bg-slate-900 text-white">
            <h1 className="mb-4 text-4xl font-bold text-red-500">403</h1>
            <h2 className="mb-6 text-2xl font-semibold">Access Denied</h2>
            <p className="mb-8 text-slate-400">You do not have permission to view this page.</p>
            <button
                onClick={() => navigate("/")}
                className="rounded bg-blue-600 px-6 py-2 hover:bg-blue-700"
            >
                Go Home
            </button>
        </div>
    );
};

export default Unauthorized;
