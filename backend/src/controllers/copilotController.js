const copilotService = require('../services/copilotService');

// @desc Process chat inquiry from Student or Faculty
// @route POST /api/copilot/chat
exports.chat = async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required',
      });
    }

    const result = await copilotService.processChat({
      user: req.user,
      message,
      conversationId,
    });

    res.json({
      success: true,
      reply: result.reply,
      data: result.data || null,
      tool: result.tool || null,
      requiresConfirmation: result.requiresConfirmation || false,
      action: result.action || null,
      error: result.error || null,
    });
  } catch (err) {
    console.error('[CopilotController] Chat processing error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Internal error processing Copilot query',
    });
  }
};

// @desc Confirm or Cancel a pending write action (mark update, attendance)
// @route POST /api/copilot/confirm
exports.confirm = async (req, res) => {
  try {
    const { actionId, confirmed } = req.body;

    if (!actionId) {
      return res.status(400).json({
        success: false,
        message: 'actionId is required to confirm or cancel an operation',
      });
    }

    const result = await copilotService.confirmAction({
      user: req.user,
      actionId,
      confirmed: Boolean(confirmed),
    });

    if (!result.success && result.message) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.json(result);
  } catch (err) {
    console.error('[CopilotController] Confirmation error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Internal error confirming action',
    });
  }
};
