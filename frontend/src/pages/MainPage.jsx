import React from 'react';
import { useNavigate } from 'react-router-dom';

const MainPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-2/3 p-8 bg-gray-900 rounded-lg relative">
        <button className="absolute top-4 left-4 bg-red-700 text-white px-4 py-2 rounded">Logout</button>
        <div className="flex justify-center space-x-10 mt-20">
          <button onClick={() => navigate('/room/host')} className="bg-red-700 text-white px-6 py-2 rounded">Create Room</button>
          <button onClick={() => navigate('/room/guest')} className="bg-red-700 text-white px-6 py-2 rounded">Join Room</button>
        </div>
      </div>
    </div>
  );
}

export default MainPage;