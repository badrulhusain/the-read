import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layouts/AppLayout';
import { PrivateRoute } from '@/components/routes/PrivateRoute';
import { PublicOnlyRoute } from '@/components/routes/PublicOnlyRoute';
import { RoleRoute } from '@/components/routes/RoleRoute';
import { AuthProvider } from '@/store/authStore';

const HomePage = lazy(() => import('@/pages/public/HomePage'));
const BlogsPage = lazy(() => import('@/pages/public/BlogsPage'));
const BlogDetailPage = lazy(() => import('@/pages/public/BlogDetailPage'));
const LoginPage = lazy(() => import('@/pages/public/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/public/RegisterPage'));
const ContributorPage = lazy(() => import('@/pages/public/ContributorPage'));
const SeriesPage = lazy(() => import('@/pages/public/SeriesPage'));
const ReaderLibraryPage = lazy(() => import('@/pages/user/ReaderLibraryPage'));
const ProfilePage = lazy(() => import('@/pages/user/ProfilePage'));
const EditorLayout = lazy(() => import('@/pages/editor/EditorLayout'));
const EditorDashboardPage = lazy(() => import('@/pages/editor/EditorDashboardPage'));
const SubmittedBlogsPage = lazy(() => import('@/pages/editor/SubmittedBlogsPage'));
const ReviewBlogPage = lazy(() => import('@/pages/editor/ReviewBlogPage'));
const EditorEditBlogPage = lazy(() => import('@/pages/editor/EditorEditBlogPage'));
const NewArticlePage = lazy(() => import('@/pages/editor/NewArticlePage'));
const EditArticlePage = lazy(() => import('@/pages/editor/EditArticlePage'));
const ArticleReviewPage = lazy(() => import('@/pages/editor/ArticleReviewPage'));
const MyWorkPage = lazy(() => import('@/pages/editor/MyWorkPage'));
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'));
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const ManageUsersPage = lazy(() => import('@/pages/admin/ManageUsersPage'));
const CreateStaffPage = lazy(() => import('@/pages/admin/CreateStaffPage'));
const ManageBlogsPage = lazy(() => import('@/pages/admin/ManageBlogsPage'));
const CategoriesPage = lazy(() => import('@/pages/admin/CategoriesPage'));
const TagsPage = lazy(() => import('@/pages/admin/TagsPage'));
const CommentsPage = lazy(() => import('@/pages/admin/CommentsPage'));
const PublicationQueuePage = lazy(() => import('@/pages/admin/PublicationQueuePage'));
const ArticleApprovalPage = lazy(() => import('@/pages/admin/ArticleApprovalPage'));

function Root() {
  return (
    <AuthProvider>
      <Suspense fallback={<div className="grid min-h-screen place-items-center text-slate-500">Loading The Read...</div>}>
        <AppLayout />
      </Suspense>
    </AuthProvider>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'blogs', element: <BlogsPage /> },
      { path: 'blogs/:slug', element: <BlogDetailPage /> },
      {
        element: <PublicOnlyRoute />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
        ],
      },
      { path: 'submit', element: <Navigate to="/blogs" replace /> },
      { path: 'contributors/:slug', element: <ContributorPage /> },
      { path: 'series/:slug', element: <SeriesPage /> },
      {
        element: <PrivateRoute />,
        children: [
          { path: 'profile', element: <ProfilePage /> },
          { path: 'saved', element: <ReaderLibraryPage mode="saved" /> },
          { path: 'history', element: <ReaderLibraryPage mode="history" /> },
        ],
      },
      {
        element: <RoleRoute roles={['EDITOR', 'ADMIN']} />,
        children: [
          {
            element: <EditorLayout />,
            children: [
              { path: 'editor', element: <EditorDashboardPage /> },
              { path: 'editor/submissions', element: <SubmittedBlogsPage /> },
              { path: 'editor/blogs/:id/review', element: <ReviewBlogPage /> },
              { path: 'editor/blogs/:id/edit', element: <EditorEditBlogPage /> },
              { path: 'editor/articles/new', element: <NewArticlePage /> },
              { path: 'write', element: <Navigate to="/editor/articles/new" replace /> },
              { path: 'editor/articles/:id/edit', element: <EditArticlePage /> },
              { path: 'editor/articles/:id/review', element: <ArticleReviewPage /> },
              { path: 'editor/my-work', element: <MyWorkPage /> },
            ],
          },
        ],
      },
      {
        element: <RoleRoute roles={['ADMIN']} />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: 'admin', element: <AdminDashboardPage /> },
              { path: 'admin/users', element: <ManageUsersPage /> },
              { path: 'admin/blogs', element: <ManageBlogsPage /> },
              { path: 'admin/publication-queue', element: <PublicationQueuePage /> },
              { path: 'admin/articles/:id/approval', element: <ArticleApprovalPage /> },
              { path: 'admin/categories', element: <CategoriesPage /> },
              { path: 'admin/tags', element: <TagsPage /> },
              { path: 'admin/comments', element: <CommentsPage /> },
              { path: 'admin/editors/create', element: <CreateStaffPage /> },
              { path: 'admin/admins/create', element: <CreateStaffPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
