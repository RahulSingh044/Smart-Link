'use client';
import {useState, useEffect} from 'react';
import { fetchRouteById } from "@/utils/api"

export const getRoute = (id) => {
    const [route, setRoute] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchRoute = async(currentId = id) => {
        setLoading(true);
        try {
            const res = await fetchRouteById(currentId);
            console.log("Hook Route", res.data)
            setRoute(res.data)
        } catch (error) {
            setError(error);
        } finally{
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchRoute();
    }, [id])

    return { route, loading, error };
}