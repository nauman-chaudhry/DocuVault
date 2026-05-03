import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import LinearProgress from '@mui/material/LinearProgress';
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';
import MainCard from 'components/MainCard';
import OrdersTable from './OrdersTable';
import { useAuth } from 'contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FileAddOutlined,
  AuditOutlined
} from '@ant-design/icons';
import API_BASE_URL from 'config/api';

const activityIcons = {
  Pending: { icon: <ClockCircleOutlined />, color: 'warning' },
  Approved: { icon: <CheckCircleOutlined />, color: 'success' },
  Rejected: { icon: <CloseCircleOutlined />, color: 'error' },
  Paid: { icon: <DollarOutlined />, color: 'success' },
  'In Review by Finance Department': { icon: <AuditOutlined />, color: 'info' },
  'Processing Payment': { icon: <DollarOutlined />, color: 'info' }
};

export default function DashboardDefault() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(API_BASE_URL + '/docu')
      .then((response) => {
        setDocuments(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching document data:', error);
        setLoading(false);
      });
  }, []);

  const totalDocuments = documents.length;
  const pendingDocuments = documents.filter((doc) => doc.status === 'Pending').length;
  const approvedDocuments = documents.filter((doc) => doc.status === 'Approved').length;
  const rejectedDocuments = documents.filter((doc) => doc.status === 'Rejected').length;
  const paidDocuments = documents.filter((doc) => doc.status === 'Paid').length;
  const inReviewDocuments = documents.filter(
    (doc) => doc.status === 'In Review by Finance Department' || doc.status === 'Processing Payment'
  ).length;

  // Build activity log from all status history entries across all documents
  const activityLog = documents
    .flatMap((doc) =>
      (doc.statusHistory || []).map((entry) => ({
        documentName: doc.name,
        status: entry.status,
        timestamp: entry.timestamp || entry.date
      }))
    )
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      {/* Header */}
      <Grid item xs={12} sx={{ mb: -2.25 }}>
        <Typography variant="h5">Welcome back, {user?.name || 'User'}</Typography>
        <Typography variant="body2" color="textSecondary">
          Document approval system overview
        </Typography>
      </Grid>

      {loading && (
        <Grid item xs={12}>
          <LinearProgress />
        </Grid>
      )}

      {/* Stats Row */}
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <AnalyticEcommerce title="Total" count={String(totalDocuments)} color="primary" />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <AnalyticEcommerce title="Pending" count={String(pendingDocuments)} color="warning" />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <AnalyticEcommerce title="Approved" count={String(approvedDocuments)} color="success" />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <AnalyticEcommerce title="Rejected" count={String(rejectedDocuments)} color="error" />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <AnalyticEcommerce title="In Review" count={String(inReviewDocuments)} color="info" />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <AnalyticEcommerce title="Paid" count={String(paidDocuments)} color="success" />
      </Grid>

      <Grid item md={8} sx={{ display: { sm: 'none', md: 'block', lg: 'none' } }} />

      {/* Recent Documents Table */}
      <Grid item xs={12} lg={8}>
        <MainCard title="Recent Documents" content={false}>
          <OrdersTable />
        </MainCard>
      </Grid>

      {/* Activity Log */}
      <Grid item xs={12} lg={4}>
        <MainCard title="Activity Log">
          {activityLog.length === 0 && !loading && (
            <Typography color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
              No recent activity
            </Typography>
          )}
          <List sx={{ p: 0 }}>
            {activityLog.map((activity, index) => {
              const config = activityIcons[activity.status] || { icon: <FileAddOutlined />, color: 'primary' };
              return (
                <React.Fragment key={index}>
                  <ListItemButton sx={{ py: 1 }}>
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          color: `${config.color}.main`,
                          bgcolor: `${config.color}.lighter`,
                          width: 36,
                          height: 36,
                          fontSize: '1rem'
                        }}
                      >
                        {config.icon}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2">
                          <strong>{activity.documentName}</strong> &mdash; {activity.status}
                        </Typography>
                      }
                      secondary={
                        activity.timestamp ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }) : 'Unknown time'
                      }
                    />
                  </ListItemButton>
                  {index < activityLog.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        </MainCard>
      </Grid>
    </Grid>
  );
}
