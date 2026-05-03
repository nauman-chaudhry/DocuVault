import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  Divider,
  Collapse,
  IconButton,
  LinearProgress,
  Alert
} from '@mui/material';
import MainCard from 'components/MainCard';
import Dot from 'components/@extended/Dot';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { DownOutlined, UpOutlined, WarningOutlined, ClockCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import API_BASE_URL from 'config/api';

const statusColors = {
  Pending: 'warning',
  Approved: 'success',
  Rejected: 'error',
  'In Review by Finance Department': 'info',
  'Processing Payment': 'info',
  Paid: 'success'
};

function DocumentRow({ document }) {
  const [expanded, setExpanded] = useState(false);
  const daysSinceSubmission = differenceInDays(new Date(), new Date(document.date));
  const isPastDeadline = document.deadline && new Date(document.deadline) < new Date() && document.status !== 'Paid' && document.status !== 'Approved';
  const isOverdue = document.status === 'Pending' && daysSinceSubmission > 7;
  const showWarning = isPastDeadline || isOverdue;

  return (
    <Card
      sx={{
        mb: 2,
        borderColor: showWarning ? 'error.main' : 'divider'
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
              <Typography variant="h6">{document.name}</Typography>
              {showWarning && (
                <Chip
                  icon={<WarningOutlined />}
                  label={isPastDeadline ? 'Deadline Passed' : `Overdue - pending ${daysSinceSubmission} days`}
                  color="error"
                  size="small"
                  variant="outlined"
                />
              )}
            </Stack>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
              {document.description}
            </Typography>
            <Stack direction="row" spacing={3} sx={{ mt: 1 }} flexWrap="wrap">
              <Typography variant="caption" color="textSecondary">
                Category: {document.category}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Submitted: {format(new Date(document.date), 'PPP')}
              </Typography>
              {document.submittedBy && (
                <Typography variant="caption" color="textSecondary">
                  By: {document.submittedBy}
                </Typography>
              )}
              {document.deadline && (
                <Typography variant="caption" color={isPastDeadline ? 'error' : 'textSecondary'}>
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  Deadline: {format(new Date(document.deadline), 'PPP')}
                </Typography>
              )}
            </Stack>
          </Box>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Chip label={document.status} color={statusColors[document.status] || 'default'} size="small" />
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <UpOutlined /> : <DownOutlined />}
            </IconButton>
          </Stack>
        </Stack>

        <Collapse in={expanded}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Approval Timeline
          </Typography>
          <Box sx={{ pl: 2 }}>
            {document.statusHistory &&
              document.statusHistory.map((entry, index) => (
                <Stack key={index} direction="row" spacing={2} sx={{ mb: 1.5, position: 'relative' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 20 }}>
                    <Dot color={statusColors[entry.status] || 'primary'} size={12} />
                    {index < document.statusHistory.length - 1 && <Box sx={{ width: 2, flex: 1, bgcolor: 'divider', mt: 0.5 }} />}
                  </Box>
                  <Box sx={{ pb: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {entry.status}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {entry.timestamp
                        ? `${format(new Date(entry.timestamp), 'PPp')} (${formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })})`
                        : 'No timestamp available'}
                    </Typography>
                    {entry.comment && (
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', fontStyle: 'italic', mt: 0.25 }}>
                        &quot;{entry.comment}&quot;
                      </Typography>
                    )}
                  </Box>
                </Stack>
              ))}
          </Box>

          {document.paymentDetails && document.paymentDetails.amount && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Payment Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="textSecondary">
                    Amount
                  </Typography>
                  <Typography variant="body2">Rs. {document.paymentDetails.amount}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="textSecondary">
                    Bank
                  </Typography>
                  <Typography variant="body2">{document.paymentDetails.bankName || '-'}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="textSecondary">
                    Transaction ID
                  </Typography>
                  <Typography variant="body2">{document.paymentDetails.transactionId || '-'}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="textSecondary">
                    Payment Date
                  </Typography>
                  <Typography variant="body2">
                    {document.paymentDetails.paymentDate ? format(new Date(document.paymentDetails.paymentDate), 'PPP') : '-'}
                  </Typography>
                </Grid>
              </Grid>
            </>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
}

export default function DocumentTrackingPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios
      .get(API_BASE_URL + '/docu')
      .then((response) => {
        setDocuments(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching documents:', error);
        setLoading(false);
      });
  }, []);

  const filteredDocuments = documents.filter((doc) => {
    const matchesStatus = !statusFilter || doc.status === statusFilter;
    const matchesSearch =
      !search || doc.name.toLowerCase().includes(search.toLowerCase()) || doc.description.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const overdueCount = documents.filter(
    (doc) =>
      (doc.status === 'Pending' && differenceInDays(new Date(), new Date(doc.date)) > 7) ||
      (doc.deadline && new Date(doc.deadline) < new Date() && doc.status !== 'Paid' && doc.status !== 'Approved')
  ).length;

  return (
    <MainCard title="Document Tracking & Timeline">
      {overdueCount > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {overdueCount} document(s) have been pending for more than 7 days and require attention.
        </Alert>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ minWidth: 250 }}
        />
        <TextField
          select
          label="Filter by Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          size="small"
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="Pending">Pending</MenuItem>
          <MenuItem value="Approved">Approved</MenuItem>
          <MenuItem value="Rejected">Rejected</MenuItem>
          <MenuItem value="In Review by Finance Department">In Review</MenuItem>
          <MenuItem value="Processing Payment">Processing Payment</MenuItem>
          <MenuItem value="Paid">Paid</MenuItem>
        </TextField>
      </Stack>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {!loading && filteredDocuments.length === 0 && (
        <Typography color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
          No documents found matching your criteria.
        </Typography>
      )}

      {filteredDocuments.map((doc) => (
        <DocumentRow key={doc._id} document={doc} />
      ))}
    </MainCard>
  );
}
