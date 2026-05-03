import { useRef, useState, useEffect } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project import
import MainCard from 'components/MainCard';
import Transitions from 'components/@extended/Transitions';

// assets
import BellOutlined from '@ant-design/icons/BellOutlined';
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';
import CloseCircleOutlined from '@ant-design/icons/CloseCircleOutlined';
import ClockCircleOutlined from '@ant-design/icons/ClockCircleOutlined';
import DollarOutlined from '@ant-design/icons/DollarOutlined';
import AuditOutlined from '@ant-design/icons/AuditOutlined';
import FileAddOutlined from '@ant-design/icons/FileAddOutlined';

import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import API_BASE_URL from 'config/api';

// sx styles
const avatarSX = { width: 36, height: 36, fontSize: '1rem' };
const actionSX = { mt: '6px', ml: 1, top: 'auto', right: 'auto', alignSelf: 'flex-start', transform: 'none' };

const statusConfig = {
  Pending: { icon: <ClockCircleOutlined />, color: 'warning' },
  Approved: { icon: <CheckCircleOutlined />, color: 'success' },
  Rejected: { icon: <CloseCircleOutlined />, color: 'error' },
  Paid: { icon: <DollarOutlined />, color: 'success' },
  'In Review by Finance Department': { icon: <AuditOutlined />, color: 'info' },
  'Processing Payment': { icon: <DollarOutlined />, color: 'info' }
};

export default function Notification() {
  const theme = useTheme();
  const matchesXs = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const anchorRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [read, setRead] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    axios
      .get(API_BASE_URL + '/docu')
      .then((response) => {
        const docs = response.data;
        const allNotifs = docs
          .flatMap((doc) =>
            (doc.statusHistory || []).map((entry) => ({
              id: `${doc._id}-${entry.timestamp || entry.date}`,
              documentName: doc.name,
              status: entry.status,
              timestamp: entry.timestamp || entry.date
            }))
          )
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 5);
        setNotifications(allNotifs);
        setRead(Math.min(allNotifs.length, 3));
      })
      .catch((err) => console.error('Error fetching notifications:', err));
  }, []);

  const handleToggle = () => setOpen((prevOpen) => !prevOpen);

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) return;
    setOpen(false);
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 0.75 }}>
      <IconButton
        color="secondary"
        variant="light"
        sx={{ color: 'text.primary', bgcolor: open ? 'grey.100' : 'transparent' }}
        aria-label="open notifications"
        ref={anchorRef}
        aria-controls={open ? 'notification-grow' : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
      >
        <Badge badgeContent={read} color="primary">
          <BellOutlined />
        </Badge>
      </IconButton>
      <Popper
        placement={matchesXs ? 'bottom' : 'bottom-end'}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        popperOptions={{ modifiers: [{ name: 'offset', options: { offset: [matchesXs ? -5 : 0, 9] } }] }}
      >
        {({ TransitionProps }) => (
          <Transitions type="grow" position={matchesXs ? 'top' : 'top-right'} in={open} {...TransitionProps}>
            <Paper sx={{ boxShadow: theme.customShadows.z1, width: '100%', minWidth: 285, maxWidth: { xs: 285, md: 420 } }}>
              <ClickAwayListener onClickAway={handleClose}>
                <MainCard
                  title="Notifications"
                  elevation={0}
                  border={false}
                  content={false}
                  secondary={
                    read > 0 && (
                      <Tooltip title="Mark all as read">
                        <IconButton color="success" size="small" onClick={() => setRead(0)}>
                          <CheckCircleOutlined style={{ fontSize: '1.15rem' }} />
                        </IconButton>
                      </Tooltip>
                    )
                  }
                >
                  <List
                    component="nav"
                    sx={{
                      p: 0,
                      '& .MuiListItemButton-root': {
                        py: 0.5,
                        '&.Mui-selected': { bgcolor: 'grey.50', color: 'text.primary' },
                        '& .MuiAvatar-root': avatarSX,
                        '& .MuiListItemSecondaryAction-root': { ...actionSX, position: 'relative' }
                      }
                    }}
                  >
                    {notifications.length === 0 && (
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="textSecondary">
                          No notifications
                        </Typography>
                      </Box>
                    )}
                    {notifications.map((notif, index) => {
                      const config = statusConfig[notif.status] || { icon: <FileAddOutlined />, color: 'primary' };
                      return (
                        <Box key={notif.id}>
                          <ListItemButton selected={index < read}>
                            <ListItemAvatar>
                              <Avatar sx={{ color: `${config.color}.main`, bgcolor: `${config.color}.lighter` }}>{config.icon}</Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="h6">
                                  <Typography component="span" variant="subtitle1">
                                    {notif.documentName}
                                  </Typography>{' '}
                                  &mdash; {notif.status}
                                </Typography>
                              }
                              secondary={
                                notif.timestamp ? formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true }) : ''
                              }
                            />
                          </ListItemButton>
                          <Divider />
                        </Box>
                      );
                    })}
                    <ListItemButton
                      sx={{ textAlign: 'center', py: `${12}px !important` }}
                      onClick={() => {
                        navigate('/all-notifications');
                        setOpen(false);
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="h6" color="primary">
                            View All
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  </List>
                </MainCard>
              </ClickAwayListener>
            </Paper>
          </Transitions>
        )}
      </Popper>
    </Box>
  );
}
