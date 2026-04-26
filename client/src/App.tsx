import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { PublicOnlyRoute } from './auth/PublicOnlyRoute';

// Public pages
import { Landing } from './pages/Landing/Landing';
import { Signup } from './pages/Signup/Signup';
import { Login } from './pages/Login/Login';
import { NotFound } from './pages/NotFound/NotFound';

// Protected pages (Phase 6)
import { Dashboard } from './pages/Dashboard/Dashboard';
import { MyTasks } from './pages/MyTasks/MyTasks';
import { AddTask } from './pages/AddTask/AddTask';
import { EditTask } from './pages/EditTask/EditTask';
import { Profile } from './pages/Profile/Profile';

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />

      {/* Public-only routes — redirect to /app/dashboard if logged in */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Protected routes — redirect to /login if not logged in */}
      <Route path="/app" element={<ProtectedRoute />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tasks" element={<MyTasks />} />
        <Route path="tasks/new" element={<AddTask />} />
        <Route path="tasks/:id/edit" element={<EditTask />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
