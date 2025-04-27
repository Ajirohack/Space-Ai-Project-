import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Grid, 
  Skeleton, 
  Typography 
} from '@mui/material';
import { 
  PersonAdd, 
  HourglassEmpty, 
  CheckCircle, 
  Person 
} from '@mui/icons-material';

const StatCard = ({ title, value, icon, color, loading }) => {
  return (
    <Card elevation={1} sx={{ height: '100%' }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Box 
              sx={{
                backgroundColor: `${color}.100`,
                borderRadius: '50%',
                height: 48,
                width: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {React.cloneElement(icon, { sx: { color: `${color}.main` } })}
            </Box>
          </Grid>
          <Grid item xs>
            <Typography variant="subtitle2" color="textSecondary">
              {title}
            </Typography>
            {loading ? (
              <Skeleton variant="text" width="60%" />
            ) : (
              <Typography variant="h4">{value}</Typography>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

const MisStatistics = ({ stats, loading }) => {
  return (
    <Box p={3}>
      <Typography variant="h6" gutterBottom>
        MIS Overview
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Invitations"
            value={stats.totalInvitations}
            icon={<PersonAdd />}
            color="primary"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Invitations"
            value={stats.pendingInvitations}
            icon={<HourglassEmpty />}
            color="warning"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Onboarding Completed"
            value={stats.onboardingCompleted}
            icon={<CheckCircle />}
            color="info"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Members"
            value={stats.approvedMemberships}
            icon={<Person />}
            color="success"
            loading={loading}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default MisStatistics;