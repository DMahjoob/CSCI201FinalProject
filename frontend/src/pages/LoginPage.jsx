import React from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/main');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="flex w-2/3 p-8 bg-gray-900 rounded-lg">
        <div className="flex-1 border rounded-lg mr-8"></div>
        <div className="flex-1 p-6 bg-gray-800 rounded-lg">
          <h2 className="text-white text-xl mb-6">Login</h2>
          <input className="w-full p-2 mb-4 rounded bg-gray-300" placeholder="Username" />
          <input className="w-full p-2 mb-6 rounded bg-gray-300" placeholder="Password" type="password" />
          <button onClick={handleLogin} className="w-full bg-red-700 text-white py-2 rounded">Log in</button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;