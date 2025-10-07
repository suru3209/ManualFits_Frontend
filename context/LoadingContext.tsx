"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";
import { LoadingOverlay } from "@/components/ui/loading";

interface LoadingContextType {
  isLoading: boolean;
  loadingMessage: string;
  setLoading: (loading: boolean, message?: string) => void;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");

  const setLoading = (loading: boolean, message: string = "Loading...") => {
    setIsLoading(loading);
    setLoadingMessage(message);
  };

  const startLoading = (message: string = "Loading...") => {
    setLoading(true, message);
  };

  const stopLoading = () => {
    setLoading(false);
  };

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        loadingMessage,
        setLoading,
        startLoading,
        stopLoading,
      }}
    >
      {children}
      <LoadingOverlay isVisible={isLoading} message={loadingMessage} />
    </LoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useGlobalLoading must be used within LoadingProvider");
  }
  return context;
}
