import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Database, Table, RefreshCw, CheckCircle2, Search, ExternalLink, HardDrive, Eye } from 'lucide-react';

export default function DatabaseExplorer() {
  const [dbInfo, setDbInfo] = useState(null);
  const [collections, setCollections] = useState([]);
  const [activeCollection, setActiveCollection] = useState('users');
  const [collectionDocs, setCollectionDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [docsLoading, setDocsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/collections');
      if (res.data?.success) {
        setDbInfo({
          database: res.data.database,
          uri: res.data.uri,
          status: res.data.connectionStatus,
        });
        setCollections(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching collections:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollectionData = async (collName) => {
    try {
      setDocsLoading(true);
      setActiveCollection(collName);
      const res = await api.get(`/admin/collections/${collName}?limit=50`);
      if (res.data?.success) {
        setCollectionDocs(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching collection data:', err);
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    if (activeCollection) {
      fetchCollectionData(activeCollection);
    }
  }, [activeCollection]);

  const filteredDocs = collectionDocs.filter((doc) =>
    JSON.stringify(doc).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2 border border-emerald-500/30">
            <Database className="w-3.5 h-3.5 text-emerald-400" /> Live MongoDB Database Explorer
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Database Collections & Storage</h1>
          <p className="text-xs text-slate-300 mt-1">
            Real-time inspection of your live MongoDB database collections and documents.
          </p>
        </div>

        <button
          onClick={() => {
            fetchCollections();
            if (activeCollection) fetchCollectionData(activeCollection);
          }}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 border border-slate-600 transition-colors shadow-sm cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${loading || docsLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Database</span>
        </button>
      </div>

      {/* Connection Status Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              Connection Status
            </div>
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>CONNECTED (Live)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              Active Database
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
              {dbInfo?.database || 'edupulse'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              Connection URI
            </div>
            <div className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate max-w-xs font-medium">
              {dbInfo?.uri || 'mongodb://127.0.0.1:27017/edupulse'}
            </div>
          </div>
        </div>
      </div>

      {/* Collections Grid & Document Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Collections List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider px-1">
            Collections in Database ({collections.length})
          </div>

          <div className="space-y-1.5">
            {collections.map((c) => {
              const isActive = c.name === activeCollection;

              return (
                <button
                  key={c.name}
                  onClick={() => fetchCollectionData(c.name)}
                  className={`w-full p-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-between border text-left cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-500 dark:text-indigo-200 shadow-sm ring-1 ring-indigo-500/20'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800/60 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Table className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`} />
                    <span className="font-mono font-medium">{c.name}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold border ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/80 dark:text-indigo-200 dark:border-indigo-700'
                        : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800'
                    }`}
                  >
                    {c.count} records
                  </span>
                </button>
              );
            })}
          </div>

          {/* Compass Help Card */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-indigo-500/20 shadow-sm text-xs space-y-2 mt-4">
            <div className="font-bold text-indigo-600 dark:text-indigo-300 flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>MongoDB Compass GUI</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              To open this database in MongoDB Compass, use connection string:
            </p>
            <div className="p-2 rounded bg-slate-100 dark:bg-slate-950 font-mono text-[11px] text-slate-900 dark:text-slate-200 border border-slate-200 dark:border-slate-800 select-all font-semibold">
              mongodb://127.0.0.1:27017
            </div>
          </div>
        </div>

        {/* Documents Viewer (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-500/30">
                  db.{activeCollection}
                </span>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Showing latest {filteredDocs.length} documents
                </span>
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={`Search in ${activeCollection}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono transition-colors"
              />
            </div>
          </div>

          {docsLoading ? (
            <div className="py-12 text-center text-slate-600 dark:text-slate-400 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 animate-spin mr-2 text-indigo-600 dark:text-indigo-400" />
              <span>Querying documents from MongoDB collection...</span>
            </div>
          ) : filteredDocs.length > 0 ? (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {filteredDocs.map((doc, idx) => (
                <div
                  key={doc._id || idx}
                  className="rounded-xl overflow-hidden border border-slate-800 bg-[#0d1117] text-xs font-mono shadow-sm"
                >
                  {/* Terminal Header */}
                  <div className="flex items-center justify-between px-3.5 py-2 bg-[#161b22] border-b border-slate-800 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                      <span className="text-amber-300 font-bold ml-1.5 font-mono">
                        _id: "{doc._id}"
                      </span>
                    </div>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {doc.createdAt
                        ? new Date(doc.createdAt).toLocaleString()
                        : doc.updatedAt
                        ? new Date(doc.updatedAt).toLocaleString()
                        : `#${idx + 1}`}
                    </span>
                  </div>

                  {/* Code Body */}
                  <div className="p-3.5 overflow-x-auto bg-[#0d1117]">
                    <pre className="!text-emerald-300 font-mono text-[11px] leading-relaxed selection:bg-indigo-900 selection:text-white">
                      {JSON.stringify(doc, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              No matching documents found in collection "{activeCollection}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
