import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Search, Filter, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ToolDetailsModal from '../../components/tools/ToolDetailsModal';
import { NextPage } from 'next';

interface Tool {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  tags: string[];
  capabilities: string[];
}

interface SearchParams {
  query: string;
  tag: string;
  capability: string;
  page: number;
  pageSize: number;
}

const ToolsPage: NextPage = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalTools, setTotalTools] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchParams, setSearchParams] = useState<SearchParams>({
    query: '',
    tag: '',
    capability: '',
    page: 1,
    pageSize: 10,
  });
  const [searchInput, setSearchInput] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableCapabilities, setAvailableCapabilities] = useState<string[]>([]);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);

  // Fetch tools based on search parameters
  useEffect(() => {
    const fetchTools = async () => {
      try {
        setLoading(true);
        setError(null);

        // Construct query parameters
        const queryParams = new URLSearchParams();
        if (searchParams.query) queryParams.append('query', searchParams.query);
        if (searchParams.tag) queryParams.append('tag', searchParams.tag);
        if (searchParams.capability) queryParams.append('capability', searchParams.capability);
        queryParams.append('page', searchParams.page.toString());
        queryParams.append('pageSize', searchParams.pageSize.toString());

        const response = await fetch(`/api/tools?${queryParams.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch tools');
        }

        const data = await response.json();
        setTools(data.tools);
        setTotalTools(data.total);
        setTotalPages(data.pages || Math.ceil(data.total / searchParams.pageSize));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTools();
  }, [searchParams]);

  // Fetch available tags and capabilities on initial load
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        // This would be replaced with actual API endpoints for metadata
        const [tagsResponse, capabilitiesResponse] = await Promise.all([
          fetch('/api/tools/metadata/tags'),
          fetch('/api/tools/metadata/capabilities'),
        ]);

        if (tagsResponse.ok) {
          const tagsData = await tagsResponse.json();
          setAvailableTags(tagsData.tags);
        }

        if (capabilitiesResponse.ok) {
          const capabilitiesData = await capabilitiesResponse.json();
          setAvailableCapabilities(capabilitiesData.capabilities);
        }
      } catch (err) {
        console.error('Failed to fetch metadata:', err);
      }
    };

    fetchMetadata();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({
      ...searchParams,
      query: searchInput,
      page: 1, // Reset to first page on new search
    });
  };

  const handleTagFilter = (tag: string) => {
    setSearchParams({
      ...searchParams,
      tag: searchParams.tag === tag ? '' : tag,
      page: 1,
    });
  };

  const handleCapabilityFilter = (capability: string) => {
    setSearchParams({
      ...searchParams,
      capability: searchParams.capability === capability ? '' : capability,
      page: 1,
    });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({
      ...searchParams,
      page: newPage,
    });
  };

  const handleToolClick = (toolId: string) => {
    setSelectedToolId(toolId);
  };

  return (
    <>
      <Head>
        <title>Tools Browser | Nexus Control Center</title>
      </Head>
      <DashboardLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Tools Browser</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Discover and manage available tools in the system
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search tools..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Search
            </button>
          </form>

          {/* Filters */}
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-2">
              <Filter className="h-4 w-4 mr-2" />
              <span>Filters:</span>
            </div>

            {/* Tag filters */}
            <div className="mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-2">
                Tags:
              </span>
              <div className="flex flex-wrap gap-2 mt-1">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagFilter(tag)}
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      searchParams.tag === tag
                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Capability filters */}
            <div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-2">
                Capabilities:
              </span>
              <div className="flex flex-wrap gap-2 mt-1">
                {availableCapabilities.map(capability => (
                  <button
                    key={capability}
                    onClick={() => handleCapabilityFilter(capability)}
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      searchParams.capability === capability
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {capability}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tools List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-4 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">{error}</div>
          ) : tools.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No tools found matching your criteria.
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Version
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tags
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {tools.map(tool => (
                    <tr
                      key={tool.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => handleToolClick(tool.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900 dark:text-white">{tool.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{tool.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-200 max-w-md truncate">
                          {tool.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-gray-200">
                          {tool.version}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {tool.author}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {tool.tags.map(tag => (
                            <span
                              key={`${tool.id}-${tag}`}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Showing{' '}
                      <span className="font-medium">
                        {(searchParams.page - 1) * searchParams.pageSize + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min(searchParams.page * searchParams.pageSize, totalTools)}
                      </span>{' '}
                      of <span className="font-medium">{totalTools}</span> results
                    </p>
                  </div>
                  <div>
                    <nav
                      className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                      aria-label="Pagination"
                    >
                      <button
                        onClick={() => handlePageChange(searchParams.page - 1)}
                        disabled={searchParams.page <= 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium ${
                          searchParams.page <= 1
                            ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                            : 'text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-5 w-5" />
                      </button>

                      {/* Page numbers */}
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => handlePageChange(i + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium ${
                            searchParams.page === i + 1
                              ? 'z-10 bg-indigo-50 dark:bg-indigo-900 border-indigo-500 dark:border-indigo-500 text-indigo-600 dark:text-indigo-200'
                              : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}

                      <button
                        onClick={() => handlePageChange(searchParams.page + 1)}
                        disabled={searchParams.page >= totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium ${
                          searchParams.page >= totalPages
                            ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                            : 'text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Tool details modal */}
        {selectedToolId && (
          <ToolDetailsModal toolId={selectedToolId} onClose={() => setSelectedToolId(null)} />
        )}
      </DashboardLayout>
    </>
  );
};

export default ToolsPage;
