import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
export default function App() {
  const { user, loading, error, retry, logout } = useAuth();
  if (loading)
    return (
      <div
        className="grid min-h-screen place-items-center text-slate-500"
        role="status"
      >
        Loading your workspace…
      </div>
    );
  if (error)
    return (
      <main className="mx-auto max-w-lg p-10">
        <p role="alert" className="error mb-4">
          {error}
        </p>
        <button className="btn-primary" onClick={retry}>
          Try again
        </button>
        <button className="btn-secondary ml-3" onClick={logout}>
          Back to login
        </button>
      </main>
    );
  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <AuthPage />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/" replace /> : <AuthPage register />}
      />
      <Route
        path="/"
        element={user ? <Dashboard /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
