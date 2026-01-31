import mongoose from 'mongoose';

const ScanJobSchema = new mongoose.Schema({
    userId: String,
    city: String,
    category: String,
    status: { type: String, enum: ['pending', 'running', 'completed', 'failed'], default: 'pending' },
    progress: { type: Number, default: 0 },
    leadsFound: { type: Number, default: 0 },
    realLeadsCount: { type: Number, default: 0 },
    demoLeadsCount: { type: Number, default: 0 },
    startedAt: Date,
    completedAt: Date,
    error: String
});

export default mongoose.model('ScanJob', ScanJobSchema);
