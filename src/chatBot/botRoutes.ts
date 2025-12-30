import { Router } from 'express';
import { buildContext, callTool, postBotMessage } from './botController';
import Chat from './ChatModel';
import openai from '../utils/openaiClient';
import checkAuth from '../middlewares/authMiddleware';
import { config } from '../config/config';

const botRouter = Router();

export default function (io: any) {
  /* ========  SOCKET PART STAYS HERE  ======== */
  console.log("Socket io BotRoute " , io);
  io.on('connection', (socket: any) => {
    socket.on('sendMessage', async (msg: string) => {
      const userId = socket.userId;
      console.log("Socket io in route userId " , userId);

      await Chat.create({ user: userId, role: 'user', content: msg });

      const context = await buildContext(userId);

      console.log("My context message is ", context);

      const history = await Chat.find({ user: userId }).sort({ createdAt: 1 }).limit(10);

      const messages = [
        {
          role: 'system',
          content: `You are ShopBot, a friendly ecommerce assistant.
            Context: ${context}
            If you need live data return <tool>toolName(arg)</tool> and nothing else.`,
                },
                ...history.map((h: any) => ({ role: h.role, content: h.content })),
                { role: 'user', content: msg },
              ];

          // const completion = await openai.chat.completions.create({
          //   model: 'gpt-4o-mini',
          //   messages,
          //   temperature: 0.3,
          // });

          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${config.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                  model: "openai/gpt-4o-mini",
                  messages: [
                    { role: "system", content: `You are ShopBot, a friendly ecommerce assistant.
                Context: ${context}
                If you need live data return <tool>toolName(arg)</tool> and nothing else.`,
                    },
                    ...history.map((h: any) => ({ role: h.role, content: h.content })),
                    { role: 'user', content: msg },
                  ],
                }),
          });

          const completion = await response.json();

          console.log("Completion Response is ", completion);

          let reply = completion.choices[0]?.message.content ?? '';

          console.log("Reply Response is ", reply);

          if (!response.ok) {
            throw new Error("OpenRouter API error");
          }
          // Tool parser
          const toolMatch = reply.match(/<tool>(\w+)\((.*?)\)<\/tool>/);
          if (toolMatch) {
            const [, tool, arg] = toolMatch as [string, string, string];
            const toolRes = await callTool(tool, arg);
            messages.push({ role: 'tool', content: toolRes });

            const Secondresponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${config.OPENAI_API_KEY}`,
              },
              body: JSON.stringify({
                model: "openai/gpt-4o-mini",
                messages: [
                  { role: "system", content: messages },
                  { role: "user", content: JSON.stringify(msg) },
                ],
              }),
            });

            const Secondcompletion = await Secondresponse.json();

            console.log("Completion Response is ", Secondcompletion);

            let reply = Secondcompletion.choices[0]?.message.content ?? '';

            console.log("Reply Response is ", reply);

            // const second = await openai.chat.completions.create({
            //   model: 'gpt-4o-mini',
            //   messages,
            //   temperature: 0.3,
            // });
            // reply = second.choices[0]?.message.content || '';
          }

          await Chat.create({ user: userId, role: 'assistant', content: reply });
          socket.emit('receiveMessage', reply);
    });
  });

  /* ========  HTTP PART NOW USES CONTROLLER  ======== */
  botRouter.post('/', checkAuth, postBotMessage); // <-- one-liner
  return botRouter;
}