import { useEffect, useState } from 'react';
import { getTheme, saveTheme } from './utils/theme.js';
import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import PostEditorPage from './pages/PostEditorPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import BlogsPage from './pages/BlogsPage.jsx';
import BlogReaderPage from './pages/BlogReaderPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import UsersPage from './pages/UsersPage.jsx';

/** Render public routes and role-protected browser-local content routes. */
export default function App() {
  const [theme, setTheme] = useState(getTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    saveTheme(theme);
  }, [theme]);

  /** Change appearance without touching the session or reloading the route. */
  function toggleTheme() {
    setTheme((current) => current === 'dark' ? 'light' : 'dark');
  }

  const themeProps = { theme, onToggleTheme: toggleTheme };

  return (
    <Routes>
      <Route element={<LandingPage {...themeProps} />} path="/" />
      <Route element={<LoginPage />} path="/login" />
      <Route element={<RegisterPage />} path="/register" />
      <Route
        element={
          <ProtectedRoute>
            <BlogsPage {...themeProps} />
          </ProtectedRoute>
        }
        path="/blogs"
      />
      <Route
        element={
          <ProtectedRoute>
            <BlogReaderPage {...themeProps} />
          </ProtectedRoute>
        }
        path="/blog/:id"
      />
      <Route
        element={
          <ProtectedRoute>
            <PostEditorPage {...themeProps} />
          </ProtectedRoute>
        }
        path="/write"
      />
      <Route
        element={
          <ProtectedRoute>
            <PostEditorPage {...themeProps} />
          </ProtectedRoute>
        }
        path="/edit/:id"
      />
      <Route
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboardPage {...themeProps} />
          </ProtectedRoute>
        }
        path="/admin"
      />
      <Route
        element={
          <ProtectedRoute requiredRole="admin">
            <UsersPage {...themeProps} />
          </ProtectedRoute>
        }
        path="/users"
      />
      <Route element={<NotFoundPage />} path="*" />
    </Routes>
  );
}
