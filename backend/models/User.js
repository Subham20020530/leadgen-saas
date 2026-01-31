import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    clerkId: { type: String, required: true, unique: true },
    email: String,
    plan: { type: String, default: 'free' },
    scansRemaining: { type: Number, default: 100 },
    totalLeads: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', UserSchema);
