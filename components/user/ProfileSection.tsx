"use client";

import React, { useState } from "react";
import { ProfileImageUpload } from "@/components/ui/ProfileImageUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
import { User, Mail, Phone, Calendar, MapPin } from "lucide-react";

interface ProfileSectionProps {
  user: {
    _id: string;
    username: string;
    email: string;
    phone: string;
    image?: string;
    cloudinaryPublicId?: string;
    dob?: string;
    gender?: string;
    addresses: unknown[];
    created_at: string;
    updated_at: string;
  };
  token: string;
  onUserUpdate: (updatedUser: unknown) => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  user,
  token,
  onUserUpdate,
}) => {
  const [, setIsEditing] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleImageUpdate = (url: string, publicId: string) => {
    // This will be called when image is uploaded/removed
    console.log("Image updated:", { url, publicId });
  };

  const handleProfileUpdate = (updatedUser: unknown) => {
    onUserUpdate(updatedUser);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Profile Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-start space-y-6 md:space-y-0 md:space-x-6">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <ProfileImageUpload
                onUpload={handleImageUpdate}
                onUpdate={handleProfileUpdate}
                token={token}
                existingImage={user.image}
                size="lg"
              />
            </div>

            {/* Profile Details */}
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Username</p>
                    <p className="font-medium">{user.username}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>

                {user.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{user.phone}</p>
                    </div>
                  </div>
                )}

                {user.dob && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Date of Birth</p>
                      <p className="font-medium">{formatDate(user.dob)}</p>
                    </div>
                  </div>
                )}

                {user.gender && (
                  <div className="flex items-center space-x-3">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Gender</p>
                      <p className="font-medium">{user.gender}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Member Since */}
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Member since {formatDate(user.created_at)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Addresses Section */}
      {user.addresses && user.addresses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Saved Addresses</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {user.addresses.map((address: unknown, index: number) => {
                const addressData = address as {
                  name: string;
                  type: string;
                  street: string;
                  city: string;
                  state: string;
                  zip: string;
                  country: string;
                  phone: string;
                  is_default: boolean;
                };
                return (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{addressData.name}</h4>
                        <p className="text-sm text-gray-600">
                          {addressData.type}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {addressData.street}, {addressData.city},{" "}
                          {addressData.state} {addressData.zip}
                        </p>
                        <p className="text-sm text-gray-500">
                          {addressData.country}
                        </p>
                      </div>
                      {addressData.is_default && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
