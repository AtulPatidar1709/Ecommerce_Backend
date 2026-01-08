import { Router } from 'express';
import { processAiMessage } from './botService';
import checkAuth from '../middlewares/authMiddleware';
import { Types } from 'mongoose';
import { Session } from '../session/sessionModels';

const botRouter = Router();

export default function (io: any) {
  // SOCKET LOGIC
  io.on('connection', (socket: any) => {
    socket.on('sendMessage', async (msg: string) => {
      try {
        // 1. Get the session ID from signed cookies
        const sid = socket.request.signedCookies?.sid;
        
        let userId = null;

        // 2. Validate the sid and find the session in the DB
        if (sid && Types.ObjectId.isValid(sid)) {
          const session = await Session.findOne({ _id: sid });
          
          // 3. Extract the userId from the session document
          if (session && session.userId) {
            userId = session.userId;
          }
        }

        if(!userId) {
          userId = null; // Guest user
        }
        
        // 4. Pass the actual userId (or null for Guest) to processAiMessage
        const reply = await processAiMessage(userId!, msg);
        
        socket.emit('receiveMessage', reply);
      } catch (err) {
        console.error("Socket AI Error:", err);
        socket.emit('receiveMessage', "I'm having trouble connecting. Please try again.");
      }
    });
  });

  // HTTP LOGIC (REST Fallback)
  botRouter.post('/', async (req: any, res, next) => {
    try {
      const userId = req.user?._id || null;
      const reply = await processAiMessage(userId, req.body.message);
      res.json({ reply });
    } catch (err) {
      next(err);
    }
  });

  return botRouter;
}
