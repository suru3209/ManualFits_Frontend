"use client";

import React from "react";
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
  return (
    <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Edit Profile</h2>
        <button
          onClick={onCancel}
          className="bg-gray-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center space-x-2 text-sm sm:text-base w-full sm:w-auto"
        >
          <span>Cancel</span>
        </button>
      </div>

      <form onSubmit={onUpdateProfile} className="space-y-4 sm:space-y-6">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm sm:text-base"
                />
              </div>
              <div>
                <Label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Email
                </Label>
                <Input
                  type="email"
                  name="email"
                  defaultValue={user.email}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm sm:text-base"
                />
              </div>
              <div>
                <Label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Phone
                </Label>
                <Input
                  type="tel"
                  name="phone"
                  defaultValue={user.phone}
                  placeholder="Enter phone number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm sm:text-base"
                />
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
                  Date of Birth
                </Label>
                <Input
                  type="date"
                  name="dob"
                  defaultValue={
                    user.dob
                      ? new Date(user.dob).toISOString().split("T")[0]
                      : ""
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm sm:text-base"
                />
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

        {/* Save button */}
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
          <Button
            type="button"
            onClick={onResetProfileImage}
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
