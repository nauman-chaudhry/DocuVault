// assets
import { FileTextOutlined, FileAddOutlined, FileSearchOutlined, UserAddOutlined, BellOutlined, ClockCircleOutlined } from '@ant-design/icons';

// icons
const icons = {
  FileTextOutlined,
  FileAddOutlined,
  FileSearchOutlined,
  UserAddOutlined,
  BellOutlined,
  ClockCircleOutlined
};

// ==============================|| MENU ITEMS - UTILITIES ||============================== //

const utilities = {
  id: 'utilities',
  title: 'Document Management',
  type: 'group',
  children: [
    {
      id: 'document-upload',
      title: 'Upload Document',
      type: 'item',
      url: '/document-upload',
      icon: icons.FileAddOutlined,
      roles: ['Employee', 'HOD']
    },
    {
      id: 'document-review',
      title: 'Document Review',
      type: 'item',
      url: '/document-review',
      icon: icons.FileTextOutlined,
      roles: ['HOD']
    },
    {
      id: 'document-tracking',
      title: 'Document Tracking',
      type: 'item',
      url: '/document-tracking',
      icon: icons.ClockCircleOutlined
    },
    {
      id: 'audit-finance-interface',
      title: 'Audit & Finance',
      type: 'item',
      url: '/audit-finance-interface',
      icon: icons.FileSearchOutlined,
      roles: ['Audit Department']
    },
    {
      id: 'all-notifications',
      title: 'Notifications',
      type: 'item',
      url: '/all-notifications',
      icon: icons.BellOutlined
    },
    {
      id: 'add-user',
      title: 'Manage Users',
      type: 'item',
      url: '/add-user',
      icon: icons.UserAddOutlined,
      roles: ['HOD']
    }
  ]
};

export default utilities;
