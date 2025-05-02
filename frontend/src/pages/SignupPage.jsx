import React from 'react';
import { useNavigate } from 'react-router-dom';

const SignupPage = () => {
  const navigate = useNavigate();

  const handleSignup = () => {
    navigate('/main');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-1/3 p-8 bg-gray-800 rounded-lg">
        <h2 className="text-white text-xl mb-6">Sign Up</h2>
        <input className="w-full p-2 mb-4 rounded bg-gray-300" placeholder="Full Name" />
        <input className="w-full p-2 mb-4 rounded bg-gray-300" placeholder="Username" />
        <input className="w-full p-2 mb-4 rounded bg-gray-300" placeholder="Email" />
        <input className="w-full p-2 mb-6 rounded bg-gray-300" placeholder="Password" type="password" />
        <button onClick={handleSignup} className="w-full bg-red-700 text-white py-2 rounded">Sign up</button>
      </div>
    </div>
  );
}

export default SignupPage;