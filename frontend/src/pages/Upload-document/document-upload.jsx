import { useState } from 'react';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import MainCard from 'components/MainCard';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import API_BASE_URL from 'config/api';
import { useAuth, fetchWithAuth } from 'contexts/AuthContext';

// ==============================|| DOCUMENT UPLOAD PAGE ||============================== //

export default function DocumentUploadPage() {
  const { user } = useAuth();
  const [documentDetails, setDocumentDetails] = useState({
    name: '',
    description: '',
    date: '',
    deadline: '',
    extraNotes: '',
    category: '',
    attachment: null,
  });

  const [successMessage, setSuccessMessage] = useState(false); // State for success Snackbar
  const [errorMessage, setErrorMessage] = useState(''); // State for error message

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDocumentDetails((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setDocumentDetails((prevState) => ({
      ...prevState,
      attachment: e.target.files[0],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Validate that an attachment is provided
    if (!documentDetails.attachment) {
      setErrorMessage('Attachment is required.');
      return;
    }

    console.log('Document Details:', documentDetails);
  
    const formData = new FormData();
    formData.append('name', documentDetails.name);
    formData.append('description', documentDetails.description);
    formData.append('date', documentDetails.date);
    formData.append('category', documentDetails.category);
    formData.append('extraNotes', documentDetails.extraNotes);
    formData.append('submittedBy', user?.name || 'Unknown');
    if (documentDetails.deadline) {
      formData.append('deadline', documentDetails.deadline);
    }

    if (documentDetails.attachment) {
      formData.append('attachment', documentDetails.attachment);
    }
  
    try {
      const response = await fetchWithAuth(API_BASE_URL + '/docu', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        const errorText = await response.text(); // Read the response body
        throw new Error(`Network response was not ok: ${errorText}`);
      }
  
      const result = await response.json();
      console.log('Upload Result:', result);
      
      setSuccessMessage(true); // Show success Snackbar
      setDocumentDetails({
        name: '',
        description: '',
        date: '',
        deadline: '',
        extraNotes: '',
        category: '',
        attachment: null,
      });

    } catch (err) {
      setErrorMessage(`Error uploading document: ${err.message}`); // Set error message
      console.error('Error uploading document:', err.message);
    }
  };

  // Handle closing the Snackbar
  const handleClose = () => {
    setSuccessMessage(false);
  };
  
  return (
    <MainCard title="Upload Document">
      {errorMessage && <MuiAlert severity="error">{errorMessage}</MuiAlert>}
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Name Field */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Document Name"
              name="name"
              value={documentDetails.name}
              onChange={handleChange}
              required
            />
          </Grid>

          {/* Description Field */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={documentDetails.description}
              onChange={handleChange}
              multiline
              rows={4}
              required
            />
          </Grid>

          {/* Date Field */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Date"
              name="date"
              type="date"
              value={documentDetails.date}
              onChange={handleChange}
              InputLabelProps={{
                shrink: true,
              }}
              required
            />
          </Grid>

          {/* Deadline Field */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Approval Deadline"
              name="deadline"
              type="date"
              value={documentDetails.deadline}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Category Field */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              select
              label="Category"
              name="category"
              value={documentDetails.category}
              onChange={handleChange}
              required
            >
              <MenuItem value="Quote">Quote</MenuItem>
              <MenuItem value="CS">CS</MenuItem>
              <MenuItem value="Invoice">Invoice</MenuItem>
            </TextField>
          </Grid>

          {/* File Attachment Field */}
          <Grid item xs={12}>
            <Button
              variant="outlined"
              component="label"
              color={documentDetails.attachment ? 'primary' : 'error'} // Show button in red if no file is attached
            >
              Attach File *
              <input
                type="file"
                hidden
                onChange={handleFileChange}
              />
            </Button>
            {documentDetails.attachment && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Attached: {documentDetails.attachment.name}
              </Typography>
            )}
          </Grid>

          {/* Extra Notes Field */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Extra Notes"
              name="extraNotes"
              value={documentDetails.extraNotes}
              onChange={handleChange}
              multiline
              rows={4}
            />
          </Grid>

          {/* Submit Button */}
          <Grid item xs={12}>
            <Stack direction="row" justifyContent="flex-end" spacing={2}>
              <Button variant="contained" color="primary" type="submit">
                Upload
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </form>

      {/* Success Snackbar */}
      <Snackbar
        open={successMessage}
        autoHideDuration={6000}
        onClose={handleClose}
      >
        <MuiAlert onClose={handleClose} severity="success" sx={{ width: '100%' }}>
          Document uploaded successfully!
        </MuiAlert>
      </Snackbar>
    </MainCard>
  );
}
