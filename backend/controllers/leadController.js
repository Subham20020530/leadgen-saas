import Lead from '../models/Lead.js';

// Helper function duplication - in a real app, move to utils
function isFakeLead(lead) {
    const fakePatterns = [
        /\b(Expert|Quick|Pro|Best|Fast|Premier|Elite|Trusted)\s+(Plumber|Salon|Restaurant|Gym|Clinic|Real|Electrician|AC|Tutor|Photography|Event|Interior|Car|Dentist)\s+\d+\b/i,
        /^\d+\s+Street,\s*\w+$/i,  // Sequential addresses
        /^[A-Z\s\d]+$/,             // All caps
        /https:\/\/www\.\w+\d+\.com/i,  // Generated websites
    ];

    return fakePatterns.some(pattern => pattern.test(lead.name) || pattern.test(lead.address) || pattern.test(lead.website));
}

export const getLeads = async (req, res) => {
    try {
        const { leadType } = req.query;
        const { userId } = req.auth;

        const query = { userId };
        if (leadType && leadType !== 'ALL') {
            query.leadType = leadType;
        }

        const leads = await Lead.find(query)
            .sort({ leadScore: -1, createdAt: -1 })
            .limit(100);

        res.json({
            success: true,
            leads
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateLead = async (req, res) => {
    try {
        const lead = await Lead.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: new Date() },
            { new: true }
        );
        res.json({ success: true, lead });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const exportLeadsCsv = async (req, res) => {
    try {
        const { userId } = req.query;
        const leads = await Lead.find({ userId }).sort({ leadScore: -1 });

        const csv = [
            ['Name', 'Phone', 'Address', 'City', 'Category', 'Website', 'Score', 'Type', 'Source', 'Issues'].join(','),
            ...leads.map(l => [
                `"${l.name}"`,
                l.phone || '',
                `"${l.address || ''}"`,
                l.city,
                l.category,
                l.website || 'None',
                l.leadScore,
                l.leadType,
                l.source || 'unknown',
                `"${l.issues.join('; ')}"`
            ].join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
        res.send(csv);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getFakeLeads = async (req, res) => {
    try {
        const { userId } = req.params;
        const leads = await Lead.find({ userId });

        const fakeLeads = leads.filter(lead => isFakeLead(lead));

        res.json({
            success: true,
            fakeLeadsCount: fakeLeads.length,
            totalLeads: leads.length,
            fakeLeads: fakeLeads.map(lead => ({
                _id: lead._id,
                name: lead.name,
                address: lead.address,
                website: lead.website
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const removeFakeLeads = async (req, res) => {
    try {
        const { userId } = req.params;
        const leads = await Lead.find({ userId });

        const fakeLeads = leads.filter(lead => isFakeLead(lead));
        const fakeLeadIds = fakeLeads.map(lead => lead._id);

        if (fakeLeadIds.length > 0) {
            const result = await Lead.deleteMany({ _id: { $in: fakeLeadIds } });
            res.json({
                success: true,
                message: `Successfully removed ${result.deletedCount} fake leads`,
                deletedCount: result.deletedCount,
                remainingLeads: leads.length - result.deletedCount
            });
        } else {
            res.json({
                success: true,
                message: 'No fake leads found to remove',
                deletedCount: 0,
                remainingLeads: leads.length
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
