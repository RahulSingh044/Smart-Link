"use client"
import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/app/firebase/config'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Save, XCircle, DollarSign, MapPin, Clock, Ticket, Star } from 'lucide-react'
import useRoutes from '@/lib/store/useRoutes'
import { useHydrated } from '../../../hooks/useHydrated'



const Section = ({ title, children }) => (
    <div className="mb-8">
        <h3 className="text-xl font-semibold text-slate-800 border-b border-gray-200 pb-2 mb-4">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {children}
        </div>
    </div>
);

const FormField = ({ label, value, onChange, name, disabled, icon: Icon }) => (
    <div>
        <label className="text-sm font-medium text-gray-600 flex items-center mb-1">
            {Icon && <Icon className="w-4 h-4 mr-2" />}
            {label}
        </label>
        <input
            type="text"
            name={name}
            value={value}
            // onChange={onChange}
            disabled={disabled}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200 disabled:opacity-60 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
    </div>
);


function page() {
    const { routes, setRoutes, updateRoutes } = useRoutes();
    const searchParams = useSearchParams()
    const [user] = useAuthState(auth);
    const router = useRouter()
    const [route, setRoute] = useState(null)
    const hydrated = useHydrated();

    useEffect(() => {
        if (!hydrated) return;
        const userSession = sessionStorage.getItem('user');
        if (!user && !userSession) {
            router.push('/admin/login');
            return;
        }
        const code = searchParams.get('code');
        const x = routes.filter(r => r.code === code);
        console.log(x[0]);
        setRoute(x[0]);

    }, [user, router, hydrated, routes, searchParams])

    if (!route) {
        return <p>Loading...</p>
    }

return (
        <div className="bg-gray-100 min-h-screen p-4 sm:p-6 md:p-8 text-slate-900 font-sans">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className='flex items-center gap-4 mb-8'>
                    <button
                        onClick={() => router.push('/admin/routes')}
                        className='p-2 rounded-full hover:bg-gray-200 transition-colors duration-200'
                        aria-label="Go back to routes"
                    >
                        <ArrowLeft size={28} />
                    </button>
                    <h1 className='text-3xl md:text-4xl font-bold tracking-tight'>Edit Route</h1>
                    <span className="ml-auto px-3 py-1 text-sm font-semibold bg-indigo-600 text-white rounded-full">{route.code}</span>
                </div>

                {/* Form Card */}
                <div className='bg-white border border-gray-200 rounded-2xl shadow-lg p-6 sm:p-8'>
                    <form>
                        {/* Route Details Section */}
                        <Section title="Route Details">
                            <FormField label="Route Name" name="name" value={route.name}  disabled={true} icon={Ticket} />
                            <FormField label="Status" name="status" value={route.status} disabled={true} icon={Star} />
                        </Section>

                        {/* Stations Section */}
                        <Section title="Start & End Stations">
                            <FormField label="Start Station" name="startStation.stationName" value={route.startStation.stationName}  disabled={true} icon={MapPin} />
                            <FormField label="Departure Time" name="startStation.departureTime" value={route.startStation.departureTime}  disabled={true} icon={Clock} />
                            <FormField label="End Station" name="endStation.stationName" value={route.endStation.stationName}  disabled={true} icon={MapPin} />
                            <FormField label="Arrival Time" name="endStation.arrivalTime" value={route.endStation.arrivalTime}  disabled={true} icon={Clock} />
                        </Section>
                        
                        {/* Intermediate Stops Section */}
                        {route.stops && route.stops.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-xl font-semibold text-slate-800 border-b border-gray-200 pb-2 mb-4">Intermediate Stops</h3>
                                {route.stops.map((stop, index) => (
                                     <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <FormField label={`Stop ${index + 1} Station`} value={stop.stationName} onChange={(e) => handleStopChange(index, 'stationName', e.target.value)} disabled={true} icon={MapPin}/>
                                        <FormField label="Arrival" value={stop.arrivalTime} onChange={(e) => handleStopChange(index, 'arrivalTime', e.target.value)} disabled={true} icon={Clock}/>
                                        <FormField label="Departure" value={stop.departureTime} onChange={(e) => handleStopChange(index, 'departureTime', e.target.value)} disabled={true} icon={Clock}/>
                                     </div>
                                ))}
                            </div>
                        )}

                        {/* Fare Section */}
                        <Section title="Fare Information">
                            <FormField label="Base Fare" name="fare.baseFare" value={route.fare.baseFare}  disabled={true}  />
                            <FormField label="Max Fare" name="fare.maxFare" value={route.fare.maxFare}  disabled={true}  />
                            {route.fare.concessions.map((concession, index) => (
                                <FormField 
                                    key={index}
                                    label={`${concession.type} Discount (%)`} 
                                    name={`fare.concessions.${index}.discount`}
                                    value={route.fare.concessions[index].discount}
                                    
                                    disabled={true} 
                                    icon={Ticket}
                                />
                            ))}
                        </Section>
                        <Section title="Intermediate Stations">
                            {route.intermediatePoints.map((point)=>(
                                <FormField key={point.pointId} disabled={true} value={point.pointName}/>
                            ))}
                        </Section>
                        <Section title="Timings">
                            <FormField label="First Trip" disabled={true} value={route.timing.firstTrip}/>
                            <FormField label="Last Trip" disabled={true} value={route.timing.lastTrip}/>
                            <FormField label="Frequency" disabled={true} value={route.timing.frequency}/>
                            <FormField label="Total Duration" disabled={true} value={route.timing.totalDuration}/>
                        </Section>
                        
                    </form>
                </div>
            </div>
        </div>
    )

}

export default page
