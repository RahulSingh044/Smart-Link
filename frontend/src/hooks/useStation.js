"use client";
import useSWR from "swr";
import { getStation } from "@/utils/api";

// SWR fetcher
const fetcher = (page, limit) => getStation(page, limit);

export const useStation = (page = 1, limit = 10) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["stations", page, limit],
    () => fetcher(page, limit),
    {
      revalidateOnFocus: false,  
      dedupingInterval: 60000,
    }
  );

  return {
    station: data?.data || [],
    totalPages: data?.pagination?.totalPages || 1,
    count: data?.counts || {},
    loading: isLoading,
    error,
    fetchStation: mutate,   
  };
};
