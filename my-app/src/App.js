import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import LoginForm from './Utilities/Login';

function App() {
  return (
      <Router>
        <div className="App">
          <header className="App-header">
            <h1>Welcome to My App</h1>
            <Routes>
              <Route path="/" element={<LoginForm />} />
              {/* Add other routes as needed */}
            </Routes>
          </header>
        </div>
      </Router>
  );
}

export default App;