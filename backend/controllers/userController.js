import User from '../models/User.js';

// @desc    Get current user profile (synced with Clerk)
// @route   GET /api/users/me
// @access  Private
export const getMyProfile = async (req, res) => {
    try {
        const { userId } = req.auth; // Clerk sets this

        // Find user by clerkId
        let user = await User.findOne({ clerkId: userId });

        // If user doesn't exist, create them (Lazy Sync)
        if (!user) {
            // We might want to pass email from frontend if not available in token
            // But usually we just create the record and update details later if needed
            user = await User.create({
                clerkId: userId,
                email: req.body.email || "", // Optional if passed
                plan: 'free',
                scansRemaining: 5 // Give 5 free scans on signup
            });
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error("Error invoking getMyProfile:", error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
