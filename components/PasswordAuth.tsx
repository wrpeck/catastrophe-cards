"use client";

import { useState, useEffect } from "react";

interface PasswordAuthProps {
  onAuthenticated: () => void;
}

const PASSWORD = "catastrophe"; // Change this to your desired password

export default function PasswordAuth({ onAuthenticated }: PasswordAuthProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(true);

  // Check if already authenticated
  useEffect(() => {
    const authToken = localStorage.getItem("catastrophe_auth");
    if (authToken === "authenticated") {
      onAuthenticated();
    }
    setIsChecking(false);
  }, [onAuthenticated]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password === PASSWORD) {
      localStorage.setItem("catastrophe_auth", "authenticated");
      onAuthenticated();
    } else {
      setError("Incorrect password");
      setPassword("");
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#474551]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#474551] px-4">
      <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-xl border border-white/20 p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">
          Catastrophe Cards
        </h1>
        <p className="text-white/80 text-center mb-6">
          Please enter the password to continue
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
              autoFocus
            />
            {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
          </div>
          <button
            type="submit"
            className="w-full px-4 py-3 rounded-lg bg-white/20 hover:bg-white/30 text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
