import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CircularProgress, 
  Container, 
  Divider, 
  Grid, 
  Paper, 
  Tab, 
  Tabs, 
  Typography 
} from '@mui/material';
import { 
  PersonAdd, 
  CheckCircle, 
  HourglassEmpty, 
  Person, 
  Error,
  Sync
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import InvitationsList from './InvitationsList';
import OnboardingList from './OnboardingList';
import MembershipsList from './MembershipsList';
import CreateInvitationForm from './CreateInvitationForm';
import MisStatistics from './MisStatistics';
import { fetchMisStats, syncWithMis } from '../../services/misService';
import { useAuth } from '../../contexts/AuthContext';

const MisDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInvitations: 0,
    pendingInvitations: 0,
    onboardingCompleted: 0,
    approvedMemberships: 0,
    syncStatus: 'unknown'
  });
  const [syncInProgress, setSyncInProgress] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { hasPermission } = useAuth();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await fetchMisStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load MIS statistics', error);
      enqueueSnackbar('Failed to load MIS statistics', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSync = async () => {
    setSyncInProgress(true);
    try {
      const result = await syncWithMis();
      enqueueSnackbar(`Sync completed: ${result.message}`, { variant: 'success' });
      loadStats(); // Refresh stats after sync
    } catch (error) {
      console.error('Sync failed', error);
      enqueueSnackbar('Failed to sync with MIS system', { variant: 'error' });
    } finally {
      setSyncInProgress(false);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Membership Initiation System
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Manage invitations, onboarding progress, and membership approvals
        </Typography>
      </Box>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2}>
            <MisStatistics stats={stats} loading={loading} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Status
              </Typography>
              <Box display="flex" alignItems="center" mb={2}>
                <Box mr={1}>
                  {stats.syncStatus === 'healthy' ? (
                    <CheckCircle color="success" />
                  ) : stats.syncStatus === 'degraded' ? (
                    <Error color="warning" />
                  ) : (
                    <HourglassEmpty color="action" />
                  )}
                </Box>
                <Typography>
                  {stats.syncStatus === 'healthy'
                    ? 'Systems Connected'
                    : stats.syncStatus === 'degraded'
                    ? 'Partial Connection'
                    : 'Status Unknown'}
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Sync />}
                onClick={handleSync}
                disabled={syncInProgress || !hasPermission('admin')}
                fullWidth
              >
                {syncInProgress ? (
                  <>
                    <CircularProgress size={20} color="inherit" />&nbsp;
                    Syncing...
                  </>
                ) : (
                  'Sync with MIS'
                )}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper elevation={2}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab icon={<PersonAdd />} label="Invitations" />
          <Tab icon={<HourglassEmpty />} label="Onboarding" />
          <Tab icon={<Person />} label="Memberships" />
        </Tabs>
        <Divider />

        <Box p={3}>
          {activeTab === 0 && (
            <>
              <Box mb={4}>
                <CreateInvitationForm onSuccess={loadStats} />
              </Box>
              <InvitationsList onUpdate={loadStats} />
            </>
          )}
          {activeTab === 1 && <OnboardingList onUpdate={loadStats} />}
          {activeTab === 2 && <MembershipsList onUpdate={loadStats} />}
        </Box>
      </Paper>
    </Container>
  );
};

export default MisDashboard;