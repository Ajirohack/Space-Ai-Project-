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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
  Card,
  CardContent,
  CardActions,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import {
  getOnboardingSubmissions,
  getOnboardingDetail,
  approveMembership,
} from '../services/misService';
import { useAuth } from '../contexts/AuthContext';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

/**
 * MIS Onboarding page component
 * Displays onboarding submissions and allows approving/rejecting membership
 */
const MisOnboarding = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const { invitationCode } = useParams();

  // Load submissions on component mount and when pagination changes
  useEffect(() => {
    if (invitationCode) {
      loadSingleSubmission(invitationCode);
    } else {
      loadSubmissions();
    }
  }, [invitationCode, page, rowsPerPage]);

  // Fetch all submissions with pagination
  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const filters = {
        page: page + 1,
        limit: rowsPerPage,
      };

      const data = await getOnboardingSubmissions(filters);
      setSubmissions(data || []);
      setTotalCount(data.pagination?.total || 0);
      setError(null);
    } catch (err) {
      console.error('Error fetching onboarding submissions:', err);
      setError('Failed to load onboarding submissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load a single onboarding submission
  const loadSingleSubmission = async code => {
    try {
      setLoading(true);
      const data = await getOnboardingDetail(code);
      setSelectedSubmission(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching onboarding details:', err);
      setError('Failed to load onboarding details. The invitation code may be invalid.');
      setSelectedSubmission(null);
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

  // View submission details
  const handleViewDetails = invitationCode => {
    navigate(`/mis/onboarding/${invitationCode}`);
  };

  // Go back to submissions list
  const handleBackToList = () => {
    navigate('/mis/onboarding');
  };

  // Open approve dialog
  const handleOpenApproveDialog = submission => {
    setSelectedSubmission(submission);
    setApprovalNotes('');
    setOpenApproveDialog(true);
  };

  // Close approve dialog
  const handleCloseApproveDialog = () => {
    setOpenApproveDialog(false);
  };

  // Handle approval notes change
  const handleApprovalNotesChange = event => {
    setApprovalNotes(event.target.value);
  };

  // Approve membership
  const handleApproveMembership = async () => {
    try {
      setSubmitting(true);
      const result = await approveMembership(
        selectedSubmission.invitationCode,
        true,
        approvalNotes
      );

      setNotification({
        open: true,
        message: 'Membership approved successfully!',
        severity: 'success',
        details: `Membership key: ${result.data.membershipKey}`,
      });

      handleCloseApproveDialog();

      // Refresh the data
      if (invitationCode) {
        loadSingleSubmission(invitationCode);
      } else {
        loadSubmissions();
      }
    } catch (err) {
      console.error('Error approving membership:', err);
      setNotification({
        open: true,
        message: 'Failed to approve membership. Please try again.',
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Open reject dialog
  const handleOpenRejectDialog = submission => {
    setSelectedSubmission(submission);
    setRejectionNotes('');
    setOpenRejectDialog(true);
  };

  // Close reject dialog
  const handleCloseRejectDialog = () => {
    setOpenRejectDialog(false);
  };

  // Handle rejection notes change
  const handleRejectionNotesChange = event => {
    setRejectionNotes(event.target.value);
  };

  // Reject membership
  const handleRejectMembership = async () => {
    try {
      setSubmitting(true);
      await approveMembership(selectedSubmission.invitationCode, false, rejectionNotes);

      setNotification({
        open: true,
        message: 'Membership application rejected.',
        severity: 'info',
      });

      handleCloseRejectDialog();

      // Refresh the data
      if (invitationCode) {
        loadSingleSubmission(invitationCode);
      } else {
        loadSubmissions();
      }
    } catch (err) {
      console.error('Error rejecting membership:', err);
      setNotification({
        open: true,
        message: 'Failed to reject membership application. Please try again.',
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Close notification
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Format response value based on its type
  const formatResponseValue = value => {
    if (value === null || value === undefined) {
      return 'Not provided';
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    return value.toString();
  };

  // Render a single submission detail view
  const renderSubmissionDetail = () => {
    if (!selectedSubmission) {
      return (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="textSecondary">
            No submission data found
          </Typography>
          <Button variant="contained" color="primary" onClick={handleBackToList} sx={{ mt: 2 }}>
            Back to Submissions List
          </Button>
        </Box>
      );
    }

    const { email, status, onboardingData, metadata } = selectedSubmission;
    const { responses, voiceConsent, submittedAt } = onboardingData || {};

    return (
      <>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Button variant="outlined" onClick={handleBackToList}>
            Back to Submissions List
          </Button>

          {status === 'onboarded' && hasPermission('admin') && (
            <Box>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => handleOpenApproveDialog(selectedSubmission)}
                sx={{ mr: 1 }}
              >
                Approve
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => handleOpenRejectDialog(selectedSubmission)}
              >
                Reject
              </Button>
            </Box>
          )}
        </Box>

        {/* Submission Info */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Email
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {email}
                </Typography>

                <Typography variant="subtitle2" color="textSecondary">
                  Full Name
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {metadata?.fullName || 'N/A'}
                </Typography>

                <Typography variant="subtitle2" color="textSecondary">
                  Status
                </Typography>
                <Chip
                  label={status.charAt(0).toUpperCase() + status.slice(1)}
                  color={
                    status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'primary'
                  }
                  sx={{ my: 1 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Invitation Code
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedSubmission.invitationCode}
                </Typography>

                <Typography variant="subtitle2" color="textSecondary">
                  Submitted At
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {submittedAt ? new Date(submittedAt).toLocaleString() : 'N/A'}
                </Typography>

                <Typography variant="subtitle2" color="textSecondary">
                  Voice Consent
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {voiceConsent !== undefined ? (voiceConsent ? 'Yes' : 'No') : 'N/A'}
                </Typography>
              </Grid>
            </Grid>

            {status === 'approved' && (
              <Box mt={2}>
                <Typography variant="subtitle2" color="textSecondary">
                  Approval Notes
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {metadata?.approvalNotes || 'No notes provided'}
                </Typography>
              </Box>
            )}

            {status === 'rejected' && (
              <Box mt={2}>
                <Typography variant="subtitle2" color="textSecondary">
                  Rejection Notes
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {metadata?.approvalNotes || 'No notes provided'}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Responses */}
        <Typography variant="h6" gutterBottom>
          Onboarding Responses
        </Typography>

        {responses && Object.keys(responses).length > 0 ? (
          <Box mb={4}>
            {Object.keys(responses).map(key => (
              <Accordion key={key} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>{key}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography>{formatResponseValue(responses[key])}</Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            No response data available.
          </Typography>
        )}
      </>
    );
  };

  // Render submissions list
  const renderSubmissionsList = () => {
    return (
      <>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" gutterBottom>
            Onboarding Submissions
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader aria-label="onboarding submissions table">
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell width={180} align="center">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : submissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No onboarding submissions found
                    </TableCell>
                  </TableRow>
                ) : (
                  submissions.map(submission => (
                    <TableRow hover key={submission._id || submission.invitationCode}>
                      <TableCell>{submission.email}</TableCell>
                      <TableCell>{submission.metadata?.fullName || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={
                            submission.status.charAt(0).toUpperCase() + submission.status.slice(1)
                          }
                          color={
                            submission.status === 'approved'
                              ? 'success'
                              : submission.status === 'rejected'
                              ? 'error'
                              : 'primary'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {submission.onboardingData?.submittedAt
                          ? `${formatDistanceToNow(
                              new Date(submission.onboardingData.submittedAt)
                            )} ago`
                          : 'N/A'}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(submission.invitationCode)}
                          title="View Details"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>

                        {hasPermission('admin') && submission.status === 'onboarded' && (
                          <>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleOpenApproveDialog(submission)}
                              title="Approve Application"
                            >
                              <ThumbUpIcon fontSize="small" />
                            </IconButton>

                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleOpenRejectDialog(submission)}
                              title="Reject Application"
                            >
                              <ThumbDownIcon fontSize="small" />
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
      </>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {invitationCode ? renderSubmissionDetail() : renderSubmissionsList()}

      {/* Approve Dialog */}
      <Dialog open={openApproveDialog} onClose={handleCloseApproveDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Membership Application</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            You are about to approve the membership application for:
            <br />
            <strong>{selectedSubmission?.email}</strong> ({selectedSubmission?.metadata?.fullName})
          </DialogContentText>

          <TextField
            margin="dense"
            id="approvalNotes"
            name="approvalNotes"
            label="Approval Notes (optional)"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={approvalNotes}
            onChange={handleApprovalNotesChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseApproveDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleApproveMembership}
            variant="contained"
            color="success"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {submitting ? 'Processing...' : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={openRejectDialog} onClose={handleCloseRejectDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Membership Application</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            You are about to reject the membership application for:
            <br />
            <strong>{selectedSubmission?.email}</strong> ({selectedSubmission?.metadata?.fullName})
          </DialogContentText>

          <TextField
            margin="dense"
            id="rejectionNotes"
            name="rejectionNotes"
            label="Rejection Reason (required)"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={rejectionNotes}
            onChange={handleRejectionNotesChange}
            required
            error={!rejectionNotes}
            helperText={!rejectionNotes ? 'Please provide a reason for rejection' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRejectDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleRejectMembership}
            variant="contained"
            color="error"
            disabled={submitting || !rejectionNotes}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {submitting ? 'Processing...' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

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
            <Typography variant="body2" sx={{ mt: 1 }}>
              {notification.details}
            </Typography>
          )}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MisOnboarding;
