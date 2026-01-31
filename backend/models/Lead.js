import mongoose from 'mongoose';

const LeadSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    phone: String,
    email: String,
    address: String,
    city: String,
    category: String,
    website: String,
    hasWebsite: Boolean,
    hasGBP: Boolean,
    reviews: Number,
    rating: Number,
    leadScore: { type: Number, index: true },
    leadType: { type: String, enum: ['HOT', 'WARM', 'COLD'], index: true },
    issues: [String],
    seoData: Object,
    gbpData: Object,
    estimatedRevenue: String,
    contacted: { type: Boolean, default: false },
    status: { type: String, default: 'new' },
    source: { type: String, default: 'scraper' },
    isFake: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Lead', LeadSchema);
