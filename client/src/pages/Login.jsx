import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import AuthContext from "../context/AuthContext";
import ErrorAlert from "../components/ErrorAlert";
import GoogleLoginButton from "../components/GoogleLoginButton";

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card auth-card">
      <div className="card-body">
        <h2 className="auth-title">Accedi</h2>
        <p className="auth-subtitle mb-4">
          Bentornato! Inserisci le tue credenziali.
        </p>

        <ErrorAlert message={error} />

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <div className="input-group">
              <span className="input-group-text">
                <Mail size={16} />
              </span>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label">Password</label>
            <div className="input-group">
              <span className="input-group-text">
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="input-group-text input-group-icon-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Nascondi password" : "Mostra password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? "Accesso in corso..." : "Accedi"}
          </button>
        </form>

        <div className="auth-divider" role="separator">
          <span>oppure</span>
        </div>

        <GoogleLoginButton text="continue_with" onError={setError} onSuccess={() => navigate("/")} />

        <p className="auth-switch">
          Non hai un account? <Link to="/register">Registrati</Link>
        </p>
      </div>
    </div>
  );
}
