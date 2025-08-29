// 2025-01-27: Creating router configuration for Phase 2 React frontend

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './store/authStore';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import DirectoryPage from './pages/DirectoryPage';
import AddEntryPage from './pages/AddEntryPage';
import FamilyPage from './pages/FamilyPage';
import AdminPage from './pages/AdminPage';

import AdminUserManagementPage from './pages/AdminUserManagementPage';
import AdminPendingChangesPage from './pages/AdminPendingChangesPage';
import SettingsPage from './pages/SettingsPage';
import PremiumImageSearchPage from './pages/PremiumImageSearchPage';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes - Always render these components */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected Routes with Layout */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<HomePage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="directory" element={<DirectoryPage />} />
        <Route path="add-entry" element={<AddEntryPage />} />
        <Route path="family" element={<FamilyPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="admin" element={<AdminPage />} />

        <Route path="admin/users" element={<AdminUserManagementPage />} />
        <Route path="admin/pending-changes" element={<AdminPendingChangesPage />} />
        <Route path="premium-image-search" element={<PremiumImageSearchPage />} />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
