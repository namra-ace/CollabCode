import React from "react";

function Spinner() {
  return (
    <div className="flex flex-col items-center space-y-4 animate-fadeIn">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-blue-400 font-medium text-lg">Loading Project...</p>
    </div>
  );
}

export default Spinner;
