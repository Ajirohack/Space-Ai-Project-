import React from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/DashboardLayout';
import KnowledgeBaseManager from '@/components/knowledgeBase/KnowledgeBaseManager';

const KnowledgeBasePage = () => {
  return (
    <>
      <Head>
        <title>Knowledge Base | Nexus Control Center</title>
      </Head>
      <DashboardLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Knowledge Base Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Upload documents and manage the RAG system knowledge base
          </p>
        </div>

        <KnowledgeBaseManager />
      </DashboardLayout>
    </>
  );
};

export default KnowledgeBasePage;
