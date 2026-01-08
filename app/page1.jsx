'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/verify', {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || 'KASU_ESP32_SECRET_KEY_2024'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading KASU Sync Dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">KASU Sync Dashboard</h1>
          <p className="text-gray-600">Real-time transaction synchronization backend</p>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm mt-2 ${
            stats.status === 'operational' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {stats.status === 'operational' ? '🟢 Operational' : '🔴 Degraded'}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700">Total Users</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.stats.users}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700">Total Transactions</h3>
            <p className="text-3xl font-bold text-green-600">{stats.stats.transactions}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700">Pending Syncs</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.stats.pending_syncs}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700">Failed Syncs</h3>
            <p className="text-3xl font-bold text-red-600">{stats.stats.failed_syncs}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {stats.recent_activity.map((tx, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{tx.tx_id.substring(0, 12)}...</span>
                  <span className="ml-2 text-sm text-gray-500">{tx.type}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    tx.status === 'completed' ? 'bg-green-100 text-green-800' : 
                    tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {tx.status}
                  </span>
                  <span className="font-bold">₹{tx.amount}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(tx.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">API Endpoints</h2>
          <div className="space-y-3">
            {stats.endpoints.map((endpoint, index) => (
              <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded">
                <div>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium mr-3 ${
                    endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' : 
                    'bg-green-100 text-green-800'
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className="text-sm">{endpoint.path}</code>
                </div>
                <div className="text-sm text-gray-500">{endpoint.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Last updated: {new Date(stats.timestamp).toLocaleString()}</p>
          <p className="mt-2">KASU Sync Backend v1.0.0</p>
        </div>
      </div>
    </div>
  );
}