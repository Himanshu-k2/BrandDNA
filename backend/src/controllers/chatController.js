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
      context: {
        role: typeof context.role === 'string' ? context.role.slice(0, 30) : 'creator',
        personaName: typeof context.personaName === 'string' ? context.personaName.slice(0, 100) : 'Team Member',
        personaEmail: typeof context.personaEmail === 'string' ? context.personaEmail.slice(0, 100) : 'user@branddna.com',
        pathname: typeof context.pathname === 'string' ? context.pathname.slice(0, 200) : '/dashboard',
        workspaceId: typeof context.workspaceId === 'string' ? context.workspaceId.slice(0, 100) : 'novafit',
      },
      history: Array.isArray(history) ? history.slice(-20) : [],
    });

    return res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    next(error);
  }
};
