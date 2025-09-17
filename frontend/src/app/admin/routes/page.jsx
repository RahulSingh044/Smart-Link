"use client"
import React, { useEffect, useState } from 'react'
import SideNavbar from '../_components/SideNavbar'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from "../../firebase/config"
import { useRouter } from 'next/navigation';
import useRoutes from '@/lib/store/useRoutes'
import { DataTable } from './_components/RouteTable/data-table'
import { columns } from './_components/RouteTable/columns'
import AddRouteDialogueBox from './_components/AddRouteDialogueBox'
import { Plus } from 'lucide-react'
import { useHydrated } from '../../hooks/useHydrated'
import RoutesLoadingSkeleton from './_components/RoutesLoadingSkeleton'

function page() {
    const [user] = useAuthState(auth);
    const [activeSection, setActiveSection] = useState('Routes');
    const [activeRoutes, setActiveRoutes] = useState(0);
    const [isDialogueOpen, setIsDialogueOpen] = useState(false);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const { routes, setRoutes, updateRoutes } = useRoutes();
    const hydrated = useHydrated();

    // -----------------UseEffect------------------------
    useEffect(() => {

        const userSession = sessionStorage.getItem('user');
        if(!hydrated) return;
        if (!user && !userSession) {
            router.push('/admin/login');
        }

        // -------------------- Get Router Data-----------------------
        const getData = async () => {
            try {
                const idToken = await user.getIdToken();
                const route_res = await fetch('http://localhost:5000/api/routes?page=1&limit=50', {
                    headers: {
                        'Authorization': `Bearer ${idToken}`,
                        'Content-Type': 'application/json'
                    }
                })
                if (!route_res.ok) {
                    throw new Error("api/routes -> Response NOT-OK for Routes");
                }
                
                const route_val = await route_res.json();

                console.log(route_val.data);
                setRoutes(route_val.data);
                
                let countActive = 0;
                route_val.data.forEach((route) => {
                    if (route.status === 'active') {
                        countActive += 1;
                    }
                })
                setActiveRoutes(countActive);

            } catch (err) {
                console.log(err);
            } finally {
                setLoading(false);
            }
        }
        if (user) {
            getData();
        }
    }, [user, router,hydrated])


    // ----------------Loading Screen---------------------
    if (loading) {
        return <RoutesLoadingSkeleton />
    }

    return (
        <div className='flex h-screen bg-gray-50 gap-2 '>
            <div className=''>
                <SideNavbar
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                />
            </div>
            <div className='w-4/5 mx-auto'>
                <div onClick={() => setIsDialogueOpen(true)} className="flex items-center justify-between mb-8 border-b-2 border-gray-200 h-18">
                    <h1 className="text-3xl font-bold text-gray-800">Routes</h1>
                    <button
                        className='flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-300 '>
                        <Plus size={20} />
                        <span>Add Route</span>
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                        <h2 className="text-xl font-semibold text-gray-700">Total Routes</h2>
                        <p className="text-4xl font-bold text-blue-600 mt-2">{routes.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                        <h2 className="text-xl font-semibold text-gray-700">Active Routes</h2>
                        <p className="text-4xl font-bold text-green-600 mt-2">30</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                        <h2 className="text-xl font-semibold text-gray-700">InActive Routes</h2>
                        <p className="text-4xl font-bold text-red-600 mt-2">0</p>
                    </div>
                </div>
                <div className='border-2 rounded-lg px-2 w-full '>
                    <DataTable columns={columns} data={routes} />
                </div>
                <AddRouteDialogueBox isOpen={isDialogueOpen} onClose={()=>setIsDialogueOpen(false)}/>
            </div>
        </div>
    )
}

export default page
