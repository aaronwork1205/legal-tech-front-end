import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import VerifyEmailPage from "./pages/VerifyEmailPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AssistantWorkspace from "./pages/AssistantWorkspace.jsx";
import AIAssistantPage from "./pages/AIAssistantPage.jsx";
import DemoShowcase from "./pages/DemoShowcase.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import { AuthProvider } from "./state/authContext.jsx";
import { ProtectedRoute } from "./components/routing/ProtectedRoute.jsx";
import { PublicRoute } from "./components/routing/PublicRoute.jsx";

const App = () => (
  <AuthProvider>
    <Routes>
      <Route
        index
        element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/verify-email"
        element={
          <PublicRoute>
            <VerifyEmailPage />
          </PublicRoute>
        }
      />
      <Route
        path="/demo"
        element={
          <PublicRoute>
            <DemoShowcase />
          </PublicRoute>
        }
      />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/assistant" element={<AssistantWorkspace />} />
        <Route path="/ai-chat" element={<AIAssistantPage />} />
      </Route>

      <Route path="/app" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </AuthProvider>
);

export default App;
