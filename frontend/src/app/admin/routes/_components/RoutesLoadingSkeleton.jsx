import React from 'react'
import SideNavbar from '../../_components/SideNavbarLoadingSkeleton';

function RoutesLoadingSkeleton() {
    return (
        <div className='flex h-screen bg-gray-50'>
            <SideNavbar />
            <div className="animate-pulse flex-1 p-8">

                <div className="flex items-center justify-between mb-8 border-b-2 border-gray-200 pb-4">
                    <div className='w-52 h-8 bg-gray-300 rounded-md'></div>
                    <button
                        className='flex items-center gap-2 bg-gray-200 px-4 py-2 rounded-lg w-20 h-10 transition-colors duration-300 '>
                    </button>
                </div>

                <div className="grid grid-cols-4 gap-14 mb-8">
                    <div className="h-28 bg-gray-200 rounded-lg"></div>
                    <div className="h-28 bg-gray-200 rounded-lg"></div>
                    <div className="h-28 bg-gray-200 rounded-lg"></div>
                    <div className="h-28 bg-gray-200 rounded-lg"></div>
                </div>
                <div className='mt-14 border border-gray-300 shadow-lg p-6 rounded-lg'>
                    <div className="h-8 bg-gray-200 rounded-lg w-1/4 mb-6"></div>
                    <table className='min-w-full'>
                        <thead>
                            <tr>
                                {[...Array(9)].map((_, i) => (
                                    <th key={i} className='py-3 px-6'>
                                        <div className="h-4 bg-gray-200 rounded-lg w-full"></div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[...Array(5)].map((_, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    {[...Array(9)].map((_, j) => (
                                        <td key={j} className='py-4 px-6 border-b border-gray-200 text-center text-sm'>
                                            <div className="h-4 bg-gray-200 rounded-lg w-full"></div>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default RoutesLoadingSkeleton