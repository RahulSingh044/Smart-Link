import React from "react";
import { BusFront, Compass } from "lucide-react";

const NearbyStop = ({ name, city, street, distance, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between hover:shadow-md transition cursor-pointer">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <BusFront className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-800">{name}</p>
          <p className="text-xs text-gray-600">
            {street}, {city}
          </p>
          <p className="text-xs text-gray-500">{distance} away</p>
        </div>
      </div>
      <Compass className="w-5 h-5 text-green-600 hover:text-green-800 cursor-pointer" />
    </div>
  );
};

export default NearbyStop;
