const AuditLog = require('../models/AuditLog');

const logAudit = async ({
  actorId,
  action,
  entityType,
  entityId,
  before = null,
  after = null,
  metadata = {},
}) => {
  try {
    const log = await AuditLog.create({
      actorId,
      action,
      entityType,
      entityId,
      before,
      after,
      metadata,
    });
    return log;
  } catch (err) {
    console.error('[AuditService] Failed to record audit log:', err.message);
    return null;
  }
};

module.exports = { logAudit };
