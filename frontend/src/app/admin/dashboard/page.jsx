'use client';

import React, { useEffect, useState, useRef } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from "../../firebase/config"
import { useRouter } from 'next/navigation'
import SideNavbar from '../_components/SideNavbar';
import { useDashActivity } from '@/hooks/useDashActivity';
import DashBoardLoadingSkeleton from './_components/DashBoardLoadingSkeleton';
import { Chart } from 'chart.js/auto';

function AdminDashBoard() {

    const [user] = useAuthState(auth);
    const userSession = sessionStorage.getItem('user');
    const [activeSection, setActiveSection] = useState('Dashboard');
    const { data, loading, error } = useDashActivity()
    const router = useRouter();

    // Charts Details 
    const ridershipChartRef = useRef(null);
    const timeOfDayChartRef = useRef(null);
    const loadFactorChartRef = useRef(null);
    const roadDelaysChartRef = useRef(null);

    const [avgLoadFactor, setAvgLoadFactor] = useState(0);


    if (typeof window !== 'undefined' && !user && !userSession) {
        router.push('/admin/login');
    }

    // Chart data
    const chartData = {
        ridership: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Total Ridership',
                data: [25000, 26500, 27100, 26000, 29500, 18000, 15000],
                borderColor: 'rgb(3, 105, 161)',
                backgroundColor: 'rgba(3, 105, 161, 0.2)',
                borderWidth: 2,
                tension: 0.3,
                pointBackgroundColor: 'rgb(3, 105, 161)',
                fill: true
            }]
        },
        timeOfDay: {
            labels: ['12AM', '4AM', '8AM', '12PM', '4PM', '8PM'],
            datasets: [{
                label: 'Avg. Ridership',
                data: [500, 2000, 15000, 10000, 18000, 9000],
                backgroundColor: 'rgba(5, 150, 105, 0.8)', // green
                borderColor: 'rgba(5, 150, 105, 1)',
                borderWidth: 1
            }]
        },
        loadFactor: {
            labels: ['Route C', 'Route A', 'Route E', 'Route D', 'Route B'],
            datasets: [{
                label: 'Load Factor (%)',
                data: [88, 75, 55, 60, 45],
                backgroundColor: 'rgba(107, 114, 128, 0.8)', // gray
                borderColor: 'rgba(107, 114, 128, 1)',
                borderWidth: 1
            }]
        },
        roadDelays: {
            labels: ['Main Street', 'Oak Avenue', 'Elm Street', 'Pine Road', 'Maple Drive'],
            datasets: [{
                label: 'Average Delay (minutes)',
                data: [15, 8, 20, 12, 5],
                backgroundColor: 'rgba(239, 68, 68, 0.8)', // red
                borderColor: 'rgba(239, 68, 68, 1)',
                borderWidth: 1
            }]
        }
    };

    // Chart options
    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#4b5563'
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(209, 213, 219, 0.5)' },
                ticks: { color: '#4b5563' }
            },
            x: {
                grid: { color: 'rgba(209, 213, 219, 0.5)' },
                ticks: { color: '#4b5563' }
            }
        }
    };

    useEffect(() => {
        // Function to create a chart
        const createChart = (ctx, type, data, options) => {
            // Check if the canvas context is available before creating the chart
            if (!ctx) {
                console.error("Canvas context is not available for chart.");
                return null;
            }
            const chart = new Chart(ctx, { type, data, options });
            return chart;
        };

        // Only try to create charts if not loading and all refs are ready
        if (!loading) {
            const ridershipChart = createChart(ridershipChartRef.current?.getContext('2d'), 'line', chartData.ridership, chartOptions);
            const timeOfDayChart = createChart(timeOfDayChartRef.current?.getContext('2d'), 'bar', chartData.timeOfDay, chartOptions);
            const loadFactorChart = createChart(loadFactorChartRef.current?.getContext('2d'), 'bar', chartData.loadFactor, { ...chartOptions, indexAxis: 'y', scales: { ...chartOptions.scales, x: { ...chartOptions.scales.x, max: 100 } } });
            const roadDelaysChart = createChart(roadDelaysChartRef.current?.getContext('2d'), 'bar', chartData.roadDelays, chartOptions);

            return () => {
                ridershipChart?.destroy();
                timeOfDayChart?.destroy();
                loadFactorChart?.destroy();
                roadDelaysChart?.destroy();
            };
        }
    }, [loading]); // The key change: The dependency array now includes the 'loading' state

    useEffect(() => {
        const totalRidership = chartData.ridership.datasets[0].data.reduce((sum, current) => sum + current, 0);
        const totalBuses = 1250;
        const avgBusCapacity = 75; // This is a placeholder value
        const calculatedLoadFactor = (totalRidership / (totalBuses * avgBusCapacity)) * 100;
        setAvgLoadFactor(calculatedLoadFactor);
    }, [chartData.ridership]);

    useEffect(() => {
        if (user) {
            user.getIdToken().then(token => {
                localStorage.setItem('userAuth', token);
                console.log("Data", data);
                console.log("Token stored in localStorage:", token);
            });
        }
    }, [user]);

    if (loading) {
        return <DashBoardLoadingSkeleton />;
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <SideNavbar
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                loading={loading}
            />
            <div className="flex-1 p-8 overflow-y-auto mb-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                    <p className="text-gray-600">Welcome back, Admin!</p>
                </div>

                <div className='w-full p-4 rounded-2xl mb-10 bg-slate-100 '>
                    <div className="grid grid-cols-3 gap-6">
                        {/* Total Fleet */}
                        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Total Fleet</h3>
                                    <p className="mt-1 text-3xl font-bold text-gray-900">{data.buses}</p>
                                </div>
                                <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M16 4h4a2 2 0 012 2v8a2 2 0 01-2 2h-4v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2H2a2 2 0 01-2-2V6a2 2 0 012-2h4V2h8v2zM4 14v4h12v-4H4zm16-8v4h-4V6h4z" /></svg>
                            </div>
                        </div>
                        {/* Active Buses */}
                        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Stations</h3>
                                    <p className="mt-1 text-3xl font-bold text-gray-900">{data.stations}</p>
                                </div>
                                <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zm-1-8h2v6h-2v-6zm0-4h2v2h-2V6z" /></svg>
                            </div>
                        </div>
                        {/* On-Time Performance */}
                        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">On-Time Performance</h3>
                                    <p className="mt-1 text-3xl font-bold text-gray-900">85.7%</p>
                                </div>
                                <svg className="w-10 h-10 text-teal-600" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM15.5 8h-2.25c-.14 0-.25.11-.25.25v5.5c0 .14.11.25.25.25h1.25c.14 0 .25-.11.25-.25V9.5h1.25c.14 0 .25-.11.25-.25V8.25c0-.14-.11-.25-.25-.25zM12 12a1 1 0 110-2 1 1 0 010 2z" /></svg>
                            </div>
                        </div>
                        {/* Avg. Load Factor */}
                        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Avg. Load Factor</h3>
                                    <p className="mt-1 text-3xl font-bold text-gray-900">{avgLoadFactor.toFixed(1)}%</p>
                                </div>
                                <svg className="w-10 h-10 text-indigo-600" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-4.75 14.5c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h9.5c.41 0 .75.34.75.75s-.34.75-.75.75h-9.5zM12 13c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" /></svg>
                            </div>
                        </div>
                        {/* Avg. Fuel Consumption */}
                        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Avg. Fuel Consumption</h3>
                                    <p className="mt-1 text-3xl font-bold text-gray-900">4.5 MPG</p>
                                </div>
                                <svg className="w-10 h-10 text-red-600" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2c-4.418 0-8 3.582-8 8 0 4.418 3.582 8 8 8 4.418 0 8-3.582 8-8 0-4.418-3.582-8-8-8zm0 14a6 6 0 110-12 6 6 0 010 12zm-2-2h4v-2h-4v2zm2-4h-2V7h2v3z" /></svg>
                            </div>
                        </div>
                        {/* Avg. Daily Distance */}
                        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Avg. Daily Distance</h3>
                                    <p className="mt-1 text-3xl font-bold text-gray-900">350 km</p>
                                </div>
                                <svg className="w-10 h-10 text-orange-600" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.657 16.657L13.414 20.9A2 2 0 0110.586 20.9l-4.243-4.243m4.243 0L12 18.043l2.828-2.829m-4.243 0L12 18.043l-4.243-4.242M12 21a2 2 0 01-2-2v-4a2 2 0 012-2h0a2 2 0 012 2v4a2 2 0 01-2 2z" /></svg>
                            </div>
                        </div>
                    </div>
                </div>


                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* Daily Ridership Chart */}
                    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Daily Ridership</h2>
                        <canvas ref={ridershipChartRef} id="ridershipChart"></canvas>
                    </div>

                    {/* Ridership by Time of Day */}
                    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Ridership by Time of Day</h2>
                        <canvas ref={timeOfDayChartRef} id="timeOfDayChart"></canvas>
                    </div>

                    {/* Passenger Load Factor Chart */}
                    <div className="bg-white rounded-lg shadow p-6 lg:col-span-1 xl:col-span-1 border border-gray-200">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Passenger Load Factor by Route</h2>
                        <canvas ref={loadFactorChartRef} id="loadFactorChart"></canvas>
                    </div>

                    {/* Road Delays Chart */}
                    <div className="bg-white rounded-lg shadow p-6 mt-8 border border-gray-200 lg:col-span-2 xl:col-span-3">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Average Daily Road Delays</h2>
                        <canvas ref={roadDelaysChartRef} id="roadDelaysChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashBoard