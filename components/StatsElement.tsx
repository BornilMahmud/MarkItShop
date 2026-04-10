// *********************
// IN DEVELOPMENT
// *********************

import React from "react";
import { FaArrowDown, FaArrowUp } from "react-icons/fa6";

interface StatsElementProps {
  title?: string;
  value?: string | number;
  delta?: number;
  subtitle?: string;
}

const StatsElement = ({
  title = "New Products",
  value = "2,230",
  delta = 12.5,
  subtitle = "Since last month",
}: StatsElementProps) => {
  const isPositive = delta >= 0;

  return (
    <div className="w-80 min-h-32 bg-blue-500 text-white flex flex-col justify-center items-center rounded-md max-md:w-full px-4 py-5 text-center">
      <h4 className="text-xl text-white">{title}</h4>
      <p className="text-2xl font-bold">{value}</p>
      <p
        className={`flex gap-x-1 items-center ${
          isPositive ? "text-green-300" : "text-red-200"
        }`}
      >
        {isPositive ? <FaArrowUp /> : <FaArrowDown />}
        {Math.abs(delta).toFixed(1)}% {subtitle}
      </p>
    </div>
  );
};

export default StatsElement;
