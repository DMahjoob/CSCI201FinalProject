// src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MainPage from './pages/MainPage';
import GuestRoom from './pages/GuestRoom';
import HostRoom from './pages/HostRoom';
// import { generateRoomCode } from './utils/generateRoomCode';

export default function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage setUser={setUser} />} />
        <Route path="/signup" element={<SignupPage setUser={setUser} />} />
        <Route path="/main" element={<MainPage user={user} />} />
        <Route path="/room/guest" element={<GuestRoom user={user} />} />
        <Route path="/room/host" element={<HostRoom user={user} />} />
      </Routes>
    </Router>
  );
}



// import { useState } from 'react'
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import LoginPage from './pages/LoginPage';
// import SignupPage from './pages/SignupPage';
// import MainPage from './pages/MainPage';
// import GuestRoom from './pages/GuestRoom';
// import HostRoom from './pages/HostRoom';

// const App = () => {

//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<LoginPage />} />
//         <Route path="/signup" element={<SignupPage />} />
//         <Route path="/main" element={<MainPage />} />
//         <Route path="/room/guest" element={<GuestRoom />} />
//         <Route path="/room/host" element={<HostRoom />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;
