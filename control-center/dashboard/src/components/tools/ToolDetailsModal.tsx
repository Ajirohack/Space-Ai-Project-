import React, { useState, useEffect } from 'react';
import { X, ChevronRight, Tag, CheckCircle } from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  tags: string[];
  capabilities: string[];
  dependencies?: Record<string, string>;
}

interface ToolDetailsModalProps {
  toolId: string | null;
  onClose: () => void;
}

const ToolDetailsModal: React.FC<ToolDetailsModalProps> = ({ toolId, onClose }) => {
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Tool[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  useEffect(() => {
    const fetchToolDetails = async () => {
      if (!toolId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/tools/${toolId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch tool details');
        }

        const data = await response.json();
        setTool(data.tool);

        // Fetch recommendations
        setLoadingRecommendations(true);
        const recommendationsResponse = await fetch(`/api/tools/recommendations/${toolId}?limit=3`);

        if (recommendationsResponse.ok) {
          const recommendationsData = await recommendationsResponse.json();
          setRecommendations(recommendationsData.tools || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
        setLoadingRecommendations(false);
      }
    };

    fetchToolDetails();
  }, [toolId]);

  if (!toolId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
            {loading ? 'Loading...' : tool?.name || 'Tool Details'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal content */}
        <div className="overflow-y-auto p-6 max-h-[calc(90vh-160px)]">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-8">{error}</div>
          ) : tool ? (
            <div className="space-y-6">
              {/* Basic details */}
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">ID</div>
                <div className="font-mono text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded">
                  {tool.id}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Description</div>
                <p className="text-gray-800 dark:text-gray-200">{tool.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Version</div>
                  <p className="text-gray-800 dark:text-gray-200">{tool.version}</p>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Author</div>
                  <p className="text-gray-800 dark:text-gray-200">{tool.author}</p>
                </div>
              </div>

              {/* Tags */}
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Tags</div>
                <div className="flex flex-wrap gap-2">
                  {tool.tags?.length > 0 ? (
                    tool.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400 text-sm">No tags</span>
                  )}
                </div>
              </div>

              {/* Capabilities */}
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Capabilities</div>
                <div className="space-y-2">
                  {tool.capabilities?.length > 0 ? (
                    tool.capabilities.map(capability => (
                      <div
                        key={capability}
                        className="flex items-center text-sm text-gray-800 dark:text-gray-200"
                      >
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        {capability}
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      No capabilities listed
                    </span>
                  )}
                </div>
              </div>

              {/* Dependencies */}
              {tool.dependencies && Object.keys(tool.dependencies).length > 0 && (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Dependencies</div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3">
                    {Object.entries(tool.dependencies).map(([name, version]) => (
                      <div key={name} className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">{name}</span>
                        <span className="text-gray-600 dark:text-gray-400">{version}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Recommended Tools
                </div>
                {loadingRecommendations ? (
                  <div className="flex justify-center py-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                ) : recommendations.length > 0 ? (
                  <div className="space-y-2">
                    {recommendations.map(rec => (
                      <div
                        key={rec.id}
                        className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition"
                        onClick={() => {
                          onClose();
                          // This would need to be implemented to display the new tool
                          window.location.href = `/dashboard/tools/${rec.id}`;
                        }}
                      >
                        <div>
                          <div className="font-medium text-gray-800 dark:text-gray-200">
                            {rec.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {rec.description.substring(0, 60)}...
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400 text-sm">
                    No recommendations available
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">Tool not found</div>
          )}
        </div>

        {/* Modal footer */}
        {!loading && !error && tool && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end">
            <button
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolDetailsModal;
