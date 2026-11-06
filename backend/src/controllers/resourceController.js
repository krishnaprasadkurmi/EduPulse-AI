const LearningResource = require('../models/LearningResource');
const Subject = require('../models/Subject');
const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const Professor = require('../models/Professor');
const storageAdapter = require('../services/storageAdapter');
const { sendResourceUpdate } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');

/**
 * Helper to determine accessible subject IDs for the calling user
 */
const getAccessibleSubjectIds = async (user) => {
  if (user.role === 'admin') {
    const all = await Subject.find({}, '_id');
    return all.map((s) => s._id);
  }

  if (user.role === 'professor') {
    const prof = await Professor.findOne({ userId: user._id });
    return prof?.assignedSubjectIds || [];
  }

  if (user.role === 'student') {
    const student = await Student.findOne({ userId: user._id });
    if (!student) return [];
    const enrollments = await Enrollment.find({ studentId: student._id });
    return enrollments.map((e) => e.subjectId);
  }

  return [];
};

// @desc Get learning resources with filters, search, and sorting
// @route GET /api/resources
exports.getResources = async (req, res) => {
  try {
    const { search, type, subjectId, sort = 'newest' } = req.query;
    const allowedSubjectIds = await getAccessibleSubjectIds(req.user);

    const query = {
      subjectId: { $in: allowedSubjectIds },
    };

    // If student, only visible resources
    if (req.user.role === 'student') {
      query.visibleToStudents = true;
    }

    // Specific subject filter
    if (subjectId) {
      if (!allowedSubjectIds.some((id) => id.toString() === subjectId.toString())) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not enrolled in or assigned to this subject.',
        });
      }
      query.subjectId = subjectId;
    }

    // Type filter
    if (type && type !== 'All') {
      query.type = type;
    }

    // Search by title or description
    if (search && search.trim()) {
      query.$or = [
        { title: new RegExp(search.trim(), 'i') },
        { description: new RegExp(search.trim(), 'i') },
      ];
    }

    const sortOption = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    const resources = await LearningResource.find(query)
      .populate('subjectId', 'name code department semester')
      .populate('uploadedBy', 'name email role')
      .sort(sortOption);

    res.json({
      success: true,
      count: resources.length,
      resources,
    });
  } catch (err) {
    console.error('[ResourceController] getResources error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching resources' });
  }
};

// @desc Get single learning resource by ID
// @route GET /api/resources/:id
exports.getResourceById = async (req, res) => {
  try {
    const resource = await LearningResource.findById(req.params.id)
      .populate('subjectId', 'name code department semester')
      .populate('uploadedBy', 'name email role');

    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    const allowedSubjectIds = await getAccessibleSubjectIds(req.user);
    const hasAccess = allowedSubjectIds.some(
      (id) => id.toString() === resource.subjectId._id.toString()
    );

    if (!hasAccess && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied to this subject resource' });
    }

    res.json({ success: true, resource });
  } catch (err) {
    console.error('[ResourceController] getResourceById error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching resource' });
  }
};

// @desc Get resources for a specific subject
// @route GET /api/resources/subject/:subjectId
exports.getResourcesBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const allowedSubjectIds = await getAccessibleSubjectIds(req.user);

    const hasAccess = allowedSubjectIds.some((id) => id.toString() === subjectId.toString());
    if (!hasAccess && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to view resources for this subject.',
      });
    }

    const query = { subjectId };
    if (req.user.role === 'student') {
      query.visibleToStudents = true;
    }

    const resources = await LearningResource.find(query)
      .populate('subjectId', 'name code department semester')
      .populate('uploadedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: resources.length, resources });
  } catch (err) {
    console.error('[ResourceController] getResourcesBySubject error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching subject resources' });
  }
};

// @desc Create / Upload a new learning resource
// @route POST /api/resources
exports.createResource = async (req, res) => {
  try {
    const {
      title,
      description,
      subjectId,
      type = 'Notes',
      externalUrl,
      fileData, // optional { originalName, base64Content, mimeType }
      visibleToStudents = true,
    } = req.body;

    if (!title || !subjectId) {
      return res.status(400).json({
        success: false,
        message: 'Title and subjectId are required.',
      });
    }

    // Role verification: Professor can only upload to assigned subjects
    if (req.user.role === 'professor') {
      const prof = await Professor.findOne({ userId: req.user._id });
      const isAssigned = prof?.assignedSubjectIds.some(
        (id) => id.toString() === subjectId.toString()
      );
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only upload resources to your assigned subjects.',
        });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only professors and admins can upload learning resources.',
      });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    let fileUrl = '';
    let fileSize = '';
    let fileType = '';

    // Handle file upload via StorageAdapter
    if (fileData && fileData.base64Content) {
      const saved = await storageAdapter.saveFile(fileData);
      fileUrl = saved.fileUrl;
      fileSize = saved.fileSize;
      fileType = saved.fileType;
    }

    const resource = await LearningResource.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      subjectId,
      type,
      fileUrl,
      externalUrl: externalUrl ? externalUrl.trim() : '',
      fileSize,
      fileType,
      uploadedBy: req.user._id,
      visibleToStudents: visibleToStudents !== undefined ? visibleToStudents : true,
    });

    // Notify enrolled students if visible
    if (resource.visibleToStudents) {
      const enrollments = await Enrollment.find({ subjectId }).populate({
        path: 'studentId',
        populate: { path: 'userId' },
      });

      for (const e of enrollments) {
        const studentUser = e.studentId?.userId;
        if (studentUser) {
          sendResourceUpdate({
            userId: studentUser._id,
            title: resource.title,
            subjectName: subject.name,
            type: resource.type,
            uploaderName: req.user.name,
          }).catch((err) =>
            console.warn('[ResourceController] Notification dispatch failed:', err.message)
          );
        }
      }
    }

    // Security Audit Log
    await logAudit({
      actorId: req.user._id,
      action: 'CREATE_RESOURCE',
      entityType: 'LearningResource',
      entityId: resource._id,
      after: resource.toObject(),
      metadata: { subjectCode: subject.code, type: resource.type },
    });

    const populated = await LearningResource.findById(resource._id)
      .populate('subjectId', 'name code department semester')
      .populate('uploadedBy', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Learning resource uploaded successfully!',
      resource: populated,
    });
  } catch (err) {
    console.error('[ResourceController] createResource error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error creating resource' });
  }
};

// @desc Update a learning resource
// @route PUT /api/resources/:id
exports.updateResource = async (req, res) => {
  try {
    const resource = await LearningResource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    // Role check: Admin or resource owner
    if (req.user.role !== 'admin' && resource.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only edit resources that you uploaded.',
      });
    }

    const {
      title,
      description,
      type,
      externalUrl,
      fileData,
      visibleToStudents,
    } = req.body;

    const beforeState = resource.toObject();

    if (title && title.trim()) resource.title = title.trim();
    if (description !== undefined) resource.description = description.trim();
    if (type) resource.type = type;
    if (externalUrl !== undefined) resource.externalUrl = externalUrl.trim();
    if (visibleToStudents !== undefined) resource.visibleToStudents = visibleToStudents;

    // If new file provided, save and update
    if (fileData && fileData.base64Content) {
      if (resource.fileUrl) {
        await storageAdapter.deleteFile(resource.fileUrl);
      }
      const saved = await storageAdapter.saveFile(fileData);
      resource.fileUrl = saved.fileUrl;
      resource.fileSize = saved.fileSize;
      resource.fileType = saved.fileType;
    }

    await resource.save();

    await logAudit({
      actorId: req.user._id,
      action: 'UPDATE_RESOURCE',
      entityType: 'LearningResource',
      entityId: resource._id,
      before: beforeState,
      after: resource.toObject(),
    });

    const populated = await LearningResource.findById(resource._id)
      .populate('subjectId', 'name code department semester')
      .populate('uploadedBy', 'name email role');

    res.json({
      success: true,
      message: 'Resource updated successfully!',
      resource: populated,
    });
  } catch (err) {
    console.error('[ResourceController] updateResource error:', err);
    res.status(500).json({ success: false, message: 'Server error updating resource' });
  }
};

// @desc Delete a learning resource
// @route DELETE /api/resources/:id
exports.deleteResource = async (req, res) => {
  try {
    const resource = await LearningResource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    // Role check: Admin or resource owner
    if (req.user.role !== 'admin' && resource.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only delete resources that you uploaded.',
      });
    }

    // Remove file from disk
    if (resource.fileUrl) {
      await storageAdapter.deleteFile(resource.fileUrl);
    }

    const beforeState = resource.toObject();
    await resource.deleteOne();

    await logAudit({
      actorId: req.user._id,
      action: 'DELETE_RESOURCE',
      entityType: 'LearningResource',
      entityId: resource._id,
      before: beforeState,
    });

    res.json({
      success: true,
      message: 'Learning resource deleted successfully.',
    });
  } catch (err) {
    console.error('[ResourceController] deleteResource error:', err);
    res.status(500).json({ success: false, message: 'Server error deleting resource' });
  }
};

// @desc Get statistics for resources (Admin & faculty)
// @route GET /api/resources/stats
exports.getResourceStats = async (req, res) => {
  try {
    const totalCount = await LearningResource.countDocuments();
    const byType = await LearningResource.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);
    const bySubject = await LearningResource.aggregate([
      {
        $group: {
          _id: '$subjectId',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'subjects',
          localField: '_id',
          foreignField: '_id',
          as: 'subject',
        },
      },
      { $unwind: '$subject' },
      {
        $project: {
          subjectName: '$subject.name',
          subjectCode: '$subject.code',
          count: 1,
        },
      },
    ]);

    res.json({
      success: true,
      stats: {
        totalCount,
        byType,
        bySubject,
      },
    });
  } catch (err) {
    console.error('[ResourceController] getResourceStats error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching stats' });
  }
};
