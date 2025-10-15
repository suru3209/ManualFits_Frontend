"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Save, ArrowLeft, Loader2, X, Plus, Calendar } from "lucide-react";

const couponSchema = z
  .object({
    code: z
      .string()
      .min(1, "Coupon code is required")
      .max(20, "Code must be less than 20 characters"),
    type: z.enum(["percentage", "fixed"]),
    value: z.number().min(0.01, "Value must be greater than 0"),
    minOrderValue: z.number().min(0).optional(),
    validFrom: z.string().min(1, "Valid from date is required"),
    validTo: z.string().min(1, "Valid to date is required"),
    usageLimit: z.number().min(1).optional(),
    usagePerUser: z.number().min(1).optional(),
    isActive: z.boolean(),
    description: z.string().optional(),
    applicableCategories: z.array(z.string()).optional(),
    applicableProducts: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      const validFrom = new Date(data.validFrom);
      const validTo = new Date(data.validTo);
      return validTo > validFrom;
    },
    {
      message: "Valid to date must be after valid from date",
      path: ["validTo"],
    }
  );

type CouponFormData = z.infer<typeof couponSchema>;

interface Coupon {
  _id?: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderValue?: number;
  validFrom: string;
  validTo: string;
  usageLimit?: number;
  usagePerUser?: number;
  isActive: boolean;
  description?: string;
  applicableCategories?: string[];
  applicableProducts?: string[];
}

interface CouponFormProps {
  coupon?: Coupon | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const categories = [
  "Men",
  "Women",
  "Kids",
  "Footwear",
  "Accessories",
  "New Arrivals",
];

export default function CouponForm({
  coupon,
  onSuccess,
  onCancel,
}: CouponFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    coupon?.applicableCategories || []
  );
  const [newCategory, setNewCategory] = useState("");

  const form = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: coupon?.code || "",
      type: coupon?.type || "percentage",
      value: coupon?.value || 0,
      minOrderValue: coupon?.minOrderValue || 0,
      validFrom: coupon?.validFrom
        ? new Date(coupon.validFrom).toISOString().split("T")[0]
        : "",
      validTo: coupon?.validTo
        ? new Date(coupon.validTo).toISOString().split("T")[0]
        : "",
      usageLimit: coupon?.usageLimit || 0,
      usagePerUser: coupon?.usagePerUser || 1,
      isActive: coupon?.isActive ?? true,
      description: coupon?.description || "",
      applicableCategories: coupon?.applicableCategories || [],
      applicableProducts: coupon?.applicableProducts || [],
    },
  });

  const watchedType = form.watch("type");
  const watchedValue = form.watch("value");
  const watchedMinOrderValue = form.watch("minOrderValue");

  useEffect(() => {
    form.setValue("applicableCategories", selectedCategories);
  }, [selectedCategories, form]);

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    form.setValue("code", result);
  };

  const addCategory = (category: string) => {
    if (!selectedCategories.includes(category)) {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const removeCategory = (categoryToRemove: string) => {
    setSelectedCategories(
      selectedCategories.filter((category) => category !== categoryToRemove)
    );
  };

  const onSubmit = async (data: CouponFormData) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("adminToken");
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      const couponData = {
        ...data,
        applicableCategories: selectedCategories,
        validFrom: new Date(data.validFrom).toISOString(),
        validTo: new Date(data.validTo).toISOString(),
      };

      const url = coupon
        ? `${backendUrl}/api/admin/coupons/${coupon._id}`
        : `${backendUrl}/api/admin/coupons`;

      const method = coupon ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(couponData),
      });

      if (response.ok) {
        toast.success(
          coupon ? "Coupon updated successfully" : "Coupon created successfully"
        );
        onSuccess();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save coupon");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save coupon"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDiscount = () => {
    const orderValue = watchedMinOrderValue || 100;
    if (watchedType === "percentage") {
      return (orderValue * watchedValue) / 100;
    } else {
      return Math.min(watchedValue, orderValue);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coupon Code *</FormLabel>
                    <div className="flex space-x-2">
                      <FormControl>
                        <Input
                          placeholder="DISCOUNT20"
                          {...field}
                          className="uppercase"
                          onChange={(e) =>
                            field.onChange(e.target.value.toUpperCase())
                          }
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generateRandomCode}
                      >
                        Generate
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Type *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Discount Value *
                      {watchedType === "percentage" ? " (%)" : " (₹)"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step={watchedType === "percentage" ? "1" : "0.01"}
                        min="0"
                        max={watchedType === "percentage" ? "100" : undefined}
                        placeholder={
                          watchedType === "percentage" ? "20" : "10.00"
                        }
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minOrderValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Order Value (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="50.00"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Leave empty for no minimum order requirement
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Enable this coupon for use
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Validity & Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Validity & Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="validFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid From *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="validTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid To *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="usageLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Usage Limit</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="100"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Leave empty for unlimited usage
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="usagePerUser"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usage Per User</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="1"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 1)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      How many times each user can use this coupon
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of the coupon offer..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Applicable Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Applicable Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map((category) => (
                <Badge
                  key={category}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {category}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeCategory(category)}
                  />
                </Badge>
              ))}
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addCategory(category)}
                  disabled={selectedCategories.includes(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Discount Preview */}
        {watchedValue > 0 && watchedMinOrderValue && (
          <Card>
            <CardHeader>
              <CardTitle>Discount Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Order Value:</span>
                  <span>₹{watchedMinOrderValue}</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    Discount (
                    {watchedType === "percentage"
                      ? `${watchedValue}%`
                      : `₹${watchedValue}`}
                    ):
                  </span>
                  <span>-₹{calculateDiscount().toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Final Amount:</span>
                  <span>
                    ₹{(watchedMinOrderValue - calculateDiscount()).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {coupon ? "Update Coupon" : "Create Coupon"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
