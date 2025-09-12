// lib/store/useRoutesStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'

// This is a type-like definition using JSDoc
/**
 * @typedef {object} Route
 * @property {string} _id
 * @property {string} code
 * @property {string} description
 * @property {object} startStation
 * @property {object} endStation
 * @property {Array} assignedBuses
 * @property {Array} intermediatePoints
 */

const useRoutes= create(
    persist((set) => ({
    /** @type {Route[]} */
    routes: [],
    setRoutes: (newRoutes) => set({ routes: newRoutes }),

    addRoute: (newRoute) =>
        set((state) => ({ routes: [...state.routes, newRoute] })),

    updateRoute: (updatedRoute) =>
        set((state) => ({
            routes: state.routes.map((route) =>
                route._id === updatedRoute._id ? updatedRoute : route
            ),
        })),
}),{
    name: 'route-storage',
    storage: createJSONStorage(() => sessionStorage)
}));

export default useRoutes;