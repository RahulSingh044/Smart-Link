'use client';

import React, { useEffect, useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from "../../firebase/config"
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation'
import SideNavbar from '../_components/SideNavbar';

function AdminDashBoard() {

    const [user, loading, error] = useAuthState(auth);
    const [activeSection, setActiveSection] = useState('Dashboard');
    const [data,setData] = useState({})
    const [_error,setError] = useState(null);
    const router = useRouter();

    
    
    
    useEffect(() => {
        const userSession = sessionStorage.getItem('user');
        if (!user && !userSession) {
            router.push('/admin/login');
        }
        const dashBoardData = async () => {
            setError(null);
            try{
                const idToken = await user.getIdToken();
                const res = await fetch('http://localhost:5000/admin/dashboard',{
                    headers:{
                        'Authorization': `Bearer ${idToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                if(!res.ok){
                    throw new Error("Response not Ok");
                }
                const val = await res.json();
                console.log(val);
                setData(val);
            }catch(err){
                setError(err.message);
                console.log(_error);
            }
        }
        dashBoardData();
    }, [user, router])

    

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-lg">Loading...</div>;
    }



    return (
        <div className="flex h-screen bg-gray-50">
            <SideNavbar
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                loading={loading}
            />
            <div className="flex-1 p-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                    <p className="text-gray-600">Welcome back, Admin!</p>
                </div>

                {/* Stats Cards Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                        <h2 className="text-xl font-semibold text-gray-700">Total Buses</h2>
                        <p className="text-4xl font-bold text-blue-600 mt-2">{data.buses}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                        <h2 className="text-xl font-semibold text-gray-700">Active Routes</h2>
                        <p className="text-4xl font-bold text-green-600 mt-2">{data.routes}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                        <h2 className="text-xl font-semibold text-gray-700">Total Stations</h2>
                        <p className="text-4xl font-bold text-yellow-600 mt-2">{data.stations}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                        <h2 className="text-xl font-semibold text-gray-700">Online Drivers</h2>
                        <p className="text-4xl font-bold text-red-600 mt-2">{data.stops}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminDashBoard