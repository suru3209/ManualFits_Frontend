"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { safeLocalStorage } from "@/lib/storage";
import { buildApiUrl, API_ENDPOINTS } from "@/lib/api";
import jwt from "jsonwebtoken";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    confirmPassword: "",
  });
  const [randomTagline, setRandomTagline] = useState("");
  const [loading, setLoading] = useState(false);

  const loginTaglines = [
    "Welcome back! Missed you like cookies miss milk",
    "Aao kabhi haveli pe... login to kar lo pehle!",
    "Login karo, duniya apki mutthi mein!",
    "Kya baat hai! Wapas aaye? Chalo login karo!",
    "Your account was getting lonely... Login karo!",
  ];

  const signupTaglines = [
    "New here? Welcome to the party!",
    "Join the club! Membership is free (like chai)",
    "Sign up karo, life jhingalala ho jayegi!",
    "Ready to begin your epic journey? Let's go!",
    "Account banao, shopping shuru karo!",
  ];

  // Random tagline
  useEffect(() => {
    const currentTaglines = isLogin ? loginTaglines : signupTaglines;
    const randomIndex = Math.floor(Math.random() * currentTaglines.length);
    setRandomTagline(currentTaglines[randomIndex]);
  }, [isLogin]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { username, email, password, confirmPassword } = formData;

    if (!email || !password || (!isLogin && !username)) {
      alert("Please fill all required fields");
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? "login" : "signup";
      const body = isLogin
        ? { email, password }
        : { username, email, password };

      const res = await fetch(
        buildApiUrl(`${API_ENDPOINTS.AUTH_BASE}/${endpoint}`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Something went wrong!");
        return;
      }

      console.log("Success:", data);

      // Save user data and token in localStorage
      safeLocalStorage.setItem("user", JSON.stringify(data.user));
      if (data.token) {
        safeLocalStorage.setItem("token", data.token);
        console.log("Token saved:", data.token);
      } else {
        console.error("No token received from server");
        // Generate a proper JWT token for testing
        const testToken = jwt.sign(
          { id: data.user.id, email: data.user.email },
          "your-secret-key-here",
          { expiresIn: "7d" }
        );
        safeLocalStorage.setItem("token", testToken);
        console.log("Using generated test token:", testToken);
      }

      if (isLogin) {
        // Redirect to home page with page refresh
        window.location.href = "/";
      } else {
        // Auto-login after successful signup
        alert("Signup successful! You are now logged in.");
        window.location.href = "/";
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-300 flex items-center justify-center p-4 pt-15">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 p-6 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isLogin ? "Welcome Back!" : "Join Us!"}
          </h1>
          <p className="text-white text-lg">
            {randomTagline ||
              (isLogin ? "Welcome back!" : "Join our community!")}
          </p>
        </div>

        {/* Toggle Buttons */}
        <div className="flex border-b">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-4 font-semibold text-center transition-all ${
              isLogin
                ? "bg-gray-50 text-black border-b-2 border-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-4 font-semibold text-center transition-all ${
              !isLogin
                ? "bg-gray-50 text-black border-b-2 border-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your cool username"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>
          )}

          {isLogin && (
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded text-blue-500" />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-sm text-blue-500 hover:text-blue-700">
                Forgot password?
              </a>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all transform hover:scale-105"
            disabled={loading}
          >
            {loading ? "Processing..." : isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 text-center">
          <p className="text-sm text-gray-600">
            {isLogin ? "New here? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-500 hover:text-blue-700 font-semibold"
            >
              {isLogin ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
