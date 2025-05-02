import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function HostRoom({ user }) {
  const navigate = useNavigate();
  const { code } = useParams();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      setMessages([...messages, { user: user?.username || 'Host', text: inputValue }]);
      setInputValue('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-6 flex flex-col">
      <div className="flex justify-between items-center text-white mb-4">
        <h1 className="text-2xl font-bold">Host Room: {code}</h1>
        <button onClick={() => navigate('/main')} className="py-2 px-4 bg-red-600 hover:bg-red-700 rounded-xl">Leave Room</button>
      </div>
      <div className="flex flex-1 space-x-4">
        <div className="flex-1 bg-gray-800 rounded-2xl shadow-lg flex items-center justify-center text-2xl text-white">
          VIDEO PLAYER AREA
        </div>
        <div className="w-1/3 bg-gray-900 rounded-2xl shadow-lg flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.map((msg, idx) => (
              <div key={idx} className="bg-gray-700 p-2 rounded-xl">
                <strong>{msg.user}:</strong> {msg.text}
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-700">
            <input
              className="w-full p-3 rounded-xl bg-gray-700 text-white"
              placeholder="Type a message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
