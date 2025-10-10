"use client";
import React, { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
import { safeLocalStorage } from "@/lib/storage";
import { buildApiUrl, API_ENDPOINTS } from "@/lib/api";
import jwt from "jsonwebtoken";
import { Eye, EyeOff, Mail, User, Lock, CheckCircle } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

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
    // Only validate email before sending OTP
    const emailError = validateEmail(formData.email);

    if (emailError) {
      setOtpError("Please enter a valid email address");
      return;
    }

    setOtpLoading(true);
    setOtpError("");

    try {
      const res = await fetch(
        buildApiUrl(`${API_ENDPOINTS.AUTH_BASE}/send-signup-otp`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setOtpSent(true);
        setOtpError("");
        console.log("OTP sent successfully");
      } else {
        // Check if email already exists
        if (data.message && data.message.includes("already registered")) {
          setOtpError("Email already registered. Please login instead.");
          // Optionally switch to login mode
          setTimeout(() => {
            setIsLogin(true);
          }, 2000);
        } else {
          setOtpError(data.message || "Failed to send OTP");
        }
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      setOtpError("Error connecting to server. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async (otpValue: string) => {
    if (!otpValue || otpValue.length !== 6) {
      setOtpError("Please enter a valid 6-digit OTP");
      return;
    }

    setOtpLoading(true);
    setOtpError("");

    try {
      const res = await fetch(
        buildApiUrl(`${API_ENDPOINTS.AUTH_BASE}/verify-signup-otp-only`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            otp: otpValue,
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

      if (isLogin) {
        // Login flow
        const res = await fetch(
          buildApiUrl(`${API_ENDPOINTS.AUTH_BASE}/login`),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          console.error(
            "Login failed:",
            data.message || "Something went wrong!"
          );
          setSubmitError(data.message || "Something went wrong!");
          return;
        }

        console.log("Login Success:", data);

        // Handle remember me functionality
        if (rememberMe) {
          safeLocalStorage.setItem("rememberedEmail", email);
          safeLocalStorage.setItem("rememberMe", "true");
        } else {
          safeLocalStorage.removeItem("rememberedEmail");
          safeLocalStorage.removeItem("rememberMe");
        }

        // Save user data and token in localStorage
        safeLocalStorage.setItem("user", JSON.stringify(data.user));
        if (data.token) {
          safeLocalStorage.setItem("token", data.token);
          console.log("Token saved:", data.token);
        }

        // Redirect to home page
        window.location.href = "/";
      } else {
        // Signup flow - Complete registration with verified OTP
        if (otpVerified) {
          const res = await fetch(
            buildApiUrl(`${API_ENDPOINTS.AUTH_BASE}/complete-signup`),
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                otp: formData.otp,
              }),
            }
          );

          const data = await res.json();

          if (!res.ok) {
            console.error(
              "Signup failed:",
              data.message || "Something went wrong!"
            );
            setSubmitError(data.message || "Something went wrong!");
            return;
          }

          console.log("Signup Success:", data);

          // Save user data and token in localStorage
          safeLocalStorage.setItem("user", JSON.stringify(data.user));
          if (data.token) {
            safeLocalStorage.setItem("token", data.token);
            console.log("Token saved:", data.token);
          }

          // Redirect to home page
          window.location.href = "/";
        } else {
          setSubmitError("Please verify your email with OTP first");
          return;
        }
      }
    } catch (err) {
      console.error("Error connecting to server:", err);
      setSubmitError("Error connecting to server. Please try again.");
    } finally {
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {isLogin ? "Welcome Back!" : "Join Us!"}
          </CardTitle>
          <CardDescription className="text-base">
            {randomTagline ||
              (isLogin ? "Welcome back!" : "Join our community!")}
          </CardDescription>
        </CardHeader>

        {/* Toggle Buttons */}
        <div className="flex border-b mx-6">
          <Button
            variant={isLogin ? "default" : "ghost"}
            onClick={() => setIsLogin(true)}
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          >
            Login
          </Button>
          <Button
            variant={!isLogin ? "default" : "ghost"}
            onClick={() => setIsLogin(false)}
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          >
            Sign Up
          </Button>
        </div>

        {/* Form */}
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Submit Error Display */}
            {submitError && (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Username
                </Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter your cool username"
                  className={
                    errors.username && touched.username ? "border-red-500" : ""
                  }
                  required
                />
                {errors.username && touched.username && (
                  <p className="text-red-500 text-xs">{errors.username}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="your@email.com"
                  className={`flex-1 ${
                    errors.email && touched.email ? "border-red-500" : ""
                  }`}
                  required
                />
                {!isLogin && (
                  <Button
                    type="button"
                    onClick={handleGetOTP}
                    disabled={otpLoading || !formData.email || !!errors.email}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    {otpLoading ? "Sending..." : otpSent ? "Resend" : "Get OTP"}
                  </Button>
                )}
              </div>
              {errors.email && touched.email && (
                <p className="text-red-500 text-xs">{errors.email}</p>
              )}
              {otpError && (
                <Alert variant="destructive">
                  <AlertDescription>{otpError}</AlertDescription>
                </Alert>
              )}
              {otpSent && !otpVerified && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    OTP sent to your email! Check your inbox.
                  </AlertDescription>
                </Alert>
              )}
              {otpVerified && (
                <Alert>
                  {/* <CheckCircle className="h-4 w-4 text-green-600" /> */}
                  <AlertDescription className="text-green-500 font-medium">
                    OTP Verified Successfully!
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* OTP Input - Only show for signup and when OTP is sent */}
            {!isLogin && otpSent && !otpVerified && (
              <div className="space-y-4">
                <Label className="text-center block">Enter OTP</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={formData.otp}
                    onChange={(value) => {
                      setFormData((prev) => ({ ...prev, otp: value }));
                      // Auto-verify when 6 digits are entered
                      if (value.length === 6) {
                        handleVerifyOTP(value);
                      }
                    }}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                {otpLoading && (
                  <div className="flex justify-center">
                    <p className="text-sm text-gray-600">Verifying OTP...</p>
                  </div>
                )}
                {errors.otp && (
                  <Alert variant="destructive">
                    <AlertDescription>{errors.otp}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="••••••••"
                  className={`pr-10 ${
                    errors.password && touched.password ? "border-red-500" : ""
                  }`}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && touched.password && (
                <p className="text-red-500 text-xs">{errors.password}</p>
              )}
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="••••••••"
                    className={`pr-10 ${
                      errors.confirmPassword && touched.confirmPassword
                        ? "border-red-500"
                        : ""
                    }`}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && touched.confirmPassword && (
                  <p className="text-red-500 text-xs">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            {isLogin && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) =>
                      setRememberMe(checked as boolean)
                    }
                  />
                  <Label htmlFor="remember" className="text-sm">
                    Remember me
                  </Label>
                </div>
                <Button variant="link" className="p-0 h-auto text-sm">
                  Forgot password?
                </Button>
              </div>
            )}

            <Button
              type="submit"
              disabled={
                !isLogin &&
                (!otpSent ||
                  !otpVerified ||
                  !!errors.email ||
                  !!errors.username ||
                  !!errors.password ||
                  !!errors.confirmPassword ||
                  !formData.email ||
                  !formData.username ||
                  !formData.password ||
                  !formData.confirmPassword)
              }
              className="w-full"
              size="lg"
            >
              {isLogin
                ? "Login"
                : otpVerified
                ? "Complete Sign Up"
                : "Verify Email First"}
            </Button>
          </form>
        </CardContent>

        {/* Footer */}
        <div className="px-6 py-4 text-center border-t">
          <p className="text-sm text-muted-foreground">
            {isLogin ? "New here? " : "Already have an account? "}
            <Button
              variant="link"
              onClick={() => setIsLogin(!isLogin)}
              className="p-0 h-auto text-sm"
            >
              {isLogin ? "Create an account" : "Sign in"}
            </Button>
          </p>
        </div>
      </Card>
    </div>
  );
}
