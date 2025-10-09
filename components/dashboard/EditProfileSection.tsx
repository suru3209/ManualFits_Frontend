"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SimpleProfileImageUpload } from "@/components/ui/SimpleProfileImageUpload";

interface UserData {
  _id: string;
  username: string;
  email: string;
  phone: string;
  image: string;
  dob: string;
  gender: "Male" | "Female" | "Other";
}

interface EditProfileSectionProps {
  user: UserData;
  token: string;
  profileImageUrl: string;
  profileImagePublicId: string;
  onUpdateProfile: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onProfileImageUpdate: (url: string, publicId: string) => void;
  onResetProfileImage: () => void;
}

export default function EditProfileSection({
  user,
  token,
  profileImageUrl,
  profileImagePublicId,
  onUpdateProfile,
  onCancel,
  onProfileImageUpdate,
  onResetProfileImage,
}: EditProfileSectionProps) {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  // Validation functions
  const validateUsername = (username: string) => {
    if (!username) return "Username is required";
    if (username.length < 3) return "Username must be at least 3 characters";
    if (username.length > 20) return "Username must be less than 20 characters";
    return "";
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validatePhone = (phone: string) => {
    if (!phone) return "Phone number is required";
    // Indian phone number validation: +91 or 91 followed by 10 digits, or just 10 digits
    const indianPhoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
    if (!indianPhoneRegex.test(phone.replace(/\s/g, ""))) {
      return "Please enter a valid Indian phone number (10 digits starting with 6-9)";
    }
    return "";
  };

  const validateDOB = (dob: string) => {
    if (!dob) return "Date of birth is required";

    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Check if birthday hasn't occurred this year
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    // Check if date is valid and not in the future
    if (birthDate > today) {
      return "Date of birth cannot be in the future";
    }

    // Check if age is at least 18
    if (age < 18) {
      return "You must be at least 18 years old";
    }

    // Check if age is reasonable (not more than 120 years)
    if (age > 120) {
      return "Please enter a valid date of birth";
    }

    return "";
  };

  const validateField = (name: string, value: string) => {
    switch (name) {
      case "username":
        return validateUsername(value);
      case "email":
        return validateEmail(value);
      case "phone":
        return validatePhone(value);
      case "dob":
        return validateDOB(value);
      default:
        return "";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Real-time validation
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
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

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Mark all fields as touched
    const formData = new FormData(e.currentTarget);
    const newTouched: { [key: string]: boolean } = {};
    const newErrors: { [key: string]: string } = {};

    ["username", "email", "phone", "dob"].forEach((field) => {
      newTouched[field] = true;
      newErrors[field] = validateField(field, formData.get(field) as string);
    });

    setTouched(newTouched);
    setErrors(newErrors);

    // Check if form is valid
    const isValid = !Object.values(newErrors).some((error) => error !== "");

    if (isValid) {
      onUpdateProfile(e);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Edit Profile</h2>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-base sm:text-lg font-semibold text-gray-800">
              Basic Information
            </h4>
            <div className="space-y-4">
              <div>
                <Label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Username
                </Label>
                <Input
                  type="text"
                  name="username"
                  defaultValue={user.username}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm sm:text-base ${
                    errors.username && touched.username
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-gray-500"
                  }`}
                />
                {errors.username && touched.username && (
                  <p className="text-red-500 text-xs mt-1">{errors.username}</p>
                )}
              </div>
              <div>
                <Label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Email
                </Label>
                <Input
                  type="email"
                  name="email"
                  defaultValue={user.email}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm sm:text-base ${
                    errors.email && touched.email
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-gray-500"
                  }`}
                />
                {errors.email && touched.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>
              <div>
                <Label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Phone Number (Indian)
                </Label>
                <Input
                  type="tel"
                  name="phone"
                  defaultValue={user.phone}
                  placeholder="Enter 10-digit Indian phone number"
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm sm:text-base ${
                    errors.phone && touched.phone
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-gray-500"
                  }`}
                />
                {errors.phone && touched.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div className="space-y-4">
            <h4 className="text-base sm:text-lg font-semibold text-gray-800">
              Personal Details
            </h4>
            <div className="space-y-4">
              <div>
                <Label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Date of Birth (18+ Required)
                </Label>
                <Input
                  type="date"
                  name="dob"
                  defaultValue={
                    user.dob
                      ? new Date(user.dob).toISOString().split("T")[0]
                      : ""
                  }
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm sm:text-base ${
                    errors.dob && touched.dob
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-gray-500"
                  }`}
                />
                {errors.dob && touched.dob && (
                  <p className="text-red-500 text-xs mt-1">{errors.dob}</p>
                )}
              </div>
              <div>
                <Label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Gender
                </Label>
                <select
                  name="gender"
                  defaultValue={user.gender}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm sm:text-base"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Picture */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800">
            Profile Picture
          </h4>
          <div className="flex justify-center">
            <SimpleProfileImageUpload
              onUpload={onProfileImageUpdate}
              token={token}
              existingImage={profileImageUrl || user.image}
              size="md"
            />
          </div>
          {profileImageUrl && (
            <div className="text-center mt-2">
              <p className="text-sm text-green-600">
                ✓ New profile picture selected. Click &ldquo;Save Changes&rdquo;
                to update.
              </p>
            </div>
          )}
        </div>

        {/* Save and Cancel buttons */}
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
          <Button
            type="button"
            onClick={onCancel}
            className="px-4 sm:px-6 py-2 border bg-gray-700 text-white rounded-lg hover:bg-gray-900 text-sm sm:text-base w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="px-4 sm:px-6 py-2 border bg-gray-700 text-white rounded-lg hover:bg-gray-900 text-sm sm:text-base w-full sm:w-auto"
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
