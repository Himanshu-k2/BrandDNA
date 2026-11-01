import { generateBradReply } from '../services/bradAiService.js';

export const chatWithBrad = async (req, res, next) => {
  try {
    const { message, context = {}, history = [] } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A message string is required to chat with Brad.',
      });
    }

    const reply = await generateBradReply({
      message: message.trim(),
      context,
      history,
    });

    return res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    next(error);
  }
};
