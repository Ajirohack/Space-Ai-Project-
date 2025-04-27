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
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Block as BlockIcon,
  Edit as EditIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import {
  getMemberships,
  getMembershipDetail,
  revokeMembership,
  updateMembershipPermissions,
  exportMemberships,
} from '../services/misService';
import { useAuth } from '../contexts/AuthContext';
import { Link as RouterLink } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

/**
 * MIS Memberships page component
 * Allows viewing and managing membership keys
 */
const MisMemberships = () => {
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openPermissionsDialog, setOpenPermissionsDialog] = useState(false);
  const [openRevokeDialog, setOpenRevokeDialog] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [activeFilter, setActiveFilter] = useState(true);
  const [emailFilter, setEmailFilter] = useState('');
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [revokeReason, setRevokeReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { hasPermission } = useAuth();

  // Load memberships on component mount and when filters/pagination change
  useEffect(() => {
    fetchMemberships();
  }, [page, rowsPerPage, activeFilter]);

  // Fetch memberships with current filters and pagination
  const fetchMemberships = async () => {
    try {
      setLoading(true);
      const filters = {
        page: page + 1,
        limit: rowsPerPage,
        active: activeFilter,
      };

      if (emailFilter) {
        filters.email = emailFilter;
      }

      const data = await getMemberships(filters);
      setMemberships(data || []);
      setTotalCount(data.pagination?.total || 0);
      setError(null);
    } catch (err) {
      console.error('Error fetching memberships:', err);
      setError('Failed to load memberships. Please try again.');
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

  // Handle active filter change
  const handleActiveFilterChange = event => {
    setActiveFilter(event.target.checked);
    setPage(0);
  };

  // Handle email filter change
  const handleEmailFilterChange = event => {
    setEmailFilter(event.target.value);
  };

  // Apply filters
  const handleApplyFilters = () => {
    setPage(0);
    fetchMemberships();
  };

  // Clear filters
  const handleClearFilters = () => {
    setEmailFilter('');
    setActiveFilter(true);
    setPage(0);
  };

  // View membership details
  const handleViewDetails = async membershipKey => {
    try {
      setLoading(true);
      const data = await getMembershipDetail(membershipKey);
      setSelectedMembership(data);
      setOpenDetailsDialog(true);
    } catch (err) {
      console.error('Error fetching membership details:', err);
      setNotification({
        open: true,
        message: 'Failed to load membership details. Please try again.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Close details dialog
  const handleCloseDetailsDialog = () => {
    setOpenDetailsDialog(false);
    setSelectedMembership(null);
  };

  // Open edit permissions dialog
  const handleOpenPermissionsDialog = membership => {
    setSelectedMembership(membership);
    setSelectedPermissions(membership.permissions || ['user']);
    setOpenPermissionsDialog(true);
  };

  // Close edit permissions dialog
  const handleClosePermissionsDialog = () => {
    setOpenPermissionsDialog(false);
    setSelectedMembership(null);
    setSelectedPermissions([]);
  };

  // Handle permissions change
  const handlePermissionsChange = event => {
    setSelectedPermissions(event.target.value);
  };

  // Update membership permissions
  const handleUpdatePermissions = async () => {
    try {
      setSubmitting(true);
      await updateMembershipPermissions(selectedMembership.key, selectedPermissions);

      setNotification({
        open: true,
        message: 'Permissions updated successfully!',
        severity: 'success',
      });

      handleClosePermissionsDialog();
      fetchMemberships(); // Refresh the list
    } catch (err) {
      console.error('Error updating permissions:', err);
      setNotification({
        open: true,
        message: 'Failed to update permissions. Please try again.',
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Open revoke membership dialog
  const handleOpenRevokeDialog = membership => {
    setSelectedMembership(membership);
    setRevokeReason('');
    setOpenRevokeDialog(true);
  };

  // Close revoke membership dialog
  const handleCloseRevokeDialog = () => {
    setOpenRevokeDialog(false);
    setSelectedMembership(null);
    setRevokeReason('');
  };

  // Handle revoke reason change
  const handleRevokeReasonChange = event => {
    setRevokeReason(event.target.value);
  };

  // Revoke membership
  const handleRevokeMembership = async () => {
    try {
      setSubmitting(true);
      await revokeMembership(selectedMembership.key, revokeReason);

      setNotification({
        open: true,
        message: 'Membership revoked successfully!',
        severity: 'success',
      });

      handleCloseRevokeDialog();
      fetchMemberships(); // Refresh the list
    } catch (err) {
      console.error('Error revoking membership:', err);
      setNotification({
        open: true,
        message: 'Failed to revoke membership. Please try again.',
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Export memberships as CSV
  const handleExportMemberships = async () => {
    try {
      setExporting(true);
      const blob = await exportMemberships({ active: activeFilter });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `memberships_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      setNotification({
        open: true,
        message: 'Export successful!',
        severity: 'success',
      });
    } catch (err) {
      console.error('Error exporting memberships:', err);
      setNotification({
        open: true,
        message: 'Failed to export memberships. Please try again.',
        severity: 'error',
      });
    } finally {
      setExporting(false);
    }
  };

  // Close notification
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Memberships
        </Typography>

        {hasPermission('admin') && (
          <Button
            variant="contained"
            color="primary"
            startIcon={
              exporting ? <CircularProgress size={20} color="inherit" /> : <FileDownloadIcon />
            }
            onClick={handleExportMemberships}
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Box display="flex" flexWrap="wrap" alignItems="center" gap={2}>
          <FormControlLabel
            control={
              <Switch
                checked={activeFilter}
                onChange={handleActiveFilterChange}
                name="activeFilter"
                color="primary"
              />
            }
            label="Active Memberships Only"
          />

          <TextField
            label="Email"
            variant="outlined"
            size="small"
            value={emailFilter}
            onChange={handleEmailFilterChange}
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

      {/* Memberships Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="memberships table">
            <TableHead>
              <TableRow>
                <TableCell>Membership Key</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell width={150} align="center">
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
              ) : memberships.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No memberships found
                  </TableCell>
                </TableRow>
              ) : (
                memberships.map(membership => (
                  <TableRow hover key={membership._id || membership.key}>
                    <TableCell>{membership.key}</TableCell>
                    <TableCell>
                      {membership.invitation?.email || membership.userId?.email || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={membership.active ? 'Active' : 'Revoked'}
                        color={membership.active ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {membership.createdAt
                        ? `${formatDistanceToNow(new Date(membership.createdAt))} ago`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {Array.isArray(membership.permissions) &&
                      membership.permissions.length > 0 ? (
                        membership.permissions.map(perm => (
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
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(membership.key)}
                        title="View Details"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>

                      {hasPermission('admin') && membership.active && (
                        <>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenPermissionsDialog(membership)}
                            title="Edit Permissions"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>

                          <IconButton
                            size="small"
                            onClick={() => handleOpenRevokeDialog(membership)}
                            title="Revoke Membership"
                            color="error"
                          >
                            <BlockIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
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

      {/* Membership Details Dialog */}
      {selectedMembership && (
        <Dialog open={openDetailsDialog} onClose={handleCloseDetailsDialog} maxWidth="md" fullWidth>
          <DialogTitle>Membership Details</DialogTitle>
          <DialogContent>
            <TableContainer>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      Membership Key
                    </TableCell>
                    <TableCell>{selectedMembership.key}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      Status
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={selectedMembership.active ? 'Active' : 'Revoked'}
                        color={selectedMembership.active ? 'success' : 'error'}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      Email
                    </TableCell>
                    <TableCell>
                      {selectedMembership.invitation?.email ||
                        selectedMembership.userId?.email ||
                        'N/A'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      Full Name
                    </TableCell>
                    <TableCell>
                      {selectedMembership.invitation?.metadata?.fullName || 'N/A'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      Created At
                    </TableCell>
                    <TableCell>
                      {selectedMembership.createdAt
                        ? new Date(selectedMembership.createdAt).toLocaleString()
                        : 'N/A'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      Created By
                    </TableCell>
                    <TableCell>
                      {selectedMembership.createdBy
                        ? selectedMembership.createdBy.name || selectedMembership.createdBy.email
                        : 'N/A'}
                    </TableCell>
                  </TableRow>
                  {!selectedMembership.active && (
                    <>
                      <TableRow>
                        <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                          Revoked At
                        </TableCell>
                        <TableCell>
                          {selectedMembership.revokedAt
                            ? new Date(selectedMembership.revokedAt).toLocaleString()
                            : 'N/A'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                          Revocation Reason
                        </TableCell>
                        <TableCell>
                          {selectedMembership.metadata?.revocationReason || 'No reason provided'}
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      Permissions
                    </TableCell>
                    <TableCell>
                      {Array.isArray(selectedMembership.permissions) &&
                      selectedMembership.permissions.length > 0
                        ? selectedMembership.permissions.map(perm => (
                            <Chip
                              key={perm}
                              label={perm}
                              color="primary"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))
                        : 'No permissions assigned'}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDetailsDialog}>Close</Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Edit Permissions Dialog */}
      {selectedMembership && (
        <Dialog
          open={openPermissionsDialog}
          onClose={handleClosePermissionsDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Edit Permissions</DialogTitle>
          <DialogContent>
            <Typography variant="body2" gutterBottom sx={{ mb: 2 }}>
              Update permissions for membership key: <strong>{selectedMembership.key}</strong>
            </Typography>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id="permissions-label">Permissions</InputLabel>
              <Select
                labelId="permissions-label"
                id="permissions"
                multiple
                value={selectedPermissions}
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
            <Button onClick={handleClosePermissionsDialog} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePermissions}
              variant="contained"
              disabled={submitting || selectedPermissions.length === 0}
              startIcon={submitting ? <CircularProgress size={20} /> : null}
            >
              {submitting ? 'Updating...' : 'Update Permissions'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Revoke Membership Dialog */}
      {selectedMembership && (
        <Dialog open={openRevokeDialog} onClose={handleCloseRevokeDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Revoke Membership</DialogTitle>
          <DialogContent>
            <Typography variant="body1" color="error" sx={{ mb: 2 }}>
              Warning: This action cannot be undone!
            </Typography>

            <Typography variant="body2" gutterBottom>
              You are about to revoke access for membership key:{' '}
              <strong>{selectedMembership.key}</strong>
            </Typography>

            <Typography variant="body2" gutterBottom sx={{ mt: 2 }}>
              Associated email: <strong>{selectedMembership.invitation?.email || 'N/A'}</strong>
            </Typography>

            <TextField
              margin="dense"
              id="reason"
              name="reason"
              label="Reason for revocation"
              type="text"
              fullWidth
              variant="outlined"
              multiline
              rows={3}
              value={revokeReason}
              onChange={handleRevokeReasonChange}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseRevokeDialog} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleRevokeMembership}
              variant="contained"
              color="error"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={20} /> : null}
            >
              {submitting ? 'Revoking...' : 'Revoke Membership'}
            </Button>
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
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MisMemberships;
