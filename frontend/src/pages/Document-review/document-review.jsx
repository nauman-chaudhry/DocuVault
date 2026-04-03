import { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import { format } from 'date-fns';
import API_BASE_URL from 'config/api';

export default function DocumentReviewPage() {
  const theme = useTheme();
  const [documents, setDocuments] = useState([]);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [status, setStatus] = useState('');
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [comment, setComment] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch(API_BASE_URL + '/docu/status/pending');
        if (!response.ok) throw new Error('Failed to fetch documents');
        const data = await response.json();
        setDocuments(data);
      } catch (err) {
        console.error('Error fetching documents:', err.message);
      }
    };
    fetchDocuments();
  }, []);

  const handleApprove = async () => {
    try {
      await updateDocumentStatus('Approved');
      setSnackbarMessage('Document approved successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setComment('');
      setDocuments((prev) => prev.filter((doc) => doc._id !== currentDocument._id));
      setCurrentDocument(null);
    } catch (err) {
      console.error('Error approving document:', err.message);
      setSnackbarMessage('Failed to approve document');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    try {
      await updateDocumentStatus('Rejected', rejectReason);
      setSnackbarMessage('Document rejected.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setOpenRejectDialog(false);
      setRejectReason('');
      setComment('');
      setDocuments((prev) => prev.filter((doc) => doc._id !== currentDocument._id));
      setCurrentDocument(null);
    } catch (err) {
      console.error('Error rejecting document:', err.message);
      setSnackbarMessage('Failed to reject document');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const updateDocumentStatus = async (newStatus, reason = '') => {
    const response = await fetch(`${API_BASE_URL}/docu/${currentDocument._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, reason })
    });
    if (!response.ok) throw new Error('Failed to update document status');
    return await response.json();
  };

  const handleDocumentSelect = (document) => {
    setCurrentDocument(document);
    setStatus(document.status);
    setComment('');
  };

  return (
    <Grid container spacing={3}>
      {/* Document List Panel */}
      <Grid item xs={12} md={4}>
        <MainCard title="Pending Documents">
          {documents.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="textSecondary">No pending documents to review</Typography>
            </Box>
          ) : (
            <Stack spacing={1.5}>
              {documents.map((doc) => (
                <Card
                  key={doc._id}
                  variant={currentDocument?._id === doc._id ? 'elevation' : 'outlined'}
                  sx={{
                    border: currentDocument?._id === doc._id ? `2px solid ${theme.palette.primary.main}` : undefined,
                    bgcolor: currentDocument?._id === doc._id ? 'primary.lighter' : 'transparent'
                  }}
                >
                  <CardActionArea onClick={() => handleDocumentSelect(doc)} sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {doc.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {doc.category} &mdash; {doc.date ? format(new Date(doc.date), 'PP') : 'No date'}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip label={doc.status} color="warning" size="small" />
                    </Box>
                  </CardActionArea>
                </Card>
              ))}
            </Stack>
          )}
        </MainCard>
      </Grid>

      {/* Document Detail Panel */}
      <Grid item xs={12} md={8}>
        <MainCard title="Document Review">
          {!currentDocument ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography color="textSecondary" variant="h6">
                Select a document from the list to review
              </Typography>
            </Box>
          ) : (
            <Stack spacing={3}>
              <Box>
                <Typography variant="h4" gutterBottom>
                  {currentDocument.name}
                </Typography>
                <Chip
                  label={status}
                  color={status === 'Approved' ? 'success' : status === 'Rejected' ? 'error' : 'warning'}
                  sx={{ mb: 2 }}
                />
              </Box>

              <Divider />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary">
                    Description
                  </Typography>
                  <Typography variant="body1">{currentDocument.description}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="textSecondary">
                    Category
                  </Typography>
                  <Typography variant="body1">{currentDocument.category}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="textSecondary">
                    Submission Date
                  </Typography>
                  <Typography variant="body1">{currentDocument.date ? format(new Date(currentDocument.date), 'PPP') : '-'}</Typography>
                </Grid>
              </Grid>

              {currentDocument.extranotes && (
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Extra Notes
                  </Typography>
                  <Typography variant="body1">{currentDocument.extranotes}</Typography>
                </Box>
              )}

              {currentDocument.attachment && (
                <Button
                  variant="outlined"
                  href={`${API_BASE_URL}/${currentDocument.attachment}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ alignSelf: 'flex-start' }}
                >
                  View Attachment
                </Button>
              )}

              <Divider />

              {/* Review Comments */}
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Review Comments / Feedback
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Add your review comments or feedback here..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  variant="outlined"
                />
              </Box>

              {/* Action Buttons */}
              <Stack direction="row" spacing={2}>
                <Button variant="contained" color="success" onClick={handleApprove} disabled={status !== 'Pending'} size="large">
                  Approve
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => setOpenRejectDialog(true)}
                  disabled={status !== 'Pending'}
                  size="large"
                >
                  Reject
                </Button>
              </Stack>
            </Stack>
          )}
        </MainCard>
      </Grid>

      {/* Snackbar */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Reject Dialog */}
      <Dialog open={openRejectDialog} onClose={() => setOpenRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Document</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>Please provide a reason for rejecting &quot;{currentDocument?.name}&quot;.</DialogContentText>
          <TextField
            autoFocus
            label="Rejection Reason"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRejectDialog(false)}>Cancel</Button>
          <Button onClick={handleReject} color="error" variant="contained" disabled={!rejectReason.trim()}>
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
