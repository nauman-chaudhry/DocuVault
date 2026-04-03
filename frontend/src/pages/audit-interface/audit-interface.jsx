import { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import MainCard from 'components/MainCard';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { format } from 'date-fns';
import API_BASE_URL from 'config/api';

export default function AuditFinancePage() {
  const [documents, setDocuments] = useState([]);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [paymentDetails, setPaymentDetails] = useState({
    amount: '',
    paymentDate: '',
    bankName: '',
    transactionId: '',
  });
  const [selectedStatus, setSelectedStatus] = useState('');

  // Fetch all documents from backend and filter out those with 'Paid' status
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch(API_BASE_URL + '/docu');
        if (!response.ok) {
          throw new Error('Failed to fetch documents');
        }
        const data = await response.json();
        // Filter out documents with the status 'Paid'
        const filteredData = data.filter(doc => doc.status !== 'Paid');
        setDocuments(filteredData);
      } catch (err) {
        console.error('Error fetching documents:', err.message);
      }
    };

    fetchDocuments();
  }, []);

  const handleUpdateStatus = async () => {
    try {
      const updatedDocument = {
        ...currentDocument,
        statusHistory: [...currentDocument.statusHistory, { status: selectedStatus, timestamp: new Date() }],
      };
      const response = await fetch(`${API_BASE_URL}/docu/${currentDocument._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: selectedStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update document status');
      }

      const data = await response.json();
      setDocuments((prevDocuments) =>
        prevDocuments.map((doc) =>
          doc._id === data._id ? data : doc
        )
      );
      setSnackbar({ open: true, message: `Status updated to ${selectedStatus}`, severity: 'success' });
      setOpenConfirmDialog(false);
    } catch (err) {
      console.error('Error updating status:', err.message);
      setSnackbar({ open: true, message: 'Error updating status', severity: 'error' });
    }
  };

  const handleProcessPayment = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/docu/${currentDocument._id}/payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentDetails),
      });

      if (!response.ok) {
        throw new Error('Failed to process payment');
      }

      const data = await response.json();
      setDocuments((prevDocuments) =>
        prevDocuments.map((doc) =>
          doc._id === data._id ? data : doc
        )
      );
      setSnackbar({ open: true, message: 'Payment processed and BPV generated!', severity: 'success' });
      handleClosePaymentDialog();
    } catch (err) {
      console.error('Error processing payment:', err.message);
      setSnackbar({ open: true, message: 'Error processing payment', severity: 'error' });
    }
  };

  const handleOpenPaymentDialog = (document) => {
    setCurrentDocument(document);
    setOpenPaymentDialog(true);
  };

  const handleClosePaymentDialog = () => {
    setOpenPaymentDialog(false);
  };

  const handleInputChange = (e) => {
    setPaymentDetails({ ...paymentDetails, [e.target.name]: e.target.value });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenConfirmDialog = (document, status) => {
    setCurrentDocument(document);
    setSelectedStatus(status);
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };

  if (documents.length === 0) {
    return <Typography>No documents found.</Typography>;
  }

  return (
    <MainCard title="Audit/Finance Interface">
      <Grid container spacing={3}>
        {documents.map((document) => (
          <Grid item xs={12} key={document._id}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  {document.name}
                </Typography>
                <Typography variant="body1" color="textSecondary" gutterBottom>
                  {document.description}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Date: {format(new Date(document.date), 'PPpp')}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Category: {document.category}
                </Typography>
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Status History:
                </Typography>
                <Divider sx={{ my: 2 }} />
                {document.statusHistory.map((status, index) => (
                  <Typography key={index} variant="body2" color="textSecondary">
                    {format(new Date(status.timestamp), 'PPpp')}: {status.status}
                  </Typography>
                ))}
              </CardContent>
              <Divider />
              <CardContent>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Tooltip title="Update the document's status to 'In Review by Finance Department'">
                    <Button
                      variant="contained"
                      color="warning"
                      onClick={() => handleOpenConfirmDialog(document, 'In Review by Finance Department')}
                    >
                      Update Status
                    </Button>
                  </Tooltip>
                  {document.status === 'Processing Payment' && (
                    <Tooltip title="Mark the document as 'Paid'">
                      <Button variant="contained" color="success" onClick={() => handleOpenConfirmDialog(document, 'Paid')}>
                        Mark as Paid
                      </Button>
                    </Tooltip>
                  )}
                  <Tooltip title="Process the payment for this document">
                    <Button variant="contained" color="success" onClick={() => handleOpenPaymentDialog(document)}>
                      Process Payment
                    </Button>
                  </Tooltip>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Payment Processing Dialog */}
      <Dialog open={openPaymentDialog} onClose={handleClosePaymentDialog}>
        <DialogTitle>Process Payment and Generate BPV</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter the payment details to process the payment and generate the Bank Payment Voucher (BPV).
          </DialogContentText>
          <TextField
            margin="dense"
            id="amount"
            name="amount"
            label="Amount"
            type="number"
            fullWidth
            variant="outlined"
            value={paymentDetails.amount}
            onChange={handleInputChange}
            required
          />
          <TextField
            margin="dense"
            id="paymentDate"
            name="paymentDate"
            label="Payment Date"
            type="date"
            fullWidth
            variant="outlined"
            value={paymentDetails.paymentDate}
            onChange={handleInputChange}
            InputLabelProps={{
              shrink: true,
            }}
            required
          />
          <TextField
            margin="dense"
            id="bankName"
            name="bankName"
            label="Bank Name"
            fullWidth
            variant="outlined"
            value={paymentDetails.bankName}
            onChange={handleInputChange}
            required
          />
          <TextField
            margin="dense"
            id="transactionId"
            name="transactionId"
            label="Transaction ID"
            fullWidth
            variant="outlined"
            value={paymentDetails.transactionId}
            onChange={handleInputChange}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleProcessPayment} color="success">
            Process Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Confirmation Dialog */}
      <Dialog open={openConfirmDialog} onClose={handleCloseConfirmDialog}>
        <DialogTitle>Confirm Status Update</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to update the status to "{selectedStatus}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleUpdateStatus} color="warning">
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </MainCard>
  );
}
