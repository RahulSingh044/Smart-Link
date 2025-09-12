"use client";
import React, { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation';
import { Phone, ArrowRight } from 'lucide-react';


function Login() {

    const [number, setNumber] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (number.length !== 10) {
            setError("Enter a valid 10-digit number");
            return
        } else {
            router.push(`/OTP?number=${number}`);
        }
    };

    return (
        <div style={{ fontFamily: "'Inter', sans-serif" }} className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="bg-white shadow-2xl rounded-2xl p-8">
                    <div className="flex flex-col items-center mb-3">
                        <Image
                            src="/Smart_Link_Logo.png"
                            alt=''
                            width={250}
                            height={250}
                        />
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-600 mb-1">Phone Number</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    // value={number}
                                    onChange={(e) => setNumber(e.target.value)}
                                    maxLength="10"
                                    className={`w-full pl-10 pr-3 py-3 border rounded-lg transition focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                    ${error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-300"}`}
                                    placeholder="Enter your mobile number"
                                />
                            </div>
                            {error && (
                                <p className="text-red-500 text-sm mt-1">Invalid Moblie Number</p>
                            )}
                        </div>

                        <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition flex items-center justify-center gap-2">
                            Send OTP <ArrowRight className="w-5 h-5" />
                        </button>


                    </form>

                    <p className="text-xs text-gray-400 mt-6 text-center">
                        By continuing, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login