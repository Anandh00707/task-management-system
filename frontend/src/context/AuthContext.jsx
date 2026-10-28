import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "../services/api";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    sessionStorage.getItem("taskflow-token"),
  );
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const logout = useCallback(() => {
    sessionStorage.removeItem("taskflow-token");
    setToken(null);
    setUser(null);
    setError("");
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    if (!token) {
      setLoading(false);
      return () => controller.abort();
    }
    setLoading(true);
    api("/auth/me", { token, signal: controller.signal })
      .then((data) => setUser(data.user))
      .catch((err) => {
        if (err.name === "AbortError") return;
        if (err.status === 401) logout();
        else setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [token, attempt, logout]);
  async function authenticate(mode, body) {
    const data = await api(`/auth/${mode}`, { method: "POST", body });
    sessionStorage.setItem("taskflow-token", data.token);
    setUser(data.user);
    setToken(data.token);
  }
  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        error,
        retry: () => setAttempt((n) => n + 1),
        authenticate,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
