
import React from 'react';

interface UrlBarProps {
  url: string;
}

const UrlBar: React.FC<UrlBarProps> = ({ url }) => {
  return (
    <div className="flex items-center w-full bg-gray-100 rounded-t-lg p-2">
      <div className="flex items-center space-x-1">
        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
      </div>
      <div className="flex-1 text-center text-sm text-gray-500">{url}</div>
    </div>
  );
};

export default UrlBar;
