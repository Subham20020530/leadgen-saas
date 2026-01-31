import express from 'express';
import {
    getLeads,
    updateLead,
    exportLeadsCsv,
    getFakeLeads,
    removeFakeLeads
} from '../controllers/leadController.js';

const router = express.Router();

router.get('/leads', getLeads);
router.patch('/leads/:id', updateLead);
router.get('/leads/export/csv', exportLeadsCsv);
router.get('/leads/fake/:userId', getFakeLeads);
router.post('/leads/remove-fake/:userId', removeFakeLeads);

export default router;
