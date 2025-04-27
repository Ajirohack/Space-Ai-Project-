import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  PeopleAlt as PeopleIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';
import { fetchMisStats, syncWithMis } from '../services/misService';
import { useAuth } from '../contexts/AuthContext';
import { Link as RouterLink } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

/**
 * MIS Dashboard page component
 * Displays MIS system statistics and metrics
 */
const MisDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  const { hasPermission } = useAuth();

  // Load stats on component mount
  useEffect(() => {
    loadStats();
  }, []);

  // Fetch MIS statistics
  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await fetchMisStats();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching MIS stats:', err);
      setError('Failed to load MIS statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Sync with MIS system
  const handleSync = async () => {
    if (!hasPermission('admin')) return;

    try {
      setSyncing(true);
      setSyncMessage({ text: 'Synchronizing with MIS system...', type: 'info' });

      const result = await syncWithMis();

      setSyncMessage({
        text: `Synchronization completed. ${result.data.updated || 0} records updated.`,
        type: 'success',
      });

      // Reload stats after sync
      loadStats();
    } catch (err) {
      console.error('Error syncing with MIS:', err);
      setSyncMessage({
        text: 'Failed to synchronize with MIS. Please try again.',
        type: 'error',
      });
    } finally {
      setSyncing(false);
      // Clear success message after 5 seconds
      if (syncMessage?.type === 'success') {
        setTimeout(() => setSyncMessage(null), 5000);
      }
    }
  };

  // Format status counts for pie chart
  const getStatusChartData = () => {
    if (!stats || !stats.invitationStats) return [];

    const { invitationStats } = stats;
    return [
      { name: 'Pending', value: invitationStats.pending || 0, color: '#3498db' },
      { name: 'Onboarded', value: invitationStats.onboarded || 0, color: '#f39c12' },
      { name: 'Approved', value: invitationStats.approved || 0, color: '#2ecc71' },
      { name: 'Rejected', value: invitationStats.rejected || 0, color: '#e74c3c' },
      { name: 'Expired', value: invitationStats.expired || 0, color: '#95a5a6' },
    ];
  };

  // Format monthly data for bar chart
  const getMonthlyActivityData = () => {
    if (!stats || !stats.monthlyActivity) return [];

    return stats.monthlyActivity.map(item => ({
      name: item.month,
      invitations: item.invitations,
      approvals: item.approvals,
      rejections: item.rejections,
    }));
  };

  // Format membership stats with conversion rates
  const getMembershipConversionData = () => {
    if (!stats) return null;

    const { invitationStats, membershipStats } = stats;

    const total = invitationStats?.total || 0;
    const onboardedCount = invitationStats?.onboarded || 0;
    const approvedCount = invitationStats?.approved || 0;

    const onboardingConversion = total > 0 ? ((onboardedCount + approvedCount) / total) * 100 : 0;
    const approvalConversion = onboardedCount > 0 ? (approvedCount / onboardedCount) * 100 : 0;

    return {
      onboardingConversion: onboardingConversion.toFixed(1),
      approvalConversion: approvalConversion.toFixed(1),
      activeMembers: membershipStats?.active || 0,
      revokedMembers: membershipStats?.revoked || 0,
    };
  };

  // Render error state
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={loadStats}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  // Render loading state
  if (loading && !stats) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Get processed data for charts
  const statusData = getStatusChartData();
  const monthlyData = getMonthlyActivityData();
  const conversionData = getMembershipConversionData();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          MIS Dashboard
        </Typography>

        {hasPermission('admin') && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={syncing ? <CircularProgress size={20} color="inherit" /> : <SyncIcon />}
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? 'Syncing...' : 'Sync with MIS'}
          </Button>
        )}
      </Box>

      {syncMessage && (
        <Alert
          severity={syncMessage.type}
          sx={{ mb: 3 }}
          action={
            syncMessage.type === 'error' ? (
              <Button color="inherit" size="small" onClick={() => setSyncMessage(null)}>
                Dismiss
              </Button>
            ) : null
          }
        >
          {syncMessage.text}
        </Alert>
      )}

      {/* Summary cards row */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              height: 140,
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Total Invitations
            </Typography>
            <Box sx={{ fontSize: '3rem', fontWeight: 'bold', color: 'primary.main' }}>
              {stats?.invitationStats?.total || 0}
            </Box>
            <Typography variant="body2" color="textSecondary">
              Last 30 days: +{stats?.recentStats?.newInvitations || 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              height: 140,
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Active Members
            </Typography>
            <Box sx={{ fontSize: '3rem', fontWeight: 'bold', color: 'success.main' }}>
              {stats?.membershipStats?.active || 0}
            </Box>
            <Typography variant="body2" color="textSecondary">
              Last 30 days: +{stats?.recentStats?.newMembers || 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              height: 140,
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Pending Review
            </Typography>
            <Box sx={{ fontSize: '3rem', fontWeight: 'bold', color: 'warning.main' }}>
              {stats?.invitationStats?.onboarded || 0}
            </Box>
            <Typography variant="body2" color="textSecondary">
              <Button component={RouterLink} to="/mis/onboarding" size="small" color="primary">
                View Submissions
              </Button>
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              height: 140,
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Approval Rate
            </Typography>
            <Box sx={{ fontSize: '3rem', fontWeight: 'bold', color: 'info.main' }}>
              {conversionData?.approvalConversion || 0}%
            </Box>
            <Typography variant="body2" color="textSecondary">
              From submission to approval
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts row */}
      <Grid container spacing={3} mb={4}>
        {/* Status Distribution Chart */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Invitation Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={value => [`${value} invitations`, null]} />
              </PieChart>
            </ResponsiveContainer>
            <Box display="flex" justifyContent="center" flexWrap="wrap" mt={2}>
              {statusData.map((entry, index) => (
                <Box key={index} display="flex" alignItems="center" mx={1} my={0.5}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: entry.color,
                      mr: 1,
                    }}
                  />
                  <Typography variant="body2">
                    {entry.name}: {entry.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Monthly Activity Chart */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Monthly Activity
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="invitations" name="Invitations Sent" fill="#3498db" />
                <Bar dataKey="approvals" name="Approvals" fill="#2ecc71" />
                <Bar dataKey="rejections" name="Rejections" fill="#e74c3c" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Details row */}
      <Grid container spacing={3}>
        {/* Conversion Metrics */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Conversion Metrics
            </Typography>

            <Box mb={3}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2">
                  Invitation to Onboarding: {conversionData?.onboardingConversion}%
                </Typography>
                <Typography variant="body2">
                  {(stats?.invitationStats?.onboarded || 0) +
                    (stats?.invitationStats?.approved || 0)}
                  /{stats?.invitationStats?.total || 0}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={parseFloat(conversionData?.onboardingConversion) || 0}
                color="primary"
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            <Box mb={3}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2">
                  Onboarding to Approval: {conversionData?.approvalConversion}%
                </Typography>
                <Typography variant="body2">
                  {stats?.invitationStats?.approved || 0}/{stats?.invitationStats?.onboarded || 0}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={parseFloat(conversionData?.approvalConversion) || 0}
                color="success"
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            <Box mb={3}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2">
                  Membership Retention:{' '}
                  {stats?.membershipStats?.active > 0
                    ? (
                        (stats.membershipStats.active /
                          (stats.membershipStats.active + stats.membershipStats.revoked)) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </Typography>
                <Typography variant="body2">
                  {stats?.membershipStats?.active || 0}/
                  {(stats?.membershipStats?.active || 0) + (stats?.membershipStats?.revoked || 0)}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={
                  stats?.membershipStats?.active > 0
                    ? (stats.membershipStats.active /
                        (stats.membershipStats.active + stats.membershipStats.revoked)) *
                      100
                    : 0
                }
                color="info"
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            <Box display="flex" justifyContent="center" mt={3}>
              <Button
                component={RouterLink}
                to="/mis/invitations"
                variant="outlined"
                sx={{ mr: 2 }}
              >
                Manage Invitations
              </Button>
              <Button component={RouterLink} to="/mis/memberships" variant="outlined">
                Manage Memberships
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            {stats?.recentActivity?.length > 0 ? (
              <List>
                {stats.recentActivity.map((activity, index) => (
                  <React.Fragment key={activity.id || index}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center">
                            {activity.type === 'invitation' ? (
                              <EmailIcon color="primary" sx={{ mr: 1 }} fontSize="small" />
                            ) : activity.type === 'member_added' ? (
                              <PeopleIcon color="success" sx={{ mr: 1 }} fontSize="small" />
                            ) : activity.type === 'approval' ? (
                              <CheckCircleIcon color="success" sx={{ mr: 1 }} fontSize="small" />
                            ) : (
                              <CancelIcon color="error" sx={{ mr: 1 }} fontSize="small" />
                            )}
                            {activity.message}
                          </Box>
                        }
                        secondary={new Date(activity.timestamp).toLocaleString()}
                      />
                      {activity.adminAction && (
                        <Chip label="Admin" size="small" color="secondary" variant="outlined" />
                      )}
                    </ListItem>
                    {index < stats.recentActivity.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 3 }}>
                No recent activity found
              </Typography>
            )}
            <Box display="flex" justifyContent="center" mt={2}>
              <Button startIcon={<RefreshIcon />} onClick={loadStats} variant="text">
                Refresh Data
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MisDashboard;
