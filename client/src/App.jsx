import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/tokens.css';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import ChatPage from './pages/ChatPage.jsx';
import AuthPage from './pages/AuthPage.jsx';

function AppRoute({ children }) {
  const { loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-muted border-t-primary"
          style={{ animation: 'spin 0.8s linear infinite' }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<GuestRoute><AuthPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><AuthPage /></GuestRoute>} />
          <Route path="/" element={<AppRoute><ChatPage /></AppRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
