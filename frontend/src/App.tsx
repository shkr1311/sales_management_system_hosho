import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import LoginPage from '@/pages/auth/LoginPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';

// Sales Pages
import CustomersPage from '@/pages/sales/CustomersPage';
import ContactsPage from '@/pages/sales/ContactsPage';
import LeadsPage from '@/pages/sales/LeadsPage';
import OpportunitiesPage from '@/pages/sales/OpportunitiesPage';
import PipelinePage from '@/pages/sales/PipelinePage';
import ActivitiesPage from '@/pages/sales/ActivitiesPage';
import TargetsPage from '@/pages/sales/TargetsPage';

// Management Pages
import TeamPerformancePage from '@/pages/management/TeamPerformancePage';
import TerritoriesPage from '@/pages/management/TerritoriesPage';
import DiscountRequestsPage from '@/pages/management/DiscountRequestsPage';
import ForecastPage from '@/pages/management/ForecastPage';

// Accounts Pages
import Customer360Page from '@/pages/accounts/Customer360Page';
import AccountPlansPage from '@/pages/accounts/AccountPlansPage';
import SatisfactionPage from '@/pages/accounts/SatisfactionPage';
import RenewalsPage from '@/pages/accounts/RenewalsPage';

// Marketing Pages
import CampaignsPage from '@/pages/marketing/CampaignsPage';
import QualifiedLeadsPage from '@/pages/marketing/QualifiedLeadsPage';
import SegmentsPage from '@/pages/marketing/SegmentsPage';
import ContentPage from '@/pages/marketing/ContentPage';

// Product Pages
import ProductsPage from '@/pages/product/ProductsPage';
import ProductUpdatesPage from '@/pages/product/ProductUpdatesPage';
import FeedbackPage from '@/pages/product/FeedbackPage';
import FeatureRequestsPage from '@/pages/product/FeatureRequestsPage';
import DocumentationPage from '@/pages/product/DocumentationPage';

// Executive Pages
import ExecutiveAnalyticsPage from '@/pages/executive/ExecutiveAnalyticsPage';

import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />

        {/* Sales */}
        <Route path="customers" element={<CustomersPage />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="opportunities" element={<OpportunitiesPage />} />
        <Route path="activities" element={<ActivitiesPage />} />
        <Route path="pipeline" element={<PipelinePage />} />
        <Route path="targets" element={<TargetsPage />} />

        {/* Management */}
        <Route path="team-performance" element={<TeamPerformancePage />} />
        <Route path="territories" element={<TerritoriesPage />} />
        <Route path="discount-requests" element={<DiscountRequestsPage />} />
        <Route path="forecast" element={<ForecastPage />} />

        {/* Accounts */}
        <Route path="customer-360" element={<Customer360Page />} />
        <Route path="account-plans" element={<AccountPlansPage />} />
        <Route path="satisfaction" element={<SatisfactionPage />} />
        <Route path="renewals" element={<RenewalsPage />} />

        {/* Marketing */}
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="qualified-leads" element={<QualifiedLeadsPage />} />
        <Route path="segments" element={<SegmentsPage />} />
        <Route path="content" element={<ContentPage />} />

        {/* Product */}
        <Route path="products" element={<ProductsPage />} />
        <Route path="product-updates" element={<ProductUpdatesPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
        <Route path="feature-requests" element={<FeatureRequestsPage />} />
        <Route path="documentation" element={<DocumentationPage />} />

        {/* Executive */}
        <Route path="executive" element={<ExecutiveAnalyticsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
