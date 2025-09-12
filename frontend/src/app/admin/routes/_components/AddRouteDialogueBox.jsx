"use client";
import React, { useState } from 'react'
import { X } from 'lucide-react';
import { SelectBus } from '@/components/selectBus';
import { toast } from "sonner";

function AddRouteDialogueBox({ isOpen, onClose }) {

    const [newRoute, setNewRoute] = useState({
        code: '',
        name: '',
        startStation:'',
        endStation: '',
        firstTrip: '',
        lastTrip: '',
        frequency: '',
        type:'',
        status: 'active',

    })

    const handleInputChange = (e) => {
        const { value } = e.target;
        setNewRoute({ ...newRoute, value });
    };

    const handleAddRoute = (e) => {
        e.preventDefault();
        console.log("Route Added:", newRoute);
        toast("Bus Added Successfully")
        onClose(true);
    }

    const handleCloseModal = () => {
        onClose(true);
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-white/50 flex items-center justify-center pt-14 z-50 overflow-auto">
            <div className="rounded-lg bg-white p-6 w-full max-w-md shadow-2xl">
                <div className="flex justify-between mb-4">
                    <h2 className="text-2xl font-bold mb-4">Add a New Route</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-300">
                        <X className="w-7 h-7" />
                    </button>
                </div>
                <form onSubmit={handleAddRoute}>

                    
                    <div className="mb-3">
                        <label className="block text-gray-700 font-semibold mb-2">Route Code</label>
                        <input
                            type="text"
                            name="routeCode"
                            value={newRoute.code}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., RT001"
                            required
                        />
                    </div>

                    
                    <div className="mb-3">
                        <label className="block text-gray-700 font-semibold mb-2">Route Name</label>
                        <input
                            type="text"
                            name="routeName"
                            value={newRoute.name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Route 1"
                            required
                        />
                    </div>

                    
                    <div className="mb-3">
                        <label className="block text-gray-700 font-semibold mb-2">Start Station</label>
                        <input
                            type="text"
                            name="startStation"
                            value={newRoute.startStation}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Station-9597"
                            required
                        />
                    </div>

                    
                    <div className="mb-3">
                        <label className="block text-gray-700 font-semibold mb-2">Destination</label>
                        <input
                            type="text"
                            name="destination"
                            value={newRoute.endStation}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Station-9543"
                            required
                        />
                    </div>

                    
                    <div className="mb-3">
                        <label className="block text-gray-700 font-semibold mb-2">First Trip</label>
                        <input
                            type="text"
                            name="firstTrip"
                            value={newRoute.firstTrip}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. 05:00" 
                            pattern="^[0-9]{4}$"  
                            required
                        />
                    </div>


                    
                    <div className="mb-3">
                        <label className="block text-gray-700 font-semibold mb-2">Last Trip</label>
                        <input
                            type="text"
                            name="lastTrip"
                            value={newRoute.lastTrip}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 22:00"
                            required
                        />
                    </div>


                    <div className="mb-3">
                        <label className="block text-gray-700 font-semibold mb-2">Frequency</label>
                        <input
                            type="text"
                            name="frrequrncy"
                            value={newRoute.frequency}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 30"
                            required
                        />
                    </div>


                    <div className="mb-3">
                        <label className="block text-gray-700 font-semibold mb-2">Status</label>
                        <input
                            type="text"
                            name="status"
                            value={newRoute.status}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., active"
                            required
                        />
                    </div>

                    {/* Submit Button  */}
                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            className="px-4 py-2 text-gray-600 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                        >
                            Add Route
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AddRouteDialogueBox