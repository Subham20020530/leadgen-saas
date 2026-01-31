import ScanJob from '../models/ScanJob.js';
import User from '../models/User.js';
import Lead from '../models/Lead.js';
import scraperService from '../services/scraperService.js';

// Auto-create user helper
async function getOrCreateUser(userId) {
    let user = await User.findOne({ firebaseUid: userId });
    if (!user) {
        user = new User({
            firebaseUid: userId,
            email: `${userId}@demo.com`,
            scansRemaining: 100
        });
        await user.save();
        console.log(`✅ Created new user: ${userId}`);
    }
    return user;
}

// Fake Lead Detection Function
function isFakeLead(lead) {
    const fakePatterns = [
        /\b(Expert|Quick|Pro|Best|Fast|Premier|Elite|Trusted)\s+(Plumber|Salon|Restaurant|Gym|Clinic|Real|Electrician|AC|Tutor|Photography|Event|Interior|Car|Dentist)\s+\d+\b/i,
        /^\d+\s+Street,\s*\w+$/i,  // Sequential addresses
        /^[A-Z\s\d]+$/,             // All caps
        /https:\/\/www\.\w+\d+\.com/i,  // Generated websites
    ];

    return fakePatterns.some(pattern => pattern.test(lead.name) || pattern.test(lead.address) || pattern.test(lead.website));
}

export const startScan = async (req, res) => {
    try {
        const { city, category } = req.body;
        const { userId } = req.auth; // From Clerk Middleware

        const user = await User.findOne({ clerkId: userId });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found. Please refresh page.' });
        }

        if (user.scansRemaining <= 0) {
            return res.status(403).json({
                success: false,
                error: 'No scans remaining. Please upgrade your plan.'
            });
        }

        const job = new ScanJob({
            userId: user.clerkId, // Use clerkId for consistency
            city,
            category,
            status: 'pending',
            startedAt: new Date()
        });
        await job.save();

        // Trigger background process
        processScanJob(job._id, user.clerkId, city, category);

        res.json({ success: true, jobId: job._id });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getScanStatus = async (req, res) => {
    try {
        const job = await ScanJob.findById(req.params.jobId);
        res.json({ success: true, job });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Background Processor (kept in controller for now, could be moved to worker)
async function processScanJob(jobId, userId, city, category) {
    try {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🚀 SCAN STARTED`);
        console.log(`Job ID: ${jobId}`);
        console.log(`City: ${city}, Category: ${category}`);
        console.log(`${'='.repeat(60)}\n`);

        await ScanJob.findByIdAndUpdate(jobId, {
            status: 'running',
            progress: 10
        });

        // REAL SCRAPING with multi-source
        const rawLeads = await scraperService.scrapeMultipleSources(category, city);

        console.log(`\n📊 Scraped ${rawLeads.length} total leads`);

        await ScanJob.findByIdAndUpdate(jobId, { progress: 40 });

        let processed = 0;

        for (const rawLead of rawLeads) {
            try {
                // Skip if no name
                if (!rawLead.name || rawLead.name.length < 3) continue;

                // Analyze website if exists
                let seoData = {};
                if (rawLead.website && rawLead.website.startsWith('http')) {
                    seoData = await scraperService.analyzeSEO(rawLead.website);
                }

                const gbpData = { verified: rawLead.hasGBP || false };
                const { score, leadType, issues, estimatedRevenue } = scraperService.calculateLeadScore(rawLead, seoData, gbpData);

                // Prioritize found email from website if scraper didn't find one
                const finalEmail = rawLead.email || seoData.email || null;

                const lead = new Lead({
                    userId,
                    ...rawLead,
                    email: finalEmail, // Use improved email
                    city,
                    category,
                    hasWebsite: !!rawLead.website,
                    hasGBP: rawLead.hasGBP || false,
                    leadScore: score,
                    leadType,
                    issues,
                    seoData,
                    gbpData,
                    estimatedRevenue,
                    source: rawLead.source,
                    isFake: isFakeLead(rawLead) // Check if this is a fake lead
                });

                await lead.save();
                processed++;

                const progress = 40 + Math.floor((processed / rawLeads.length) * 50);
                await ScanJob.findByIdAndUpdate(jobId, { progress });

            } catch (error) {
                console.error(`Error processing lead: ${error.message}`);
            }
        }

        await User.findOneAndUpdate(
            { clerkId: userId },
            { $inc: { scansRemaining: -1, totalLeads: processed } }
        );

        await ScanJob.findByIdAndUpdate(jobId, {
            status: 'completed',
            progress: 100,
            leadsFound: processed,
            realLeadsCount: processed,
            completedAt: new Date()
        });

        console.log(`\n${'='.repeat(60)}`);
        console.log(`✅ SCAN COMPLETED`);
        console.log(`Total leads saved: ${processed}`);
        console.log(`${'='.repeat(60)}\n`);

    } catch (error) {
        console.error('❌ Scan failed:', error);
        await ScanJob.findByIdAndUpdate(jobId, {
            status: 'failed',
            error: error.message
        });
    } finally {
        await scraperService.close();
    }
}
