import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

/**
 * Tools Browser Component
 * 
 * This component provides a UI for browsing, searching, and filtering available tools
 * from the Tools/Packages module using the Discovery API.
 */
const ToolsBrowser = () => {
  // State
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCapability, setSelectedCapability] = useState('');
  const [capabilities, setCapabilities] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterAuthor, setFilterAuthor] = useState('');
  const [filterTag, setFilterTag] = useState('');

  // Load tools on component mount and when filters change
  useEffect(() => {
    const fetchTools = async () => {
      setLoading(true);
      setError(null);
      try {
        // Prepare search parameters
        const params = { page, pageSize };
        if (searchQuery) params.query = searchQuery;
        if (selectedCapability) params.capabilities = selectedCapability;
        if (filterAuthor) params.author = filterAuthor;
        if (filterTag) params.tags = filterTag;

        // If we have any filter parameters, use the search endpoint
        const endpoint = (searchQuery || selectedCapability || filterAuthor || filterTag)
          ? '/api/tools/search'
          : '/api/tools';

        const response = await axios.get(endpoint, { params });
        
        setTools(response.data.tools || []);
        setTotalPages(response.data.pages || 1);
      } catch (err) {
        console.error('Failed to fetch tools:', err);
        setError('Failed to load tools. Please try again later.');
        setTools([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTools();
  }, [page, pageSize, searchQuery, selectedCapability, filterAuthor, filterTag]);

  // Load capabilities for filter dropdown
  useEffect(() => {
    const fetchCapabilities = async () => {
      try {
        const response = await axios.get('/api/tools/capabilities/all');
        setCapabilities(response.data.capabilities || []);
      } catch (err) {
        console.error('Failed to fetch capabilities:', err);
      }
    };

    fetchCapabilities();
  }, []);

  // Handlers
  const handlePageChange = (_, newPage) => {
    setPage(newPage);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to first page when search changes
  };

  const handleCapabilityChange = (e) => {
    setSelectedCapability(e.target.value);
    setPage(1);
  };

  const handleAuthorChange = (e) => {
    setFilterAuthor(e.target.value);
    setPage(1);
  };

  const handleTagChange = (e) => {
    setFilterTag(e.target.value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCapability('');
    setFilterAuthor('');
    setFilterTag('');
    setPage(1);
  };

  return (
    <Box sx={{ px: 3, py: 2 }}>
      <Typography variant="h4" gutterBottom>
        Tools Browser
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Browse, search, and discover available tools in the system.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                label="Search tools"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by name, description, or tags"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setSearchQuery('')} edge="end" size="small">
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Select
                fullWidth
                displayEmpty
                value={selectedCapability}
                onChange={handleCapabilityChange}
              >
                <MenuItem value="">All Capabilities</MenuItem>
                {capabilities.map(cap => (
                  <MenuItem key={cap} value={cap}>
                    {cap}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide Filters' : 'More Filters'}
              </Button>
            </Grid>

            {showFilters && (
              <>
                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth
                    label="Filter by Author"
                    value={filterAuthor}
                    onChange={handleAuthorChange}
                  />
                </Grid>
                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth
                    label="Filter by Tag"
                    value={filterTag}
                    onChange={handleTagChange}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    color="secondary"
                    variant="outlined"
                    onClick={clearFilters}
                  >
                    Clear All
                  </Button>
                </Grid>
              </>
            )}
          </Grid>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText', p: 2 }}>
          <Typography>{error}</Typography>
        </Card>
      ) : tools.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6">No tools found</Typography>
          <Typography variant="body2" color="textSecondary">
            Try adjusting your search or filters
          </Typography>
        </Card>
      ) : (
        <>
          <Grid container spacing={3}>
            {tools.map((tool) => (
              <Grid item xs={12} md={6} lg={4} key={tool.id}>
                <ToolCard tool={tool} />
              </Grid>
            ))}
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>
        </>
      )}
    </Box>
  );
};

// Tool Card component to display individual tools
const ToolCard = ({ tool }) => {
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  const loadRecommendations = async () => {
    if (showRecommendations) {
      setShowRecommendations(false);
      return;
    }
    
    setLoadingRecs(true);
    try {
      const response = await axios.get(`/api/tools/${tool.id}/recommendations`);
      setRecommendations(response.data.recommendations || []);
      setShowRecommendations(true);
    } catch (err) {
      console.error('Error loading recommendations:', err);
    } finally {
      setLoadingRecs(false);
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={tool.name}
        subheader={`v${tool.version} • By ${tool.author}`}
      />
      <Divider />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="body2" paragraph>
          {tool.description}
        </Typography>
        
        {tool.tags && tool.tags.length > 0 && (
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
            {tool.tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                sx={{ m: 0.5 }}
              />
            ))}
          </Stack>
        )}
        
        {tool.requirements?.capabilities && tool.requirements.capabilities.length > 0 && (
          <>
            <Typography variant="subtitle2" gutterBottom>Capabilities:</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
              {tool.requirements.capabilities.map((cap) => (
                <Chip
                  key={cap}
                  label={cap}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ m: 0.5 }}
                />
              ))}
            </Stack>
          </>
        )}
        
        <Button
          variant="outlined"
          size="small"
          onClick={loadRecommendations}
          disabled={loadingRecs}
          sx={{ mt: 1 }}
        >
          {loadingRecs ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
          {showRecommendations ? 'Hide Recommendations' : 'Similar Tools'}
        </Button>
        
        {showRecommendations && recommendations.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Recommended Tools:</Typography>
            <Stack spacing={1}>
              {recommendations.map(rec => (
                <Typography key={rec.id} variant="body2">
                  • {rec.name} - {rec.description.substring(0, 60)}...
                </Typography>
              ))}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ToolsBrowser;