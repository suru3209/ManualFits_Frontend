"use client";

import React, { useState } from "react";
import { ProfileImageUpload } from "@/components/ui/ProfileImageUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    addresses: any[];
    created_at: string;
    updated_at: string;
  };
  token: string;
  onUserUpdate: (updatedUser: any) => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  user,
  token,
  onUserUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);

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

  const handleProfileUpdate = (updatedUser: any) => {
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
              {user.addresses.map((address: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{address.name}</h4>
                      <p className="text-sm text-gray-600">{address.type}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {address.street}, {address.city}, {address.state}{" "}
                        {address.zip}
                      </p>
                      <p className="text-sm text-gray-500">{address.country}</p>
                    </div>
                    {address.is_default && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
