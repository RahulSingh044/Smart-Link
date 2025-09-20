'use client';
import {useState, useEffect} from 'react';
import { fetchRouteById } from "@/utils/api"

export const getRoute = (origin, dest, time = null) => {
    const [route, setRoute] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchRoute = async() => {
        setLoading(true);
        try {
            const res = await fetchRouteById(origin, dest, time);
            setRoute(res.data)
        } catch (error) {
            setError(error);
        } finally{
            setLoading(false);
        }
    }
    
    useEffect(() => {
        fetchRoute();
    }, [])
    return { route, loading, error };
}