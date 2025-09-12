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

const useBuses= create(persist((set) => ({
    /** @type {Route[]} */
    buses: [],
    setBuses: (newBuses) => set({ buses: newBuses }),

    addBuses: (newBus) =>
        set((state) => ({ routes: [...state.buses, newBus] })),

    updateBuses: (updatedBus) =>
        set((state) => ({
            buses: state.buses.map((bus) =>
                route._id === updatedBus._id ? updatedBus : bus
            ),
        })),
}),{
    name:'buses-storage',
    storage: createJSONStorage(() => sessionStorage)
}));

export default useBuses;