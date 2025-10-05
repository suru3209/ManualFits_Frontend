"use client";

import React from "react";
import { User, Mail, Phone, Calendar, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserData {
  _id: string;
  username: string;
  email: string;
  phone: string;
  image: string;
  dob: string;
  gender: "Male" | "Female" | "Other";
  created_at: string;
}

interface PersonalInfoSectionProps {
  user: UserData;
  userOrders: any[];
  userWishlists: any[];
  userCart: any[];
  onEditProfile: () => void;
}

export default function PersonalInfoSection({
  user,
  userOrders,
  userWishlists,
  userCart,
  onEditProfile,
}: PersonalInfoSectionProps) {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Personal Information</h2>
        <Button
          onClick={onEditProfile}
          className="bg-gray-700 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-900 flex items-center space-x-2 text-sm sm:text-base w-full sm:w-auto"
        >
          <Edit3 className="w-4 h-4" />
          <span className="hidden sm:inline">Edit Profile</span>
          <span className="sm:hidden">Edit</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Profile Picture & Basic Info */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {user.image ? (
                  <img
                    src={user.image}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-gray-400" />
                )}
              </div>
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                {user.username}
              </h3>
              <p className="text-sm sm:text-base text-gray-500">
                Member since {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="text-base sm:text-lg font-semibold text-gray-800">
              Contact Information
            </h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-500">Email</p>
                  <p className="font-medium text-sm sm:text-base break-all">
                    {user.email}
                  </p>
                </div>
              </div>
              {user.phone && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-sm sm:text-base">
                      {user.phone}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Personal Details */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-base sm:text-lg font-semibold text-gray-800">
              Personal Details
            </h4>
            <div className="space-y-3">
              {user.dob && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">
                      Date of Birth
                    </p>
                    <p className="font-medium text-sm sm:text-base">
                      {new Date(user.dob).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
              {user.gender && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">Gender</p>
                    <p className="font-medium text-sm sm:text-base">
                      {user.gender}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Account Statistics */}
          <div className="space-y-4">
            <h4 className="text-base sm:text-lg font-semibold text-gray-800">
              Account Statistics
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-xl sm:text-2xl font-bold text-gray-600">
                  {userOrders.length}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">Total Orders</p>
              </div>
              <div className="p-3 sm:p-4 bg-green-50 rounded-lg text-center">
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {userWishlists.length}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  Wishlist Items
                </p>
              </div>
              <div className="p-3 sm:p-4 bg-purple-50 rounded-lg text-center">
                <p className="text-xl sm:text-2xl font-bold text-purple-600">
                  {userCart.length}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">Cart Items</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
