import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import logo from "../backround/logo.png";
import bgImage from "../backround/image.png";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Register() {
  const nav = useNavigate();
  const { register, googleLogin, loading, error, clearError } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", displayName: "" });

  useEffect(() => {
    // Load Google Identity Services
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google && GOOGLE_CLIENT_ID) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });
        window.google.accounts.id.renderButton(
          document.getElementById('google-signup-btn'),
          { 
            theme: 'outline', 
            size: 'large', 
            width: '100%',
            text: 'signup_with',
            shape: 'rectangular'
          }
        );
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleGoogleResponse = async (response) => {
    try {
      await googleLogin(response.credential);
      toast.success("Account created successfully! 🎉");
      nav("/dashboard");
    } catch (err) {
      toast.error("Google signup failed. Please try again.");
      console.error("Google signup error:", err);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    clearError();
    try {
      await register(form);
      toast.success("Account created successfully! 🎉");
      nav("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed. Please try again.");
    }
  };

  return (
    <>
      {/* Background Image Overlay */}
      <div 
        className="fixed inset-0 z-10"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/30"></div>
      </div>
      
      {/* Content */}
      <div className="min-h-screen flex items-center justify-center p-4 relative z-20">
        <div className="max-w-md w-full">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8">
            <div className="text-center mb-8">
              <img src={logo} alt="MindBridge" className="w-16 h-16 rounded-2xl mx-auto mb-4 object-cover" />
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">Create account</h1>
            <p className="text-gray-600">Join MindBridge today</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Google Sign-Up Button */}
          <div className="mb-6">
            <div id="google-signup-btn" className="flex justify-center"></div>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-500">or continue with email</span>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Display Name</label>
              <input
                type="text"
                value={form.displayName}
                onChange={(e) => setForm({...form, displayName: e.target.value})}
                className="input"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
                className="input"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})}
                className="input"
                placeholder="Create a password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-gray-600 text-sm">Already have an account? </span>
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}