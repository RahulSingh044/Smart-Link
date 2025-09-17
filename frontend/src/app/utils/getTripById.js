import { fetchTrip } from '@/utils/api';
import axios from 'axios';
// "68c2ed928c91b9b2ce471c04"
export const getTripData = async(id) => {
    const res = await fetchTrip(id);
    const data = res.data;
    return data;
}