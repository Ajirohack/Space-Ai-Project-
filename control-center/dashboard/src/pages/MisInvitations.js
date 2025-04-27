import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Send as SendIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { getInvitations, resendInvitation, createInvitation } from '../services/misService';
import { useAuth } from '../contexts/AuthContext';
import { Link as RouterLink } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

/**
 * MIS Invitations page component
 * Allows creating and managing invitation codes
 */
const MisInvitations = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [newInvitation, setNewInvitation] = useState({
    email: '',
    fullName: '',
    permissions: ['user'],
  });
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(null);

  const { hasPermission } = useAuth();

  // Load invitations on component mount and when filters/pagination change
  useEffect(() => {
    fetchInvitations();
  }, [page, rowsPerPage, statusFilter, emailFilter]);

  // Fetch invitations with current filters and pagination
  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const filters = {
        page: page + 1,
        limit: rowsPerPage,
        ...(statusFilter && { status: statusFilter }),
        ...(emailFilter && { email: emailFilter }),
      };

      const data = await getInvitations(filters);
      setInvitations(data || []);
      setTotalCount(data.pagination?.total || 0);
      setError(null);
    } catch (err) {
      console.error('Error fetching invitations:', err);
      setError('Failed to load invitations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = event => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Open create invitation dialog
  const handleOpenCreateDialog = () => {
    setOpenCreateDialog(true);
  };

  // Close create invitation dialog
  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
    // Reset form data
    setNewInvitation({
      email: '',
      fullName: '',
      permissions: ['user'],
    });
  };

  // Handle new invitation form field changes
  const handleInvitationFormChange = e => {
    const { name, value } = e.target;
    setNewInvitation(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle permissions change (multi-select)
  const handlePermissionsChange = e => {
    setNewInvitation(prev => ({
      ...prev,
      permissions: e.target.value,
    }));
  };

  // Create new invitation
  const handleCreateInvitation = async () => {
    try {
      setSubmitting(true);
      const result = await createInvitation(newInvitation);

      setNotification({
        open: true,
        message: 'Invitation created successfully!',
        severity: 'success',
        details: `Code: ${result.data.invitationCode} | PIN: ${result.data.pin}`,
      });

      handleCloseCreateDialog();
      fetchInvitations(); // Refresh the list
    } catch (err) {
      console.error('Error creating invitation:', err);
      setNotification({
        open: true,
        message: 'Failed to create invitation. Please try again.',
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Show invitation details
  const handleShowDetails = invitation => {
    setSelectedInvitation(invitation);
    setOpenDetailsDialog(true);
  };

  // Close details dialog
  const handleCloseDetailsDialog = () => {
    setOpenDetailsDialog(false);
    setSelectedInvitation(null);
  };

  // Resend invitation
  const handleResendInvitation = async invitationCode => {
    try {
      setResending(invitationCode);
      const result = await resendInvitation(invitationCode);

      setNotification({
        open: true,
        message: 'Invitation resent successfully!',
        severity: 'success',
        details: `PIN: ${result.data.pin}`,
      });

      fetchInvitations(); // Refresh the list
    } catch (err) {
      console.error('Error resending invitation:', err);
      setNotification({
        open: true,
        message: 'Failed to resend invitation. Please try again.',
        severity: 'error',
      });
    } finally {
      setResending(null);
    }
  };

  // Close notification
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Get status display text and color
  const getStatusDisplay = status => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', color: 'primary' };
      case 'onboarded':
        return { label: 'Onboarded', color: 'info' };
      case 'approved':
        return { label: 'Approved', color: 'success' };
      case 'rejected':
        return { label: 'Rejected', color: 'error' };
      default:
        return { label: status, color: 'default' };
    }
  };

  // Handle filter changes
  const handleFilterChange = e => {
    const { name, value } = e.target;
    if (name === 'status') {
      setStatusFilter(value);
    } else if (name === 'email') {
      setEmailFilter(value);
    }
    setPage(0); // Reset to first page when filters change
  };

  // Apply filters
  const handleApplyFilters = () => {
    fetchInvitations();
  };

  // Clear filters
  const handleClearFilters = () => {
    setStatusFilter('');
    setEmailFilter('');
    setPage(0);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Invitations
        </Typography>

        {hasPermission('admin') && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            Create Invitation
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={2}>
          <FormControl variant="outlined" sx={{ minWidth: 120 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              id="status-filter"
              name="status"
              value={statusFilter}
              onChange={handleFilterChange}
              label="Status"
              size="small"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="onboarded">Onboarded</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Email"
            name="email"
            variant="outlined"
            size="small"
            value={emailFilter}
            onChange={handleFilterChange}
          />

          <Box>
            <Button variant="contained" onClick={handleApplyFilters} sx={{ mr: 1 }}>
              Apply Filters
            </Button>
            <Button variant="outlined" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </Box>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Invitations Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="invitations table">
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Invitation Code</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell width={120} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : invitations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No invitations found
                  </TableCell>
                </TableRow>
              ) : (
                invitations.map(invitation => {
                  const status = getStatusDisplay(invitation.status);
                  return (
                    <TableRow hover key={invitation._id || invitation.invitationCode}>
                      <TableCell>{invitation.email}</TableCell>
                      <TableCell>{invitation.invitationCode}</TableCell>
                      <TableCell>
                        <Chip label={status.label} color={status.color} size="small" />
                      </TableCell>
                      <TableCell>
                        {invitation.createdAt
                          ? `${formatDistanceToNow(new Date(invitation.createdAt))} ago`
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {invitation.expiresAt
                          ? new Date(invitation.expiresAt) > new Date()
                            ? `Expires in ${formatDistanceToNow(new Date(invitation.expiresAt))}`
                            : 'Expired'
                          : 'N/A'}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleShowDetails(invitation)}
                          title="View Details"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>

                        {hasPermission('admin') && invitation.status === 'pending' && (
                          <IconButton
                            size="small"
                            onClick={() => handleResendInvitation(invitation.invitationCode)}
                            disabled={resending === invitation.invitationCode}
                            title="Resend Invitation"
                          >
                            {resending === invitation.invitationCode ? (
                              <CircularProgress size={20} />
                            ) : (
                              <SendIcon fontSize="small" />
                            )}
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Create Invitation Dialog */}
      <Dialog open={openCreateDialog} onClose={handleCloseCreateDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Invitation</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Create a new invitation code to allow a user to sign up.
          </DialogContentText>

          <TextField
            margin="dense"
            id="email"
            name="email"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={newInvitation.email}
            onChange={handleInvitationFormChange}
            required
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            id="fullName"
            name="fullName"
            label="Full Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newInvitation.fullName}
            onChange={handleInvitationFormChange}
            required
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="permissions-select-label">Permissions</InputLabel>
            <Select
              labelId="permissions-select-label"
              id="permissions"
              multiple
              value={newInvitation.permissions}
              onChange={handlePermissionsChange}
              label="Permissions"
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="moderator">Moderator</MenuItem>
              <MenuItem value="ai_tools">AI Tools Access</MenuItem>
              <MenuItem value="rag_access">RAG System Access</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateInvitation}
            variant="contained"
            disabled={submitting || !newInvitation.email || newInvitation.permissions.length === 0}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {submitting ? 'Creating...' : 'Create Invitation'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Invitation Details Dialog */}
      {selectedInvitation && (
        <Dialog open={openDetailsDialog} onClose={handleCloseDetailsDialog} maxWidth="md" fullWidth>
          <DialogTitle>Invitation Details</DialogTitle>
          <DialogContent>
            <TableContainer>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      Email
                    </TableCell>
                    <TableCell>{selectedInvitation.email}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      Invitation Code
                    </TableCell>
                    <TableCell>{selectedInvitation.invitationCode}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      Status
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusDisplay(selectedInvitation.status).label}
                        color={getStatusDisplay(selectedInvitation.status).color}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      Created At
                    </TableCell>
                    <TableCell>
                      {selectedInvitation.createdAt
                        ? new Date(selectedInvitation.createdAt).toLocaleString()
                        : 'N/A'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      Expires At
                    </TableCell>
                    <TableCell>
                      {selectedInvitation.expiresAt
                        ? new Date(selectedInvitation.expiresAt).toLocaleString()
                        : 'N/A'}
                    </TableCell>
                  </TableRow>
                  {selectedInvitation.metadata?.fullName && (
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                        Full Name
                      </TableCell>
                      <TableCell>{selectedInvitation.metadata.fullName}</TableCell>
                    </TableRow>
                  )}
                  {selectedInvitation.permissions && (
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                        Permissions
                      </TableCell>
                      <TableCell>
                        {Array.isArray(selectedInvitation.permissions) &&
                        selectedInvitation.permissions.length > 0 ? (
                          selectedInvitation.permissions.map(perm => (
                            <Chip
                              key={perm}
                              label={perm}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))
                        ) : (
                          <Chip label="user" size="small" variant="outlined" />
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {selectedInvitation.status === 'onboarded' && (
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Onboarding Status
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  This invitation has been used and the user has completed the onboarding process.
                </Typography>
                <Button
                  component={RouterLink}
                  to={`/mis/onboarding/${selectedInvitation.invitationCode}`}
                  variant="outlined"
                  size="small"
                >
                  View Onboarding Details
                </Button>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDetailsDialog}>Close</Button>
            {hasPermission('admin') && selectedInvitation.status === 'pending' && (
              <Button
                onClick={() => {
                  handleCloseDetailsDialog();
                  handleResendInvitation(selectedInvitation.invitationCode);
                }}
                variant="contained"
                color="primary"
                startIcon={<SendIcon />}
              >
                Resend Invitation
              </Button>
            )}
          </DialogActions>
        </Dialog>
      )}

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
          {notification.details && (
            <Typography variant="body2" sx={{ mt: 1, fontFamily: 'monospace' }}>
              {notification.details}
            </Typography>
          )}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MisInvitations;
