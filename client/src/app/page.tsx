'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, AlertCircle, Info, AlertTriangle, Bug, RefreshCw, Calendar, Terminal } from 'lucide-react';

// Types
type LogLevel = 'ALL' | 'INFO' | 'ERROR' | 'WARN' | 'DEBUG';

interface Log {
  id: number;
  level: string;
  message: string;
  service: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface FilterParams {
  level: LogLevel;
  search: string;
  startDate: string;
  endDate: string;
}

export default function SysPulseDashboard() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState<FilterParams>({
    level: 'ALL',
    search: '',
    startDate: '',
    endDate: ''
  });

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
    setLastRefresh(new Date());
  }, []);

  // Fetch logs from backend
  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      
      if (filters.level !== 'ALL') {
        params.append('level', filters.level);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      params.append('limit', '50');

      const url = `${API_BASE_URL}/logs?${params.toString()}`;
      setDebugInfo(`Fetching: ${url}`);
      
      console.log('Fetching logs from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors', // Explicitly set CORS mode
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Received data:', data);
      console.log('Number of logs:', data.length);
      
      setLogs(Array.isArray(data) ? data : []);
      setError(null);
      setLastRefresh(new Date());
      setDebugInfo(`✓ Success: Loaded ${data.length} logs`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch logs';
      console.error('Fetch error:', err);
      setError(errorMessage);
      setDebugInfo(`✗ Error: ${errorMessage}`);
      
      // Don't clear logs on error - keep showing last successful fetch
    } finally {
      setLoading(false);
    }
  }, [filters.level, filters.search]);

  // Auto-refresh every 3 seconds
  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.level !== 'ALL') params.set('level', filters.level);
    if (filters.search) params.set('search', filters.search);
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [filters]);

  // Load filters from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFilters({
      level: (params.get('level') as LogLevel) || 'ALL',
      search: params.get('search') || '',
      startDate: params.get('startDate') || '',
      endDate: params.get('endDate') || ''
    });
  }, []);

  const updateFilter = (key: keyof FilterParams, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getLevelIcon = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR':
        return <AlertCircle className="w-4 h-4" />;
      case 'WARN':
        return <AlertTriangle className="w-4 h-4" />;
      case 'INFO':
        return <Info className="w-4 h-4" />;
      case 'DEBUG':
        return <Bug className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'WARN':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'INFO':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'DEBUG':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const filteredLogs = logs.filter(log => {
    if (filters.search && !log.message.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Test connection button
  const testConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/logs?limit=1`);
      
      const data = await response.json();
      alert(`✓ Connection successful!\nReceived ${Array.isArray(data) ? data.length : 0} logs`);
      console.log('Test response:', data);
    } catch (err) {
      alert(`✗ Connection failed!\n${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Test error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-white" />
              </div>
              SysPulse
            </h1>
            <p className="text-sm text-slate-400 mt-1">Real-Time System Monitoring Dashboard</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Last refresh</div>
            <div className="text-sm font-medium text-slate-300">
              {mounted && lastRefresh ? lastRefresh.toLocaleTimeString() : '--:--:--'}
            </div>
            <button
              onClick={testConnection}
              className="mt-2 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-md transition-colors"
            >
              Test Connection
            </button>
          </div>
        </div>
      </header>

      {/* Debug Info Bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-6 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs font-mono">
          <Terminal className="w-4 h-4 text-slate-500" />
          <span className="text-slate-500">Debug:</span>
          <span className={error ? 'text-red-400' : 'text-green-400'}>{debugInfo}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Level Filter */}
          <div>
            <label htmlFor="log-level" className="block text-xs font-medium text-slate-400 mb-2">Log Level</label>
            <select
              id="log-level"
              name="log-level"
              value={filters.level}
              onChange={(e) => updateFilter('level', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Levels</option>
              <option value="ERROR">Error</option>
              <option value="WARN">Warning</option>
              <option value="INFO">Info</option>
              <option value="DEBUG">Debug</option>
            </select>
          </div>

          {/* Search Filter */}
          <div>
            <label htmlFor="search-message" className="block text-xs font-medium text-slate-400 mb-2">Search Message</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" aria-hidden="true" />
              <input
                id="search-message"
                name="search-message"
                type="text"
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                placeholder="Search logs..."
                className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="start-date" className="block text-xs font-medium text-slate-400 mb-2">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" aria-hidden="true" />
              <input
                id="start-date"
                name="start-date"
                type="date"
                value={filters.startDate}
                onChange={(e) => updateFilter('startDate', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* End Date */}
          <div>
            <label htmlFor="end-date" className="block text-xs font-medium text-slate-400 mb-2">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" aria-hidden="true" />
              <input
                id="end-date"
                name="end-date"
                type="date"
                value={filters.endDate}
                onChange={(e) => updateFilter('endDate', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="text-sm text-slate-400">Total Logs</div>
            <div className="text-2xl font-bold text-white mt-1">{filteredLogs.length}</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="text-sm text-slate-400">Errors</div>
            <div className="text-2xl font-bold text-red-400 mt-1">
              {filteredLogs.filter(l => l.level === 'ERROR').length}
            </div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="text-sm text-slate-400">Warnings</div>
            <div className="text-2xl font-bold text-yellow-400 mt-1">
              {filteredLogs.filter(l => l.level === 'WARN').length}
            </div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="text-sm text-slate-400">Info</div>
            <div className="text-2xl font-bold text-blue-400 mt-1">
              {filteredLogs.filter(l => l.level === 'INFO').length}
            </div>
          </div>
        </div>

        {/* Error State */}

        {error && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Service Temporarily Unavailable</span>
            </div>
            <div className="mt-3 text-sm text-amber-300/80 space-y-2">
              <p>
                The backend server is currently <strong>suspended</strong> to optimize resource usage on the free tier.
              </p>
              <p>
                If you are testing this project, please contact the developer to resume the service, or try again later.
              </p>
              <div className="mt-2 text-xs font-mono bg-amber-950/30 p-2 rounded text-amber-500">
                System Status: Offline / Sleeping 💤
              </div>
            </div>
          </div>
        )}
        {/* Loading State */}
        {loading && logs.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-12 text-center border border-slate-700">
            <RefreshCw className="w-12 h-12 text-slate-400 mx-auto mb-4 animate-spin" />
            <p className="text-slate-400">Connecting to backend...</p>
            <p className="text-sm text-slate-500 mt-2">curl {API_BASE_URL}/logs</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          /* Empty State */
          <div className="bg-slate-800 rounded-lg p-12 text-center border border-slate-700">
            <Search className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">No logs found</h3>
            <p className="text-slate-400">
              {logs.length === 0 
                ? 'Waiting for logs from backend...' 
                : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          /* Log Table */
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-700/50 border-b border-slate-700">
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Metadata
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getLevelColor(log.level)}`}>
                          {getLevelIcon(log.level)}
                          {log.level}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-200 max-w-md">
                        {log.message}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300 font-mono">
                        {log.service}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400 whitespace-nowrap">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                        {log.metadata ? JSON.stringify(log.metadata) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-4 mt-8 text-center text-sm text-slate-500">
        <div className="flex items-center justify-center gap-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${error ? 'bg-red-500' : 'bg-green-500'}`}></div>
          {error ? 'Connection lost - Retrying...' : 'Auto-refreshing every 3 seconds'}
        </div>
      </footer>
    </div>
  );
}