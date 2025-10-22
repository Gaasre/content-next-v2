"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

interface Website {
  id: string;
  name: string;
  domain: string;
  apiKey: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface WebsiteContextValue {
  currentWebsite: Website | null;
  setCurrentWebsite: (website: Website | null) => void;
  websites: Website[];
  isLoading: boolean;
}

const WebsiteContext = createContext<WebsiteContextValue | undefined>(
  undefined
);

const STORAGE_KEY = "selectedWebsiteId";

export function WebsiteProvider({ children }: { children: ReactNode }) {
  const [currentWebsite, setCurrentWebsiteState] = useState<Website | null>(
    null
  );
  const { data: websites = [], isLoading } = useQuery(
    orpc.website.list.queryOptions()
  );

  // Initialize current website from localStorage or first website
  useEffect(() => {
    if (isLoading || websites.length === 0) return;

    const storedId = localStorage.getItem(STORAGE_KEY);

    if (storedId) {
      const found = websites.find((w: Website) => w.id === storedId);
      if (found) {
        setCurrentWebsiteState(found);
        return;
      }
    }

    // Auto-select first website if no stored selection or not found
    if (websites[0]) {
      setCurrentWebsiteState(websites[0]);
      localStorage.setItem(STORAGE_KEY, websites[0].id);
    }
  }, [websites, isLoading]);

  const setCurrentWebsite = (website: Website | null) => {
    setCurrentWebsiteState(website);
    if (website) {
      localStorage.setItem(STORAGE_KEY, website.id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <WebsiteContext.Provider
      value={{
        currentWebsite,
        setCurrentWebsite,
        websites,
        isLoading,
      }}
    >
      {children}
    </WebsiteContext.Provider>
  );
}

export function useWebsite() {
  const context = useContext(WebsiteContext);
  if (context === undefined) {
    throw new Error("useWebsite must be used within a WebsiteProvider");
  }
  return context;
}
