'use client'
import { useState, useEffect } from 'react';

export const useHydrated = () => {
    const [hydrated, setHydrated] = useState(false);
    useEffect(() => {
        setHydrated(true);
    }, []);
    console.log(hydrated);
    return hydrated;
};