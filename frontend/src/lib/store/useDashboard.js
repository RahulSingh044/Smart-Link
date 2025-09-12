import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// This is a type-like definition using JSDoc
/**
 * @typedef {object} Bus
 * @property {string} _id
 * @property {string} busNumber
 * @property {Object} routeId
 * @property {Object} vehicalInfo 
 * @property {Object} schedule
 */

const useDashboard = create(persist((set) => ({
    /** @type {Route[]} */
    dashData: [],
    setDashData: (newBuses) => set({ buses: newBuses }),
}), {
    name: 'buses-storage',
    storage: createJSONStorage(() => sessionStorage)
}));

export default useDashboard;