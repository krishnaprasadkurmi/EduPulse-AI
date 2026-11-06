import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { resourceApi } from '../../api/resourceApi';
import { subjectApi } from '../../api/subjectApi';
import {
  BookOpen,
  FileText,
  Download,
  ExternalLink,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  Calendar,
  User,
  Sparkles,
  BarChart2,
  Layers,
  CheckCircle,
  AlertCircle,
  FileCode,
  Link as LinkIcon,
  Video,
  FileSpreadsheet,
  X,
  Upload,
} from 'lucide-react';

const RESOURCE_TYPES = [
  'All',
  'Notes',
  'PDF',
  'Lecture Material',
  'Reference Link',
  'Assignment Material',
  'Other',
];

export default function LearningResources() {
  const { user } = useAuth();

  const [resources, setResources] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // Upload / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    type: 'Notes',
    externalUrl: '',
    visibleToStudents: true,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileBase64, setFileBase64] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [resData, subData] = await Promise.all([
        resourceApi.getResources({
          search: searchQuery,
          type: selectedType,
          subjectId: selectedSubject !== 'All' ? selectedSubject : undefined,
          sort: sortBy,
        }),
        subjectApi.getAllSubjects().catch(() => ({ subjects: [] })),
      ]);

      setResources(resData.resources || []);
      setSubjects(subData.subjects || []);

      if (user.role === 'admin' || user.role === 'professor') {
        const statsData = await resourceApi.getResourceStats().catch(() => null);
        if (statsData) setStats(statsData.stats);
      }
    } catch (err) {
      console.error('Error fetching learning resources:', err);
      setError('Unable to load learning resources. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedType, selectedSubject, sortBy]);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  // Handle File Input conversion to base64
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit: 15MB
    if (file.size > 15 * 1024 * 1024) {
      alert('File size exceeds the 15MB limit. Please upload a smaller file or provide an external URL.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Open Add / Edit Modal
  const openUploadModal = (resource = null) => {
    if (resource) {
      setEditingResource(resource);
      setFormData({
        title: resource.title || '',
        description: resource.description || '',
        subjectId: resource.subjectId?._id || resource.subjectId || '',
        type: resource.type || 'Notes',
        externalUrl: resource.externalUrl || '',
        visibleToStudents: resource.visibleToStudents !== undefined ? resource.visibleToStudents : true,
      });
    } else {
      setEditingResource(null);
      setFormData({
        title: '',
        description: '',
        subjectId: subjects[0]?._id || '',
        type: 'Notes',
        externalUrl: '',
        visibleToStudents: true,
      });
      setSelectedFile(null);
      setFileBase64('');
    }
    setIsModalOpen(true);
  };

  // Submit Modal
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.subjectId) {
      alert('Title and Subject are required.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
      };

      if (selectedFile && fileBase64) {
        payload.fileData = {
          originalName: selectedFile.name,
          base64Content: fileBase64,
          mimeType: selectedFile.type,
        };
      }

      if (editingResource) {
        await resourceApi.updateResource(editingResource._id, payload);
        setActionSuccess('Resource updated successfully!');
      } else {
        await resourceApi.createResource(payload);
        setActionSuccess('Resource uploaded & notified to enrolled students!');
      }

      setIsModalOpen(false);
      setTimeout(() => setActionSuccess(null), 4000);
      fetchData();
    } catch (err) {
      console.error('Error saving resource:', err);
      alert(err.response?.data?.message || 'Failed to save resource.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Resource
  const handleDeleteResource = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await resourceApi.deleteResource(id);
      setActionSuccess('Resource deleted.');
      setTimeout(() => setActionSuccess(null), 3000);
      fetchData();
    } catch (err) {
      console.error('Error deleting resource:', err);
      alert(err.response?.data?.message || 'Failed to delete resource.');
    }
  };

  // Helper for Type Icon
  const getTypeIcon = (type) => {
    switch (type) {
      case 'PDF':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'Lecture Material':
        return <Video className="w-5 h-5 text-purple-500" />;
      case 'Reference Link':
        return <ExternalLink className="w-5 h-5 text-blue-500" />;
      case 'Assignment Material':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
      default:
        return <BookOpen className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-indigo-900/60 via-purple-900/50 to-slate-900/80 border border-indigo-500/20 shadow-xl backdrop-blur relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Academic Knowledge Repository</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Learning Resources & Study Vault
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Subject-wise lecture notes, verified PDFs, syllabus materials, and recommended reference links.
            </p>
          </div>

          {(user.role === 'professor' || user.role === 'admin') && (
            <button
              onClick={() => openUploadModal()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Study Resource</span>
            </button>
          )}
        </div>

        {/* Stats Row (for Faculty & Admin) */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-indigo-500/20 text-slate-200">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-xs text-slate-400 block font-medium">Total Resources</span>
              <span className="text-xl font-bold text-white">{stats.totalCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-xs text-slate-400 block font-medium">Subjects Covered</span>
              <span className="text-xl font-bold text-indigo-300">{stats.bySubject?.length || 0}</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-xs text-slate-400 block font-medium">Resource Types</span>
              <span className="text-xl font-bold text-purple-300">{stats.byType?.length || 0}</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-xs text-slate-400 block font-medium">Access Control</span>
              <span className="text-xl font-bold text-emerald-300">RBAC Verified</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Success Alert */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center gap-3 text-sm font-semibold animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notes by title, topic, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Search
          </button>
        </form>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Subject Filter */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
            >
              <option value="All" className="dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Subjects</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id} className="dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
            <Filter className="w-3.5 h-3.5 text-indigo-500" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
            >
              {RESOURCE_TYPES.map((t) => (
                <option key={t} value={t} className="dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {t === 'All' ? 'All Types' : t}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
            <span className="text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer font-semibold"
            >
              <option value="newest" className="dark:bg-slate-900 text-slate-900 dark:text-slate-100">Newest First</option>
              <option value="oldest" className="dark:bg-slate-900 text-slate-900 dark:text-slate-100">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resource Grid / List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-3" />
          <span className="text-sm font-semibold">Loading verified learning materials...</span>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-center font-medium">
          {error}
        </div>
      ) : resources.length === 0 ? (
        <div className="py-16 px-6 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No resources found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            {searchQuery
              ? `No materials matched "${searchQuery}". Try adjusting your search query or filters.`
              : 'No study materials have been published yet for this selection.'}
          </p>
          {(user.role === 'professor' || user.role === 'admin') && (
            <button
              onClick={() => openUploadModal()}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-md"
            >
              Upload First Resource
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {resources.map((resource) => {
            const isUploader = resource.uploadedBy?._id === user.id || user.role === 'admin';
            const isNewBadge = resource.isNew;

            return (
              <div
                key={resource._id}
                className="group relative rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Header: Subject & Badges */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/40">
                        {getTypeIcon(resource.type)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                          {resource.subjectId?.code || 'Subject'}
                        </span>
                        <span className="text-[11px] text-slate-400 block line-clamp-1">
                          {resource.subjectId?.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isNewBadge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 animate-pulse">
                          ✨ New
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {resource.type}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                    {resource.title}
                  </h3>

                  {resource.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {resource.description}
                    </p>
                  )}
                </div>

                {/* Metadata & Actions */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[120px]">{resource.uploadedBy?.name || 'Faculty'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    {/* Primary Action (Download or Open URL) */}
                    {resource.fileUrl ? (
                      <a
                        href={resource.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all border border-indigo-200 dark:border-indigo-800/60"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download ({resource.fileSize || 'PDF/Doc'})</span>
                      </a>
                    ) : resource.externalUrl ? (
                      <a
                        href={resource.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold transition-all border border-blue-200 dark:border-blue-800/60"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Reference Link</span>
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Reference Material</span>
                    )}

                    {/* Faculty/Admin Management buttons */}
                    {isUploader && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openUploadModal(resource)}
                          title="Edit Resource"
                          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-400 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteResource(resource._id, resource.title)}
                          title="Delete Resource"
                          className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {editingResource ? 'Edit Learning Resource' : 'Upload Study Material'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Share syllabus notes, lecture slides, or references.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleModalSubmit} className="p-5 space-y-4 overflow-y-auto">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Resource Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit 3: Normalization & BCNF Notes"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              {/* Subject & Category Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Subject *
                  </label>
                  <select
                    required
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    <option value="" disabled>Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Resource Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    {RESOURCE_TYPES.filter((t) => t !== 'All').map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Topic Coverage
                </label>
                <textarea
                  rows="2"
                  placeholder="Key concepts covered, preparation guidelines, or textbook chapters..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              {/* File Upload Option */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Upload Document / PDF (Max 15MB)
                </label>
                <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 text-center">
                  <input
                    type="file"
                    id="resource-file-input"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="resource-file-input"
                    className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose File</span>
                  </label>
                  <p className="text-[11px] text-slate-400 mt-2 truncate">
                    {selectedFile ? `Selected: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)` : 'Supports PDF, Word, PPTX, or Code files'}
                  </p>
                </div>
              </div>

              {/* External Reference Link Option */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Or External Reference URL
                </label>
                <input
                  type="url"
                  placeholder="https://geeksforgeeks.org/dbms-bcnf or Drive link"
                  value={formData.externalUrl}
                  onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              {/* Visibility Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Publish to Student Portal
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Immediately notify enrolled students on release.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.visibleToStudents}
                  onChange={(e) => setFormData({ ...formData, visibleToStudents: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all"
                >
                  {submitting && <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                  <span>{editingResource ? 'Save Changes' : 'Upload Resource'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
