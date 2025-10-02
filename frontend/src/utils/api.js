import axios from "axios";

const API_BASE_URL = "http://localhost:5000";
export const getBuses = async (page = 1, pageSize = 10) => {
    const res = await axios.get(`${API_BASE_URL}/api/buses`, {
        params: { page, pageSize },
        headers: {
            Authorization: `Bearer ${localStorage.getItem("userAuth")}`
        },
    });
    return res.data;
};

export const dashboardStats = async () => {
    const res = await axios.get(`${API_BASE_URL}/admin/dashboard`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("userAuth")}`
        }
    });
    return res.data;
}

export const getBusDataById = async (id) => {
    try {
        const res = await axios.get(`${API_BASE_URL}/api/buses/${id}`)
        return res.data;
    } catch (err) {
        console.error("API error:", err.response?.data || err.message);
        throw err;
    }
}

export const updateBusData = async (id, busData) => {
    console.log("API Update Payload:", id, busData);
    const res = await axios.patch(`${API_BASE_URL}/api/buses/${id}`, busData, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("userAuth")}`,
        },
    })
    return res.data.bus;
}

export const getStation = async (page = 1, limit = 10) => {
    const res = await axios.get(`${API_BASE_URL}/api/stations`, {
        params: { page, limit }
    });
    console.log("APi result", res.data)
    return res.data;
}

export const getStationById = async (id) => {
    try {
        const res = await axios.get(`${API_BASE_URL}/api/buses/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("userAuth")}`,
            },
        });
        return res.data;
    } catch (err) {
        console.error("API error:", err.response?.data || err.message);
        throw err;
    }
}

export const fetchTrip = async (id) => {
    try {
        const res = await axios.get(`${API_BASE_URL}/api/trip/${id}`);
        return res.data;
    } catch (error) {
        console.log(error);
    }
}

export const fetchRouteById = async (origin, dest, time = null) => {
    try {
        const res = await axios.get(`${API_BASE_URL}/api/search-route?origin=${origin}&destination=${dest}&time=${time}`);
        return res.data;
    } catch (error) {
        console.log(error);
    }
}

export const getNearbyStats = async (lon = 75.829387, lat = 30.236568, limit = 2) => {
    try {
        const res = await axios.get(`${API_BASE_URL}/api/nearby`, {
            params: { lon, lat, limit }
        });

        return res.data;
    } catch (error) {
        console.log(error);
    }
}

export const getStops = async(tripId, fromStopId, toStopId) => {
        console.log("Trip ", tripId , "fromStop", fromStopId, "toStop", toStopId);
        try {
        const res = await axios.get(`${API_BASE_URL}/api/trips`, {
            params: { tripId, fromStopId, toStopId }
        });

        return res.data;
    } catch (error) {
        console.log(error);
    }
}