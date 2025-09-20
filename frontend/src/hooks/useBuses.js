import { useState, useEffect } from "react";
import { getBuses } from "@/utils/api";

export const useBus = (page = 1, pageSize = 10) => {
  const [data, setData] = useState([]);
  const [count, setCount] = useState({});
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBuses = async (currentPage = page) => {
    setLoading(true);
    try {
      const res = await getBuses(currentPage, pageSize);
      setData(res.data);
      setCount(res.counts);
      setTotalPages(res.pagination.totalPages);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuses(page);
  }, [page]);

  return { data, totalPages, count, loading, error, fetchBuses };
};
