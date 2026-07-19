import { Routes, Route } from 'react-router-dom';
import { PublicLayout } from './components/layout/PublicLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { HomePage } from './pages/public/HomePage';
import { ProductsPage } from './pages/public/ProductsPage';
import { ProductDetailPage } from './pages/public/ProductDetailPage';
import { ContactPage } from './pages/public/ContactPage';
import { AboutPage } from './pages/public/AboutPage';
import { NewsPage } from './pages/public/NewsPage';
import { NewsDetailPage } from './pages/public/NewsDetailPage';
import { CreasingMatrixPage } from './pages/public/CreasingMatrixPage';
import { BlogPage } from './pages/public/BlogPage';
import { BlogDetailPage } from './pages/public/BlogDetailPage';
import { FAQPage } from './pages/public/FAQPage';
import { CaseStudiesPage } from './pages/public/CaseStudiesPage';
import { CaseStudyDetailPage } from './pages/public/CaseStudyDetailPage';
import { InstallationsPage } from './pages/public/InstallationsPage';
import { InquiryForm } from './pages/public/InquiryForm';
import { CategoryPage } from './pages/public/CategoryPage';
import { SparePartsPage } from './pages/public/SparePartsPage';
import { DatasheetDownloadPage } from './pages/public/DatasheetDownloadPage';
import { NotFoundPage } from './pages/public/NotFoundPage';
import { AdminLogin } from './pages/admin/AdminLogin';
import { SignUp } from './pages/auth/SignUp';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { Profile } from './pages/auth/Profile';
import { AuthCallback } from './pages/auth/AuthCallback';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminLeads } from './pages/admin/AdminLeads';
import { AdminInvoices } from './pages/admin/AdminInvoices';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { AdminAI } from './pages/admin/AdminAI';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminStock } from './pages/admin/AdminStock';
import { AdminCMS } from './pages/admin/AdminCMS';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminAudit } from './pages/admin/AdminAudit';
import { AdminInstallations } from './pages/admin/AdminInstallations';
import { AdminCampaigns } from './pages/admin/AdminCampaigns';
import { AdminChatHistory } from './pages/admin/AdminChatHistory';

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/category/:slug" element={<CategoryPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/inquiry" element={<InquiryForm />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:id" element={<NewsDetailPage />} />
        <Route path="/creasing-matrix" element={<CreasingMatrixPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:id" element={<BlogDetailPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/case-studies" element={<CaseStudiesPage />} />
        <Route path="/case-studies/:id" element={<CaseStudyDetailPage />} />
        <Route path="/installations" element={<InstallationsPage />} />
        <Route path="/spare-parts" element={<SparePartsPage />} />
        <Route path="/datasheets" element={<DatasheetDownloadPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Auth routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/profile" element={<Profile />} />

      {/* Admin routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="leads" element={<AdminLeads />} />
        <Route path="invoices" element={<AdminInvoices />} />
        <Route path="stock" element={<AdminStock />} />
        <Route path="cms" element={<AdminCMS />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="audit" element={<AdminAudit />} />
        <Route path="installations" element={<AdminInstallations />} />
        <Route path="campaigns" element={<AdminCampaigns />} />
        <Route path="chat-logs" element={<AdminChatHistory />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="ai" element={<AdminAI />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
    </Routes>
  );
}
