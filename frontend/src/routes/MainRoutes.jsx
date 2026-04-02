import { lazy } from 'react';

// project import
import Loadable from 'components/Loadable';
import Dashboard from 'layout/Dashboard';
import DocumentUploadPage from '../pages/Upload-document/document-upload';
import DocumentReviewPage from '../pages/Document-review/document-review';
import AuditInterface from '../pages/audit-interface/audit-interface';
import AllNotifications from '../pages/All-notifications/all-notifications';
import Adduser from '../pages/Add-user/add-user';
import DocumentTrackingPage from '../pages/document-tracking/document-tracking';

const Color = Loadable(lazy(() => import('pages/component-overview/color')));
const Typography = Loadable(lazy(() => import('pages/component-overview/typography')));
const Shadow = Loadable(lazy(() => import('pages/component-overview/shadows')));
const DashboardDefault = Loadable(lazy(() => import('pages/dashboard/index')));

// render - sample page
const SamplePage = Loadable(lazy(() => import('pages/extra-pages/sample-page')));

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: <Dashboard />,
  children: [
    { path: '/', element: <DashboardDefault /> },
    { path: 'color', element: <Color /> },
    { path: 'dashboard', children: [{ path: 'default', element: <DashboardDefault /> }] },
    { path: 'sample-page', element: <SamplePage /> },
    { path: 'shadow', element: <Shadow /> },
    { path: 'typography', element: <Typography /> },
    { path: 'document-upload', element: <DocumentUploadPage /> },
    { path: 'document-review', element: <DocumentReviewPage /> },
    { path: 'document-tracking', element: <DocumentTrackingPage /> },
    { path: 'audit-finance-interface', element: <AuditInterface /> },
    { path: 'all-notifications', element: <AllNotifications /> },
    { path: 'add-user', element: <Adduser /> }
  ]
};

export default MainRoutes;
