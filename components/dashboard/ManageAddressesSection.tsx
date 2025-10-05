"use client";

import React from "react";
import { MapPin, Edit3 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TrashIcon } from "@/components/ui/skiper-ui/skiper42";

interface Address {
  address_id: string;
  type: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  is_default: boolean;
}

interface AddressForm {
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  type: string;
  is_default: boolean;
}

interface ManageAddressesSectionProps {
  userAddresses: Address[];
  showAddAddressForm: boolean;
  editingAddress: Address | null;
  addressForm: AddressForm;
  onAddAddress: () => void;
  onEditAddress: (address: Address) => void;
  onUpdateAddress: (e: React.FormEvent) => void;
  onAddAddressSubmit: (e: React.FormEvent) => void;
  onDeleteAddress: (addressId: string) => void;
  onSetDefaultAddress: (addressId: string) => void;
  onAddressFormChange: (field: string, value: string | boolean) => void;
  onCancelAddressForm: () => void;
}

export default function ManageAddressesSection({
  userAddresses,
  showAddAddressForm,
  editingAddress,
  addressForm,
  onAddAddress,
  onEditAddress,
  onUpdateAddress,
  onAddAddressSubmit,
  onDeleteAddress,
  onSetDefaultAddress,
  onAddressFormChange,
  onCancelAddressForm,
}: ManageAddressesSectionProps) {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Manage Addresses</h2>
        <button
          onClick={onAddAddress}
          className="bg-gray-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-900 text-sm sm:text-base w-full sm:w-auto"
        >
          <span className="hidden sm:inline">Add New Address</span>
          <span className="sm:hidden">Add Address</span>
        </button>
      </div>

      {/* Add/Edit Address Form */}
      {showAddAddressForm && (
        <div className="mb-6 p-4 sm:p-6 border rounded-lg bg-gray-50">
          <h3 className="text-base sm:text-lg font-semibold mb-4">
            {editingAddress ? "Edit Address" : "Add New Address"}
          </h3>
          <form
            onSubmit={editingAddress ? onUpdateAddress : onAddAddressSubmit}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </Label>
                <Input
                  type="text"
                  value={addressForm.name}
                  onChange={(e) => onAddressFormChange("name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm sm:text-base"
                  required
                />
              </div>
              <div>
                <Label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </Label>
                <Input
                  type="tel"
                  value={addressForm.phone}
                  onChange={(e) => onAddressFormChange("phone", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm sm:text-base"
                  required
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Type
                </Label>
                <select
                  value={addressForm.type}
                  onChange={(e) => onAddressFormChange("type", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <option value="Home">Home</option>
                  <option value="Work">Work</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <Label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Street Address *
                </Label>
                <Input
                  type="text"
                  value={addressForm.street}
                  onChange={(e) =>
                    onAddressFormChange("street", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm sm:text-base"
                  required
                />
              </div>
              <div>
                <Label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  City *
                </Label>
                <Input
                  type="text"
                  value={addressForm.city}
                  onChange={(e) => onAddressFormChange("city", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm sm:text-base"
                  required
                />
              </div>
              <div>
                <Label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  State *
                </Label>
                <Input
                  type="text"
                  value={addressForm.state}
                  onChange={(e) => onAddressFormChange("state", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm sm:text-base"
                  required
                />
              </div>
              <div>
                <Label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  ZIP Code *
                </Label>
                <Input
                  type="text"
                  value={addressForm.zip}
                  onChange={(e) => onAddressFormChange("zip", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm sm:text-base"
                  required
                />
              </div>
              <div>
                <Label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Country *
                </Label>
                <Input
                  type="text"
                  value={addressForm.country}
                  onChange={(e) =>
                    onAddressFormChange("country", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm sm:text-base"
                  required
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <button
                type="button"
                onClick={onCancelAddressForm}
                className="px-3 sm:px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm sm:text-base w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 sm:px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-900 text-sm sm:text-base w-full sm:w-auto"
              >
                {editingAddress ? "Update Address" : "Add Address"}
              </button>
            </div>
          </form>
        </div>
      )}

      {userAddresses.length > 0 ? (
        <div className="space-y-4">
          {userAddresses.map((address) => (
            <div key={address.address_id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold">{address.type}</h3>
                    {address.is_default && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600">{address.name}</p>
                  <p className="text-gray-600">{address.street}</p>
                  <p className="text-gray-600">
                    {address.city}, {address.state} - {address.zip}
                  </p>
                  <p className="text-gray-600">{address.country}</p>
                </div>
                <div className="flex space-x-2">
                  {!address.is_default && (
                    <button
                      onClick={() => onSetDefaultAddress(address.address_id)}
                      className="text-gray-600 hover:text-gray-900 text-sm"
                    >
                      Set as Default
                    </button>
                  )}
                  <button
                    onClick={() => onEditAddress(address)}
                    className="text-gray-600 hover:text-gray-900 text-sm mr-2"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteAddress(address.address_id)}
                    className="text-gray-600 hover:text-gray-900 text-sm"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No addresses saved</p>
          <p className="text-gray-400">Add your first address to get started</p>
        </div>
      )}
    </div>
  );
}
