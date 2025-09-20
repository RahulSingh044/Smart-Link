"use client";
import React, { useState, useEffect } from "react";
import { getBusDataById, updateBusData as updateBusApi } from "@/utils/api";

export function useBusDetails(busNumber, initialData = null) {
    const [busData, setBusData] = useState(initialData);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const fetchBusData = async () => {
        if (!busNumber) return;
        console.log("Hook Bus ID:", busNumber);
        setIsLoading(true);
        try {
            const res = await getBusDataById(busNumber);
            setBusData(res.data);
        } catch (err) {
            console.error("Error fetching bus:", err.response?.data || err.message);
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    const saveBusData = async (updatedData) => {
        if (!busNumber || !updatedData) return;
        setIsLoading(true);
        try {
            const res = await updateBusApi(busNumber, updatedData);
            setBusData(res);
            fetchBusData();
        } catch (err) {
            console.error("Error updating bus:", err.response?.data || err.message);
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!initialData) {
            fetchBusData();
        } else {
            setIsLoading(false);
        }
    }, [busNumber]);

    const handleInputChange = (e, section, field) => {
        const value = e.target.value;

        setBusData((prev) => {
            if (!section) {
                // top-level field
                return { ...prev, [field]: value };
            }

            return {
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: value,
                },
            };
        });
    };


    const handleSave = async () => {
        console.log("Saved data:", busData);
        setIsEditing(false);

        // Save to API
        await saveBusData(busData);

        // Refetch fresh data from backend
        await fetchBusData();
    };


    return {
        busData,
        isLoading,
        error,
        isEditing,
        setIsEditing,
        handleSave,
        handleInputChange,
        refetch: fetchBusData,
    };
}
