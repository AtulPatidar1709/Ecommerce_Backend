import { Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';
import { Order } from '../orders/orderModel';
import { User } from '../user/userTypes';
import openai from '../utils/openaiClient';
import Chat from './ChatModel';
import { Types } from 'mongoose';

export async function buildContext(userId: Types.ObjectId) {
  const orders = await Order.find({ userId: userId })
    .populate('items.productId')
    .sort({ createdAt: -1 })
    .limit(3);

  const orderText = orders
    .map((o: any) => {
      const items = o.items.map((i: any) => i.productId.title).join(', ');
      return `Order ${o._id} (items: ${items}), payment=${o.payment_status}, shipping=${o.shipping_status}`;
    })
    .join('; ');

  const policy =
    'Return policy: 30-day free returns for unused items in original packaging. Refund within 5 days after we receive the item.';

  return `User's recent orders: ${orderText}. ${policy}`;
}

export async function callTool(toolName: string, arg: string) {
  if (toolName === 'getOrder') {
    const o = await Order.findById(arg).populate('items.productId');
    if (!o) return 'Order not found';
    const items = o.items.map((i: any) => `${i.productId.title} x${i.quantity}`).join(', ');
    return `Order ${o._id}: payment=${o.payment_status}, shipping=${o.shipping_status}, total=₹${o.totalAmount}, items=${items}`;
  }
  return 'Tool not implemented';
}

export const postBotMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { message } = req.body;
    const user = req.user as User;
    if (!user) return next(createHttpError(401, 'Unauthorized'));

    const userId = user._id;

    // save user message
    await Chat.create({ user: userId, role: 'user', content: message });

    // build context & history
    const context = await buildContext(userId);
    const history = await Chat.find({ user: userId })
      .sort({ createdAt: 1 })
      .limit(10);

    const messages = [
      { role: 'system', content: `Context: ${context}` },
      ...history.map((h: any) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    // first OpenAI call
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.3,
    });
    let reply = completion.choices[0]?.message.content || '';

    console.log("Completion reply is ", reply);

    // tool parser
    const toolMatch = reply.match(/<tool>(\w+)\((.*?)\)<\/tool>/);
    if (toolMatch) {
      const [, tool, arg] = toolMatch as [string, string, string];;
      const toolRes = await callTool(tool, arg);
      messages.push({ role: 'tool', content: toolRes });
    
      const second = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.3,
      });
      reply = second.choices[0]?.message.content || '';
    }

    // save assistant reply
    await Chat.create({ user: userId, role: 'assistant', content: reply });
    res.json({ reply });
  } catch (err) {
    next(err); // → global error handler
  }
};