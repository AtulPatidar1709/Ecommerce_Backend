import mongoose, { model } from 'mongoose';

const chatSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.Mixed, required: true, index: true },
  role: { type: String, enum: ['user', 'assistant', 'tool'] },
  content: String,
  time: { type: Date, default: Date.now },
  expiredAt: { type: Date, default: 1000 * 60 * 60 },
});

const Chat = model('Chat', chatSchema);

export default Chat;