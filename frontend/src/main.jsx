import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import WorkoutDetail from './pages/WorkoutDetail';
import NewWorkout from './pages/NewWorkout';
import EditWorkout from './pages/EditWorkout';
import './index.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/workout/new" element={<PrivateRoute><NewWorkout /></PrivateRoute>} />
          <Route path="/workout/:id/edit" element={<PrivateRoute><EditWorkout /></PrivateRoute>} />
          <Route path="/workout/:id" element={<PrivateRoute><WorkoutDetail /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
