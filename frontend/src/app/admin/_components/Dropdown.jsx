import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

// A reusable, customizable dropdown component
const Dropdown = ({
    options = [],
    buses = [],
    selected,
    onSelect,
    placeholder = 'Select an option',
    className = '',
    menuClassName = '',
    disabled = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);



    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, []);

    const handleSelect = (e) => {
        e.preventDefault();
        document.getElementById('showSelected').innerHTML = e.target.innerHTML;
        const currRoute = JSON.parse(e.target.value);
        const routeBuses = [];
        buses.forEach((bus)=>{
            if(currRoute.assignedBuses.includes(bus._id )){
                routeBuses.push(bus);
            }
        })
        onSelect(routeBuses);
        setIsOpen(false);
    };

    const selectedOption = Array.isArray(options) ? options.find(option => option.name === selected) : null;

    return (
        <div
            ref={dropdownRef}
            className={`relative w-full rounded-lg ${className}`}
        >
            <button
                type="button"
                className={`flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${disabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
            >
                <span id='showSelected'>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
            </button>

            {isOpen && Array.isArray(options) && (
                <div
                    className={`absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg transition-transform duration-200 ease-out transform scale-y-100 origin-top ${menuClassName}`}
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="menu-button"
                >
                    <div className="py-1 h-[300px] overflow-auto" role="none">
                        {options.map((option) => (
                            <button
                                key={option.code}
                                value={JSON.stringify(option)}
                                onClick={handleSelect}
                                className={`w-full text-center block py-2 text-sm text-gray-700 cursor-pointer dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 ease-in-out ${option.name === selected ? 'bg-gray-100 dark:bg-gray-700' : ''
                                    }`}
                                role="menuitem"
                            >
                                {option.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dropdown;
