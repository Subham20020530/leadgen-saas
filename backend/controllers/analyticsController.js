import ScanJob from '../models/ScanJob.js';
import Lead from '../models/Lead.js';
import User from '../models/User.js';

// @desc    Get dashboard stats
// @route   GET /api/analytics/dashboard
// @access  Private
export const getDashboardStats = async (req, res) => {
    try {
        const { userId } = req.auth;

        const user = await User.findOne({ clerkId: userId });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Parallel stats fetching
        const [
            totalLeads,
            scansRunning,
            hotLeads,
            recentScans,
            dailyActivity
        ] = await Promise.all([
            Lead.countDocuments({ userId: user.clerkId }),
            ScanJob.countDocuments({ userId: user.clerkId, status: 'running' }),
            Lead.countDocuments({ userId: user.clerkId, leadScore: { $gte: 70 } }), // Hot leads > 70
            ScanJob.find({ userId: user.clerkId }).sort({ startedAt: -1 }).limit(5),
            getDailyActivity(user.clerkId)
        ]);

        res.json({
            success: true,
            stats: {
                totalLeads,
                scansRunning,
                hotLeads,
                scansRemaining: user.scansRemaining
            },
            recentScans,
            activity: dailyActivity
        });
    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Helper: Get leads collected per day for last 7 days
async function getDailyActivity(userId) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activity = await Lead.aggregate([
        {
            $match: {
                userId: userId,
                createdAt: { $gte: sevenDaysAgo }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    return activity;
}
