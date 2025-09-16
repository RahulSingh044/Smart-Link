import { useState, useEffect } from 'react';
import { getStation } from '@/utils/api';

export const useStation = (page = 1, limit = 10) => {
    const [station, setStation] = useState([]);
    const [loading, setLoading] = useState(true);
    const [count, setCount] = useState({});
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState(null);

    const fetchStation = async (currentPage = page) => {
        setLoading(true);
        try {
            const res = await getStation(page, limit);
            setStation(res.data);
            setTotalPages(res.pagination.totalPages)
            setCount(res.counts)
        } catch (error) {
            setError(error);
        } finally {
            setLoading(false);
        }
    }


    useEffect(() => {
        fetchStation(page);
    }, [page, limit])

    return { station, loading, error, totalPages, count, fetchStation }
}