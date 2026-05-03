import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  TextField,
  IconButton,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Paper,
  LinearProgress,
  Chip,
  Stack
} from '@mui/material';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  AuditOutlined,
  FileAddOutlined,
  SearchOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { formatDistanceToNow, format } from 'date-fns';
import MainCard from 'components/MainCard';
import API_BASE_URL from 'config/api';

const statusConfig = {
  Pending: { icon: <ClockCircleOutlined />, color: 'warning', label: 'Submitted' },
  Approved: { icon: <CheckCircleOutlined />, color: 'success', label: 'Approved' },
  Rejected: { icon: <CloseCircleOutlined />, color: 'error', label: 'Rejected' },
  Paid: { icon: <DollarOutlined />, color: 'success', label: 'Payment' },
  'In Review by Finance Department': { icon: <AuditOutlined />, color: 'info', label: 'Review' },
  'Processing Payment': { icon: <DollarOutlined />, color: 'info', label: 'Payment' }
};

function getNotificationMessage(docName, status) {
  switch (status) {
    case 'Pending':
      return `Document "${docName}" has been submitted for approval.`;
    case 'Approved':
      return `Document "${docName}" has been approved.`;
    case 'Rejected':
      return `Document "${docName}" has been rejected.`;
    case 'Paid':
      return `Payment processed for document "${docName}".`;
    case 'In Review by Finance Department':
      return `Document "${docName}" is under review by the Finance Department.`;
    case 'Processing Payment':
      return `Payment is being processed for document "${docName}".`;
    default:
      return `Document "${docName}" status updated to "${status}".`;
  }
}

export default function AllNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios
      .get(API_BASE_URL + '/docu')
      .then((response) => {
        const docs = response.data;
        const allNotifications = docs
          .flatMap((doc) =>
            (doc.statusHistory || []).map((entry) => ({
              id: `${doc._id}-${entry.timestamp || entry.date}`,
              documentName: doc.name,
              status: entry.status,
              timestamp: entry.timestamp || entry.date,
              message: getNotificationMessage(doc.name, entry.status),
              type: statusConfig[entry.status]?.label || 'Update'
            }))
          )
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        setNotifications(allNotifications);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching notifications:', error);
        setLoading(false);
      });
  }, []);

  const filteredNotifications = notifications.filter((n) => {
    return (filter === '' || n.type === filter) && (search === '' || n.message.toLowerCase().includes(search.toLowerCase()));
  });

  const uniqueTypes = [...new Set(notifications.map((n) => n.type))];

  return (
    <MainCard title="All Notifications">
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          variant="outlined"
          placeholder="Search notifications..."
          fullWidth
          size="small"
          InputProps={{
            startAdornment: (
              <IconButton size="small">
                <SearchOutlined />
              </IconButton>
            )
          }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel id="filter-label">Filter By</InputLabel>
          <Select labelId="filter-label" value={filter} label="Filter By" onChange={(e) => setFilter(e.target.value)}>
            <MenuItem value="">
              <em>All</em>
            </MenuItem>
            {uniqueTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Paper elevation={0} variant="outlined">
        <List sx={{ p: 0 }}>
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification, index) => {
              const config = statusConfig[notification.status] || { icon: <FileAddOutlined />, color: 'primary' };
              return (
                <Box key={notification.id || index}>
                  <ListItemButton sx={{ py: 1.5 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: `${config.color}.lighter`, color: `${config.color}.main` }}>{config.icon}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography variant="body1">{notification.message}</Typography>}
                      secondary={
                        notification.timestamp
                          ? `${formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })} \u2014 ${format(new Date(notification.timestamp), 'PPp')}`
                          : 'Unknown time'
                      }
                    />
                    <Chip label={notification.type} size="small" color={config.color} variant="outlined" sx={{ ml: 1 }} />
                  </ListItemButton>
                  {index < filteredNotifications.length - 1 && <Divider />}
                </Box>
              );
            })
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="textSecondary">
                {loading ? 'Loading notifications...' : 'No notifications found'}
              </Typography>
            </Box>
          )}
        </List>
      </Paper>
    </MainCard>
  );
}
