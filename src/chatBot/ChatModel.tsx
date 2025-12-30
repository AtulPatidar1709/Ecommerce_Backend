import mongoose, { model } from 'mongoose';

const chatSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: { type: String, enum: ['user', 'assistant', 'tool'] },
  content: String,
  time: { type: Date, default: Date.now },
});

const Chat = model('Chat', chatSchema);

export default Chat;