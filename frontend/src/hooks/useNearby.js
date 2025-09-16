import React,{ useState, useEffect } from 'react'
import { getNearbyStats } from "@/utils/api"

export const useNearby = (long=75.829387, lat=30.236568) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchNearBy = async (longi=long, lati=lat) => {
        setLoading(true);
        try {
            const res = await getNearbyStats(longi, lati);
            setData(res.data.stops);
        } catch (error) {
            setError(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchNearBy();
    },[]);

    return { data, loading, error };

}