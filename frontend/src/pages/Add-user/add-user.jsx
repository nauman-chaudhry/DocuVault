import { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Popover from '@mui/material/Popover';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import MainCard from 'components/MainCard';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import axios from 'axios';
import API_BASE_URL from 'config/api';

export default function SuperAdminPage() {
    const [users, setUsers] = useState([]);
    const [anchorElAdd, setAnchorElAdd] = useState(null);
    const [anchorElDelete, setAnchorElDelete] = useState(null);
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Employee', password: '' });
    const [userToDelete, setUserToDelete] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        // Fetch users from the backend
        axios.get(API_BASE_URL + '/users')
            .then(response => setUsers(response.data))
            .catch(error => console.error('Error fetching users:', error));
    }, []);

    const handleAddUser = () => {
        if (!validateEmail(newUser.email)) {
            setSnackbar({ open: true, message: 'Invalid email format!', severity: 'error' });
            return;
        }

        axios.post(API_BASE_URL + '/users', newUser)
            .then(response => {
                setUsers([...users, response.data]);
                setNewUser({ name: '', email: '', role: 'Employee', password: '' });
                setAnchorElAdd(null);
                setSnackbar({ open: true, message: 'User added successfully!', severity: 'success' });
            })
            .catch(error => {
                setSnackbar({ open: true, message: 'Error adding user!', severity: 'error' });
                console.error('Error adding user:', error);
            });
    };

    const handleDeleteUser = () => {
        axios.delete(`${API_BASE_URL}/users/${userToDelete}`)
            .then(response => {
                setUsers(users.filter(user => user._id !== userToDelete));
                setAnchorElDelete(null);
                setSnackbar({ open: true, message: 'User deleted successfully!', severity: 'success' });
            })
            .catch(error => {
                setSnackbar({ open: true, message: 'Error deleting user!', severity: 'error' });
                console.error('Error deleting user:', error);
            });
    };

    const handleAddClick = (event) => {
        setAnchorElAdd(event.currentTarget);
    };

    const handleDeleteClick = (event, userId) => {
        setUserToDelete(userId);
        setAnchorElDelete(event.currentTarget);
    };

    const handleCloseAdd = () => {
        setAnchorElAdd(null);
    };

    const handleCloseDelete = () => {
        setAnchorElDelete(null);
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const openAdd = Boolean(anchorElAdd);
    const openDelete = Boolean(anchorElDelete);

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    return (
        <MainCard title="Super Admin Dashboard">
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                        User Management
                    </Typography>
                    <Button variant="contained" color="primary" onClick={handleAddClick}>
                        Add User
                    </Button>
                </Grid>

                <Grid item xs={12}>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Role</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user._id}>
                                        <TableCell>{user._id}</TableCell>
                                        <TableCell>{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.role}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="contained"
                                                color="error"
                                                onClick={(event) => handleDeleteClick(event, user._id)}
                                            >
                                                Delete
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Grid>

            {/* Add User Popover */}
            <Popover
                open={openAdd}
                anchorEl={anchorElAdd}
                onClose={handleCloseAdd}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
            >
                <Grid container spacing={2} style={{ padding: 20 }}>
                    <Grid item xs={12}>
                        <Typography variant="h6">Add New User</Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Name"
                            value={newUser.name}
                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                            required
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            required
                            error={!!newUser.email && !validateEmail(newUser.email)}
                            helperText={!!newUser.email && !validateEmail(newUser.email) ? 'Invalid email format' : ''}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Password"
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            required
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Select
                            fullWidth
                            value={newUser.role}
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                            required
                        >
                            <MenuItem value="Employee">Employee</MenuItem>
                            <MenuItem value="HOD">HOD</MenuItem>
                            <MenuItem value="Audit Department">Audit Department</MenuItem>
                        </Select>
                    </Grid>
                    <Grid item xs={12}>
                        <Stack direction="row" spacing={2}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleAddUser}
                                disabled={!newUser.name || !newUser.email || !validateEmail(newUser.email) || !newUser.password}
                            >
                                Add
                            </Button>
                            <Button variant="outlined" onClick={handleCloseAdd}>
                                Cancel
                            </Button>
                        </Stack>
                    </Grid>
                </Grid>
            </Popover>

            {/* Delete User Popover */}
            <Popover
                open={openDelete}
                anchorEl={anchorElDelete}
                onClose={handleCloseDelete}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
            >
                <Grid container spacing={2} style={{ padding: 20 }}>
                    <Grid item xs={12}>
                        <Typography variant="h6">Delete User</Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography>
                            Are you sure you want to delete this user? This action cannot be undone.
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Stack direction="row" spacing={2}>
                            <Button variant="contained" color="error" onClick={handleDeleteUser}>
                                Delete
                            </Button>
                            <Button variant="outlined" onClick={handleCloseDelete}>
                                Cancel
                            </Button>
                        </Stack>
                    </Grid>
                </Grid>
            </Popover>

            {/* Snackbar for Notifications */}
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
