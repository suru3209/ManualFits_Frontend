"use client";
import React, { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
import { safeLocalStorage } from "@/lib/storage";
import { buildApiUrl, API_ENDPOINTS } from "@/lib/api";
import jwt from "jsonwebtoken";
import { Eye, EyeOff, Mail } from "lucide-react";
import { OTPInput } from "@/components/ui/otp-input";
import { Button } from "@/components/ui/button";

export default function AuthPage() {
  // const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    confirmPassword: "",
    otp: "",
  });
  const [randomTagline, setRandomTagline] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [rememberMe, setRememberMe] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // OTP related states
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);

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

  // Load saved credentials on component mount
  useEffect(() => {
    const savedEmail = safeLocalStorage.getItem("rememberedEmail");
    const savedRememberMe = safeLocalStorage.getItem("rememberMe");

    if (savedEmail && savedRememberMe === "true") {
      setFormData((prev) => ({
        ...prev,
        email: savedEmail,
      }));
      setRememberMe(true);
    }
  }, []);

  // Clear errors and touched state when switching between login/signup
  useEffect(() => {
    setErrors({});
    setTouched({});
    setSubmitError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    // Reset OTP states when switching
    setOtpSent(false);
    setOtpError("");
    setOtpVerified(false);
    setFormData((prev) => ({ ...prev, otp: "" }));
    // Reset remember me when switching to signup
    if (!isLogin) {
      setRememberMe(false);
    }
  }, [isLogin]);

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validateUsername = (username: string) => {
    if (!isLogin && !username) return "Username is required";
    if (!isLogin && username.length < 3)
      return "Username must be at least 3 characters";
    if (!isLogin && username.length > 20)
      return "Username must be less than 20 characters";
    return "";
  };

  const validatePassword = (password: string) => {
    if (!password) return "Password is required";
    if (!isLogin && password.length < 6)
      return "Password must be at least 6 characters";
    if (!isLogin && password.length > 50)
      return "Password must be less than 50 characters";
    if (isLogin && password.length < 1) return "Password is required";
    return "";
  };

  const validateConfirmPassword = (
    confirmPassword: string,
    password: string
  ) => {
    if (!isLogin && !confirmPassword) return "Please confirm your password";
    if (!isLogin && confirmPassword !== password)
      return "Passwords do not match";
    return "";
  };

  const validateField = (name: string, value: string) => {
    let error = "";
    switch (name) {
      case "email":
        error = validateEmail(value);
        break;
      case "username":
        error = validateUsername(value);
        break;
      case "password":
        error = validatePassword(value);
        break;
      case "confirmPassword":
        error = validateConfirmPassword(value, formData.password);
        break;
    }
    return error;
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    newErrors.email = validateEmail(formData.email);
    newErrors.password = validatePassword(formData.password);

    if (!isLogin) {
      newErrors.username = validateUsername(formData.username);
      newErrors.confirmPassword = validateConfirmPassword(
        formData.confirmPassword,
        formData.password
      );
      // Only validate OTP if it's been sent
      if (otpSent && !otpVerified) {
        if (!formData.otp) {
          newErrors.otp = "OTP is required";
        } else if (formData.otp.length !== 6) {
          newErrors.otp = "OTP must be 6 digits";
        }
      }
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error !== "");
  };

  // OTP Functions
  const handleGetOTP = async () => {
    if (!formData.email) {
      setOtpError("Please enter your email first");
      return;
    }

    const emailError = validateEmail(formData.email);
    if (emailError) {
      setOtpError(emailError);
      return;
    }

    setOtpLoading(true);
    setOtpError("");

    try {
      const res = await fetch(
        buildApiUrl(`${API_ENDPOINTS.AUTH_BASE}/signup`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setOtpSent(true);
        setOtpError("");
        console.log("OTP sent successfully");
      } else {
        setOtpError(data.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      setOtpError("Error connecting to server. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      setOtpError("Please enter a valid 6-digit OTP");
      return;
    }

    setOtpLoading(true);
    setOtpError("");

    try {
      const res = await fetch(
        buildApiUrl(`${API_ENDPOINTS.AUTH_BASE}/verify-email`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            otp: formData.otp,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setOtpVerified(true);
        setOtpError("");
        console.log("OTP verified successfully");
      } else {
        setOtpError(data.message || "Invalid OTP");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setOtpError("Error connecting to server. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Real-time validation
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }

    // If password changes, also validate confirm password if it's been touched
    if (name === "password" && touched.confirmPassword && !isLogin) {
      const confirmPasswordError = validateConfirmPassword(
        formData.confirmPassword,
        value
      );
      setErrors((prev) => ({
        ...prev,
        confirmPassword: confirmPasswordError,
      }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous submit errors
    setSubmitError("");

    // For signup, check if OTP is verified
    if (!isLogin && !otpVerified) {
      setSubmitError("Please verify your email with OTP first");
      return;
    }

    // Mark all fields as touched for validation
    const allFields = ["email", "password"];
    if (!isLogin) {
      allFields.push("username", "confirmPassword");
    }

    const newTouched: { [key: string]: boolean } = {};
    allFields.forEach((field) => {
      newTouched[field] = true;
    });
    setTouched(newTouched);

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      const { username, email, password } = formData;
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
        console.error(
          "Login/Signup failed:",
          data.message || "Something went wrong!"
        );

        // Set submit error for display
        setSubmitError(data.message || "Something went wrong!");
        return;
      }

      console.log("Success:", data);

      // Handle remember me functionality
      if (isLogin) {
        if (rememberMe) {
          safeLocalStorage.setItem("rememberedEmail", email);
          safeLocalStorage.setItem("rememberMe", "true");
        } else {
          safeLocalStorage.removeItem("rememberedEmail");
          safeLocalStorage.removeItem("rememberMe");
        }
      }

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
        console.log("Signup successful! You are now logged in.");
        window.location.href = "/";
      }
    } catch (err) {
      console.error("Error connecting to server:", err);
      setSubmitError("Error connecting to server. Please try again.");
    } finally {
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
          {/* Submit Error Display */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm">{submitError}</p>
            </div>
          )}

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
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                  errors.username && touched.username
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                placeholder="Enter your cool username"
                required
              />
              {errors.username && touched.username && (
                <p className="text-red-500 text-xs mt-1">{errors.username}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                  errors.email && touched.email
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                placeholder="your@email.com"
                required
              />
              {!isLogin && (
                <Button
                  type="button"
                  onClick={handleGetOTP}
                  disabled={otpLoading || !formData.email}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  {otpLoading ? "Sending..." : otpSent ? "Resend" : "Get OTP"}
                </Button>
              )}
            </div>
            {errors.email && touched.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
            {otpError && (
              <p className="text-red-500 text-xs mt-1">{otpError}</p>
            )}
            {otpSent && !otpVerified && (
              <p className="text-green-600 text-xs mt-1">
                OTP sent to your email! Check your inbox.
              </p>
            )}
            {otpVerified && (
              <p className="text-green-600 text-xs mt-1">
                ✅ Email verified successfully!
              </p>
            )}
          </div>

          {/* OTP Input - Only show for signup and when OTP is sent */}
          {!isLogin && otpSent && !otpVerified && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter OTP
              </label>
              <div className="space-y-3">
                <OTPInput
                  value={formData.otp}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, otp: value }))
                  }
                  length={6}
                  className="w-12 h-12"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleVerifyOTP}
                    disabled={otpLoading || formData.otp.length !== 6}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {otpLoading ? "Verifying..." : "Verify OTP"}
                  </Button>
                </div>
                {errors.otp && (
                  <p className="text-red-500 text-xs">{errors.otp}</p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:border-transparent ${
                  errors.password && touched.password
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && touched.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:border-transparent ${
                    errors.confirmPassword && touched.confirmPassword
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && touched.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          )}

          {isLogin && (
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded text-blue-500"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-sm text-blue-500 hover:text-blue-700">
                Forgot password?
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={!isLogin && (!otpSent || !otpVerified)}
            className={`w-full py-3 rounded-lg font-semibold transition-all transform hover:scale-105 ${
              !isLogin && (!otpSent || !otpVerified)
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gray-900 text-white hover:bg-gray-800"
            }`}
          >
            {isLogin
              ? "Login"
              : otpVerified
              ? "Complete Sign Up"
              : "Verify Email First"}
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
