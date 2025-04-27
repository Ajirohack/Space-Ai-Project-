import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button, Input, TextArea } from '@/components/ui';
import { Upload, Search, Database } from 'lucide-react';
import axios from '@/lib/axios';

interface KnowledgeBaseStats {
  documentCount: number;
  vectorCount: number;
  lastUpdated: string | null;
}

export default function KnowledgeBaseManager() {
  const [file, setFile] = useState<File | null>(null);
  const [stats, setStats] = useState<KnowledgeBaseStats | null>(null);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/modules/rag-system/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFile(file);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('document', file);

    try {
      await axios.post('/api/modules/rag-system/documents', formData);
      setFile(null);
      fetchStats();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);

    try {
      const response = await axios.post('/api/modules/rag-system/query', { query });
      setSearchResults(response.data.documents);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Knowledge Base Statistics</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded">
              <p className="text-sm text-gray-600 dark:text-gray-400">Documents</p>
              <p className="text-2xl font-bold">{stats?.documentCount || 0}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded">
              <p className="text-sm text-gray-600 dark:text-gray-400">Vectors</p>
              <p className="text-2xl font-bold">{stats?.vectorCount || 0}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded">
              <p className="text-sm text-gray-600 dark:text-gray-400">Last Updated</p>
              <p className="text-md">
                {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : 'Never'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
          <div className="space-y-4">
            <Input type="file" onChange={handleFileUpload} accept=".txt,.md,.pdf" />
            <Button onClick={handleUpload} disabled={!file || loading} className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              {loading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Search Knowledge Base</h2>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter your query..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              <Button onClick={handleSearch} disabled={!query.trim() || loading}>
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Results</h3>
                <div className="space-y-3">
                  {searchResults.map((result, i) => (
                    <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Score: {(result.score * 100).toFixed(1)}%
                      </p>
                      <p>{result.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
