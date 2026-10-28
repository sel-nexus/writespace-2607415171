import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import PostEditorPage from './pages/PostEditorPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import BlogsPage from './pages/BlogsPage.jsx';
import BlogReaderPage from './pages/BlogReaderPage.jsx';

/** Render public routes and role-protected browser-local content routes. */
export default function App() {
  return (
    <Routes>
      <Route element={<LandingPage />} path="/" />
      <Route element={<LoginPage />} path="/login" />
      <Route element={<RegisterPage />} path="/register" />
      <Route element={<ProtectedRoute><BlogsPage /></ProtectedRoute>} path="/blogs" />
      <Route element={<ProtectedRoute><BlogReaderPage /></ProtectedRoute>} path="/blog/:id" />
      <Route element={<ProtectedRoute><PostEditorPage /></ProtectedRoute>} path="/write" />
      <Route element={<ProtectedRoute><PostEditorPage /></ProtectedRoute>} path="/edit/:id" />
      <Route element={<ProtectedRoute requiredRole="admin"><NotFoundPage title="Administrator page not found" /></ProtectedRoute>} path="/admin" />
      <Route element={<ProtectedRoute requiredRole="admin"><NotFoundPage title="User management page not found" /></ProtectedRoute>} path="/users" />
      <Route element={<NotFoundPage />} path="*" />
    </Routes>
  );
}
