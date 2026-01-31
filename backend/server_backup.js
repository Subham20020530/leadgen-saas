// server.js - FIXED Production Lead Gen Backend
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { chromium } from 'playwright';
import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200
});
app.use('/api/', limiter);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

// ==================== SCHEMAS ====================
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
  source: { type: String, default: 'scraper' }, // NEW: Track data source
  isFake: { type: Boolean, default: false }, // NEW: Mark fake/demo leads
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ScanJobSchema = new mongoose.Schema({
  userId: String,
  city: String,
  category: String,
  status: { type: String, enum: ['pending', 'running', 'completed', 'failed'], default: 'pending' },
  progress: { type: Number, default: 0 },
  leadsFound: { type: Number, default: 0 },
  realLeadsCount: { type: Number, default: 0 }, // NEW: Track real vs demo
  demoLeadsCount: { type: Number, default: 0 }, // NEW
  startedAt: Date,
  completedAt: Date,
  error: String
});

const UserSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  email: String,
  plan: { type: String, default: 'free' },
  scansRemaining: { type: Number, default: 100 },
  totalLeads: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const Lead = mongoose.model('Lead', LeadSchema);
const ScanJob = mongoose.model('ScanJob', ScanJobSchema);
const User = mongoose.model('User', UserSchema);

// ==================== IMPROVED SCRAPER ====================
class RealLeadScraper {
  constructor() {
    this.browser = null;
  }

  async initialize() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled',
          '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        ]
      });
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // IMPROVED: Multi-source scraping
  async scrapeMultipleSources(category, city) {
    console.log(`\n🔍 REAL SCRAPING STARTED: ${category} in ${city}`);
    
    const results = [];
    
    // Try Justdial first
    const justdialLeads = await this.scrapeJustdial(category, city);
    if (justdialLeads.length > 0) {
      console.log(`✅ Justdial: Found ${justdialLeads.length} leads`);
      results.push(...justdialLeads);
    }
    
    // If Justdial failed, try Google Maps
    if (results.length < 5) {
      console.log('⚠️ Justdial returned few results, trying Google Maps...');
      const mapsLeads = await this.scrapeGoogleMaps(category, city);
      if (mapsLeads.length > 0) {
        console.log(`✅ Google Maps: Found ${mapsLeads.length} leads`);
        results.push(...mapsLeads);
      }
    }
    
    // Deduplicate
    const unique = this.deduplicateLeads(results);
    console.log(`📊 Total unique leads after deduplication: ${unique.length}`);
    
    return unique;
  }

  // FIXED: Justdial scraper with better selectors
  async scrapeJustdial(category, city) {
    const leads = [];
    
    try {
      await this.initialize();
      const context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        viewport: { width: 1920, height: 1080 }
      });
      
      const page = await context.newPage();
      
      // Format URL properly
      const categorySlug = category.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9-]/g, '');
      const citySlug = city.toLowerCase();
      
      const url = `https://www.justdial.com/${citySlug}/${categorySlug}`;
      console.log(`📄 Scraping: ${url}`);
      
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);
      
      // IMPROVED: Better selectors
      const scrapedData = await page.evaluate(() => {
        const results = [];
        
        // Try multiple selector patterns
        const selectors = [
          '.resultbox',
          '[data-business-name]',
          '.store-details',
          '.business-card'
        ];
        
        let boxes = [];
        for (const selector of selectors) {
          boxes = document.querySelectorAll(selector);
          if (boxes.length > 0) break;
        }
        
        console.log(`Found ${boxes.length} business boxes`);
        
        boxes.forEach((box, idx) => {
          try {
            // Multiple ways to get name
            const name = 
              box.querySelector('.jcn a')?.textContent?.trim() ||
              box.querySelector('[data-business-name]')?.textContent?.trim() ||
              box.querySelector('.business-name')?.textContent?.trim() ||
              box.querySelector('h2, h3')?.textContent?.trim() ||
              '';
            
            // Multiple ways to get phone
            let phone = 
              box.querySelector('.mobilesv')?.getAttribute('data-phone') ||
              box.querySelector('[data-phone]')?.getAttribute('data-phone') ||
              box.querySelector('.phone')?.textContent?.trim() ||
              '';
            
            phone = phone.replace(/[^0-9+]/g, '');
            
            // Multiple ways to get address
            const address = 
              box.querySelector('.cont_fl_addr')?.textContent?.trim() ||
              box.querySelector('.address')?.textContent?.trim() ||
              box.querySelector('[data-address]')?.textContent?.trim() ||
              '';
            
            // Rating and reviews
            const ratingText = box.querySelector('.green-box, .rating')?.textContent || '0';
            const rating = parseFloat(ratingText.match(/[\d.]+/)?.[0] || '0');
            
            const reviewText = box.querySelector('.rt_count, .review-count')?.textContent || '0';
            const reviews = parseInt(reviewText.match(/\d+/)?.[0] || '0');
            
            // Website
            const website = box.querySelector('a[href*="website"], a[data-icon="website"]')?.href || '';
            
            if (name && name.length > 3 && !name.includes('Justdial')) {
              results.push({
                name,
                phone,
                address,
                rating,
                reviews,
                website,
                source: 'justdial'
              });
            }
          } catch (e) {
            console.error(`Error processing box ${idx}:`, e.message);
          }
        });
        
        return results;
      });
      
      leads.push(...scrapedData);
      await context.close();
      
    } catch (error) {
      console.error(`❌ Justdial scraping error: ${error.message}`);
    }
    
    return leads;
  }

  // NEW: Google Maps scraper as fallback
  async scrapeGoogleMaps(category, city) {
    const leads = [];
    
    try {
      await this.initialize();
      const context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        viewport: { width: 1920, height: 1080 }
      });
      
      const page = await context.newPage();
      
      const searchQuery = `${category} in ${city}`;
      const url = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
      
      console.log(`🗺️ Scraping Google Maps: ${url}`);
      
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(5000);
      
      // Scroll to load more results
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => {
          const feed = document.querySelector('[role="feed"]');
          if (feed) feed.scrollTop = feed.scrollHeight;
        });
        await page.waitForTimeout(2000);
      }
      
      const scrapedData = await page.evaluate(() => {
        const results = [];
        const articles = document.querySelectorAll('[role="article"], .Nv2PK');
        
        articles.forEach((article, idx) => {
          try {
            const name = article.querySelector('.fontHeadlineSmall, .qBF1Pd')?.textContent?.trim() || '';
            
            const ratingEl = article.querySelector('span[role="img"]');
            const ratingText = ratingEl?.getAttribute('aria-label') || '0';
            const rating = parseFloat(ratingText.match(/[\d.]+/)?.[0] || '0');
            const reviews = parseInt(ratingText.match(/\((\d+)\)/)?.[1] || '0');
            
            const addressParts = article.querySelectorAll('.fontBodyMedium');
            let address = '';
            addressParts.forEach(part => {
              const text = part.textContent;
              if (text && text.includes(',')) {
                address = text.trim();
              }
            });
            
            const phone = article.querySelector('[data-tooltip="Copy phone number"]')?.textContent?.trim() || '';
            const website = article.querySelector('[data-tooltip="Open website"]')?.href || '';
            
            if (name && name.length > 3) {
              results.push({
                name,
                phone,
                address,
                rating,
                reviews,
                website,
                hasGBP: true,
                source: 'google_maps'
              });
            }
          } catch (e) {
            console.error(`Error processing article ${idx}:`, e);
          }
        });
        
        return results;
      });
      
      leads.push(...scrapedData);
      await context.close();
      
    } catch (error) {
      console.error(`❌ Google Maps scraping error: ${error.message}`);
    }
    
    return leads;
  }

  // IMPROVED: Deduplication
  deduplicateLeads(leads) {
    const seen = new Map();
    const unique = [];
    
    for (const lead of leads) {
      // Create unique key from name and phone
      const key = `${lead.name.toLowerCase().trim()}-${lead.phone}`.replace(/\s+/g, '');
      
      if (!seen.has(key) && lead.name.length > 3) {
        seen.set(key, true);
        unique.push(lead);
      }
    }
    
    return unique;
  }

  // IMPROVED: SEO Analysis
  async analyzeSEO(url) {
    const seoData = {
      hasMetaTitle: false,
      hasH1: false,
      pageSpeed: 50,
      isMobileFriendly: false,
      hasLocalKeywords: false,
      hasContactPage: false
    };
    
    if (!url || !url.startsWith('http')) return seoData;
    
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0' },
        maxRedirects: 5
      });
      
      const $ = cheerio.load(response.data);
      
      seoData.hasMetaTitle = $('title').length > 0 && $('title').text().length > 0;
      seoData.hasH1 = $('h1').length > 0;
      seoData.hasContactPage = $('a[href*="contact"]').length > 0;
      seoData.isMobileFriendly = $('meta[name="viewport"]').length > 0;
      
      const html = response.data.toLowerCase();
      seoData.hasLocalKeywords = html.includes('mumbai') || html.includes('delhi') || 
                                  html.includes('kolkata') || html.includes('bangalore');
      
      // Estimate page speed based on response time
      seoData.pageSpeed = Math.min(90, Math.max(20, 100 - (response.headers['content-length'] / 10000)));
      
    } catch (error) {
      console.log(`⚠️ Could not analyze ${url}: ${error.message}`);
    }
    
    return seoData;
  }

  // Lead scoring
  calculateLeadScore(lead, seoData, gbpData) {
    let score = 0;
    const issues = [];

    if (!lead.website) {
      score += 40;
      issues.push('No website found');
    } else {
      if (!seoData.hasMetaTitle) { score += 10; issues.push('Missing meta title'); }
      if (!seoData.hasH1) { score += 10; issues.push('No H1 heading'); }
      if (seoData.pageSpeed < 50) { score += 15; issues.push('Slow page speed'); }
      if (!seoData.isMobileFriendly) { score += 10; issues.push('Not mobile friendly'); }
      if (!seoData.hasLocalKeywords) { score += 10; issues.push('No local keywords'); }
      if (!seoData.hasContactPage) { score += 5; issues.push('Missing contact page'); }
    }

    if (!gbpData?.verified && !lead.hasGBP) {
      score += 30;
      issues.push('No Google Business Profile');
    }

    if (lead.reviews < 10) { score += 20; issues.push(`Only ${lead.reviews} reviews`); }
    if (lead.rating < 4.0 && lead.rating > 0) { score += 10; issues.push(`Low rating: ${lead.rating}`); }

    let leadType = 'COLD';
    if (score >= 80) leadType = 'HOT';
    else if (score >= 50) leadType = 'WARM';

    const estimatedRevenue = `₹${(score * 80).toLocaleString()}-${(score * 120).toLocaleString()}/mo`;

    return { score, leadType, issues, estimatedRevenue };
  }
}

// ==================== API ROUTES ====================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

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

app.post('/api/scan', async (req, res) => {
  try {
    const { userId, city, category } = req.body;
    
    const user = await getOrCreateUser(userId);
    
    if (user.scansRemaining <= 0) {
      return res.status(403).json({ 
        success: false,
        error: 'No scans remaining' 
      });
    }

    const job = new ScanJob({
      userId,
      city,
      category,
      status: 'pending',
      startedAt: new Date()
    });
    await job.save();

    processScanJob(job._id, userId, city, category);

    res.json({ success: true, jobId: job._id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/scan/:jobId', async (req, res) => {
  try {
    const job = await ScanJob.findById(req.params.jobId);
    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/leads', async (req, res) => {
  try {
    const { userId, leadType } = req.query;

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
});

app.patch('/api/leads/:id', async (req, res) => {
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
});

app.get('/api/leads/export/csv', async (req, res) => {
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
});

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

app.get('/api/leads/fake/:userId', async (req, res) => {
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
});

app.post('/api/leads/remove-fake/:userId', async (req, res) => {
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
});

// ==================== BACKGROUND PROCESSOR ====================
async function processScanJob(jobId, userId, city, category) {
  const scraper = new RealLeadScraper();
  
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
    const rawLeads = await scraper.scrapeMultipleSources(category, city);
    
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
          seoData = await scraper.analyzeSEO(rawLead.website);
        }

        const gbpData = { verified: rawLead.hasGBP || false };
        const { score, leadType, issues, estimatedRevenue } = scraper.calculateLeadScore(rawLead, seoData, gbpData);

        const lead = new Lead({
          userId,
          ...rawLead,
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
      { firebaseUid: userId },
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
    console.log(`Source breakdown:`);
    const sources = rawLeads.reduce((acc, l) => {
      acc[l.source] = (acc[l.source] || 0) + 1;
      return acc;
    }, {});
    Object.entries(sources).forEach(([source, count]) => {
      console.log(`  - ${source}: ${count}`);
    });
    console.log(`${'='.repeat(60)}\n`);

  } catch (error) {
    console.error('❌ Scan failed:', error);
    await ScanJob.findByIdAndUpdate(jobId, {
      status: 'failed',
      error: error.message
    });
  } finally {
    await scraper.close();
  }
}

app.listen(PORT, () => {
  console.log(`\n🚀 Lead Gen API running on port ${PORT}`);
  console.log(`Ready to scrape REAL leads!\n`);
});