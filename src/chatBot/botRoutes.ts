import { Router } from 'express';
import { processAiMessage } from './botService';
import checkAuth from '../middlewares/authMiddleware';

const botRouter = Router();

export default function (io: any) {
  // SOCKET LOGIC
  io.on('connection', (socket: any) => {
    socket.on('sendMessage', async (msg: string) => {
      try {
        const reply = await processAiMessage(socket.userId, msg);
        socket.emit('receiveMessage', reply);
      } catch (err) {
        console.error("Socket AI Error:", err);
        socket.emit('receiveMessage', "I'm having trouble connecting. Please try again.");
      }
    });
  });

  // HTTP LOGIC (REST Fallback)
  botRouter.post('/', checkAuth, async (req: any, res, next) => {
    try {
      const reply = await processAiMessage(req.user._id, req.body.message);
      res.json({ reply });
    } catch (err) {
      next(err);
    }
  });

  return botRouter;
}
