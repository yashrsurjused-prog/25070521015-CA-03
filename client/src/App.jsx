import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import { AuthProvider } from './context/AuthContext';
import AdminComplaints from './pages/AdminComplaints';
import AdminDashboard from './pages/AdminDashboard';
import AdminLostFound from './pages/AdminLostFound';
import AdminUsers from './pages/AdminUsers';
import ComplaintDetails from './pages/ComplaintDetails';
import Complaints from './pages/Complaints';
import CreateComplaint from './pages/CreateComplaint';
import CreateLostFoundItem from './pages/CreateLostFoundItem';
import Home from './pages/Home';
import Login from './pages/Login';
import LostFound from './pages/LostFound';
import LostFoundDetails from './pages/LostFoundDetails';
import NotFound from './pages/NotFound';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import './App.css';

function ScrollManager() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const target = document.getElementById(location.hash.slice(1));

      if (target) {
        window.requestAnimationFrame(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        return;
      }
    }

    window.scrollTo({ top: 0, left: 0 });
  }, [location.pathname, location.hash]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollManager />
        <div className="app-shell">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />

            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['student']} />}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/complaints" element={<Complaints />} />
              <Route path="/complaints/new" element={<CreateComplaint />} />
              <Route path="/complaints/:id" element={<ComplaintDetails />} />
              <Route path="/complaints/:id/edit" element={<ComplaintDetails />} />
              <Route path="/lost-found" element={<LostFound />} />
              <Route path="/lost-found/new" element={<CreateLostFoundItem />} />
              <Route path="/lost-found/:id" element={<LostFoundDetails />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/complaints" element={<AdminComplaints />} />
              <Route path="/admin/lost-found" element={<AdminLostFound />} />
              <Route path="/admin/users" element={<AdminUsers />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
