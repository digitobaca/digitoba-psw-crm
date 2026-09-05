import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/layout/Layout.jsx';
import ProtectedRoute from '@/components/admin/ProtectedRoute.jsx';
import AdminLayout from '@/components/admin/AdminLayout.jsx';
import PortalProtectedRoute from '@/components/portal/PortalProtectedRoute.jsx';
import PortalLayout from '@/components/portal/PortalLayout.jsx';

// Fee Ledger module — isolated feature, lazy-loaded as its own chunk so it
// doesn't grow the main bundle (see client/src/features/fees/).
const FeesRoutes = lazy(() => import('@/features/fees/FeesRoutes.jsx'));

import HomePage from '@/pages/HomePage.jsx';
import AboutPage from '@/pages/AboutPage.jsx';
import ServicesPage from '@/pages/ServicesPage.jsx';
import PSWPage from '@/pages/PSWPage.jsx';
import PSWCoursesPage from '@/pages/PSWCoursesPage.jsx';
import PSWBenefitsPage from '@/pages/PSWBenefitsPage.jsx';
import PSWPlacementsPage from '@/pages/PSWPlacementsPage.jsx';
import PSWPRPathwayPage from '@/pages/PSWPRPathwayPage.jsx';
import FAQPage from '@/pages/FAQPage.jsx';
import BlogPage from '@/pages/BlogPage.jsx';
import BlogPostPage from '@/pages/BlogPostPage.jsx';
import ContactPage from '@/pages/ContactPage.jsx';
import DeleteMyInfoPage from '@/pages/DeleteMyInfoPage.jsx';
import NotFoundPage from '@/pages/NotFoundPage.jsx';

// India / study-in-Canada vertical
import StudyInCanadaPage from '@/pages/StudyInCanadaPage.jsx';
import ProgramsPage from '@/pages/ProgramsPage.jsx';
import CollegesPublicPage from '@/pages/CollegesPage.jsx';
import AdmissionProcessPage from '@/pages/AdmissionProcessPage.jsx';
import EligibilityCheckerPage from '@/pages/EligibilityCheckerPage.jsx';
import CostCalculatorPage from '@/pages/CostCalculatorPage.jsx';
import SuccessStoriesPage from '@/pages/SuccessStoriesPage.jsx';
import FreeAssessmentPage from '@/pages/FreeAssessmentPage.jsx';
import BookCounsellingPage from '@/pages/BookCounsellingPage.jsx';

// Staff CRM
import LoginPage from '@/pages/admin/LoginPage.jsx';
import DashboardPage from '@/pages/admin/DashboardPage.jsx';
import AdminCollegesPage from '@/pages/admin/CollegesPage.jsx';
import CounsellorsPage from '@/pages/admin/CounsellorsPage.jsx';
import ApplicationsPage from '@/pages/admin/ApplicationsPage.jsx';
import MessagesPage from '@/pages/admin/MessagesPage.jsx';
import AnalyticsPage from '@/pages/admin/AnalyticsPage.jsx';
import AttendancePage from '@/pages/admin/AttendancePage.jsx';
import AdsDashboardPage from '@/pages/admin/AdsDashboardPage.jsx';

// Student portal
import PortalLoginPage from '@/pages/portal/PortalLoginPage.jsx';
import PortalDashboardPage from '@/pages/portal/PortalDashboardPage.jsx';
import PortalProfilePage from '@/pages/portal/PortalProfilePage.jsx';
import PortalDocumentsPage from '@/pages/portal/PortalDocumentsPage.jsx';
import PortalApplicationsPage from '@/pages/portal/PortalApplicationsPage.jsx';
import PortalPaymentsPage from '@/pages/portal/PortalPaymentsPage.jsx';
import PortalMessagesPage from '@/pages/portal/PortalMessagesPage.jsx';

export default function App() {
  return (
    <Routes>
      {/* Staff CRM — admin + counsellor, no public header/footer */}
      <Route path="/admin/login" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="colleges" element={<AdminCollegesPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="counsellors" element={<ProtectedRoute roles={['admin']}><CounsellorsPage /></ProtectedRoute>} />
        <Route path="ads" element={<ProtectedRoute roles={['admin']}><AdsDashboardPage /></ProtectedRoute>} />
        <Route path="analytics" element={<ProtectedRoute roles={['admin']}><AnalyticsPage /></ProtectedRoute>} />
      </Route>

      {/* Fee Ledger module — its own top-level route group, same staff auth + AdminLayout shell as /admin/* */}
      <Route
        path="/fees/*"
        element={
          <ProtectedRoute roles={['admin', 'counsellor', 'registrar', 'partner']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="*"
          element={
            <Suspense fallback={<div className="py-16 text-center text-sm text-muted-foreground">Loading Fees...</div>}>
              <FeesRoutes />
            </Suspense>
          }
        />
      </Route>

      {/* Student self-service portal — separate auth, no public header/footer */}
      <Route path="/portal/login" element={<PortalLoginPage />} />
      <Route
        path="/portal"
        element={
          <PortalProtectedRoute>
            <PortalLayout />
          </PortalProtectedRoute>
        }
      >
        <Route index element={<PortalDashboardPage />} />
        <Route path="profile" element={<PortalProfilePage />} />
        <Route path="documents" element={<PortalDocumentsPage />} />
        <Route path="applications" element={<PortalApplicationsPage />} />
        <Route path="payments" element={<PortalPaymentsPage />} />
        <Route path="messages" element={<PortalMessagesPage />} />
      </Route>

      {/* Public marketing site */}
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/psw-canada" element={<PSWPage />} />
        <Route path="/psw-canada/courses" element={<PSWCoursesPage />} />
        <Route path="/psw-canada/benefits" element={<PSWBenefitsPage />} />
        <Route path="/psw-canada/placements" element={<PSWPlacementsPage />} />
        <Route path="/psw-canada/pr-pathway" element={<PSWPRPathwayPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/delete-my-info" element={<DeleteMyInfoPage />} />

        {/* India / study-in-Canada vertical */}
        <Route path="/study-in-canada" element={<StudyInCanadaPage />} />
        <Route path="/programs" element={<ProgramsPage />} />
        <Route path="/colleges" element={<CollegesPublicPage />} />
        <Route path="/admission-process" element={<AdmissionProcessPage />} />
        <Route path="/eligibility-checker" element={<EligibilityCheckerPage />} />
        <Route path="/cost-calculator" element={<CostCalculatorPage />} />
        <Route path="/success-stories" element={<SuccessStoriesPage />} />
        <Route path="/free-assessment" element={<FreeAssessmentPage />} />
        <Route path="/book-counselling" element={<BookCounsellingPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
