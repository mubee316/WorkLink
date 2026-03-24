import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import WorkerSearch from './pages/WorkerSearch';
import WorkerProfile from './pages/WorkerProfile';
import BookingPage from './pages/BookingPage';
import MyJobs from './pages/MyJobs';
import JobDetails from './pages/JobDetails';
import PaymentCallback from './pages/PaymentCallback';
import ReviewPage from './pages/ReviewPage';
import ConversationsPage from './pages/ConversationsPage';
import ChatPage from './pages/ChatPage';
import ProfileEditPage from './pages/ProfileEditPage';
import PaymentsPage from './pages/PaymentsPage';
import SettingsPage from './pages/SettingsPage';
import WorkerReviewsPage from './pages/WorkerReviewsPage';
import NinVerification from './pages/NinVerification';
import WorkerSetupPage from './pages/WorkerSetupPage';
import LandingPage from './pages/LandingPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/payment/callback" element={<PaymentCallback />} />
          <Route path="/verify-nin" element={<NinVerification />} />
          <Route path="/worker-setup" element={<WorkerSetupPage />} />

          {/* Protected */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/workers" element={<ProtectedRoute><WorkerSearch /></ProtectedRoute>} />
          <Route path="/workers/:id" element={<ProtectedRoute><WorkerProfile /></ProtectedRoute>} />
          <Route path="/book/:workerId" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
          <Route path="/jobs" element={<ProtectedRoute><MyJobs /></ProtectedRoute>} />
          <Route path="/jobs/:id" element={<ProtectedRoute><JobDetails /></ProtectedRoute>} />
          <Route path="/review/:jobId" element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />
          <Route path="/conversations" element={<ProtectedRoute><ConversationsPage /></ProtectedRoute>} />
          <Route path="/chat/:conversationId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/profile/edit" element={<ProtectedRoute><ProfileEditPage /></ProtectedRoute>} />
          <Route path="/payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/reviews" element={<ProtectedRoute><WorkerReviewsPage /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
