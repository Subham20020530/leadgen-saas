import { chromium } from 'playwright';
import axios from 'axios';
import * as cheerio from 'cheerio';

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

    // Multi-source scraping
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

            const scrapedData = await page.evaluate(() => {
                const results = [];

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
                        const name =
                            box.querySelector('.jcn a')?.textContent?.trim() ||
                            box.querySelector('[data-business-name]')?.textContent?.trim() ||
                            box.querySelector('.business-name')?.textContent?.trim() ||
                            box.querySelector('h2, h3')?.textContent?.trim() ||
                            '';

                        let phone =
                            box.querySelector('.mobilesv')?.getAttribute('data-phone') ||
                            box.querySelector('[data-phone]')?.getAttribute('data-phone') ||
                            box.querySelector('.phone')?.textContent?.trim() ||
                            '';

                        phone = phone.replace(/[^0-9+]/g, '');

                        const address =
                            box.querySelector('.cont_fl_addr')?.textContent?.trim() ||
                            box.querySelector('.address')?.textContent?.trim() ||
                            box.querySelector('[data-address]')?.textContent?.trim() ||
                            '';

                        const ratingText = box.querySelector('.green-box, .rating')?.textContent || '0';
                        const rating = parseFloat(ratingText.match(/[\d.]+/)?.[0] || '0');

                        const reviewText = box.querySelector('.rt_count, .review-count')?.textContent || '0';
                        const reviews = parseInt(reviewText.match(/\d+/)?.[0] || '0');

                        const website = box.querySelector('a[href*="website"], a[data-icon="website"]')?.href || '';

                        if (name && name.length > 3 && !name.includes('Justdial')) {
                            // Enhanced Phone Extraction
                            if (!phone) {
                                // Fallback: try to find phone in text content if it looks like a number
                                const allText = box.textContent || '';
                                const phoneMatch = allText.match(/(\+\d{1,3}[- ]?)?\d{10}/);
                                if (phoneMatch) phone = phoneMatch[0];
                            }

                            // Enhanced Website Extraction
                            let finalWebsite = website;
                            if (!finalWebsite) {
                                const webElem = box.querySelector('.icon-wbb, .icon-website');
                                if (webElem && webElem.parentElement.href) {
                                    finalWebsite = webElem.parentElement.href;
                                }
                            }

                            results.push({
                                name,
                                phone: phone || 'Not Available',
                                address: address || city,
                                rating,
                                reviews,
                                website: finalWebsite,
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

                        // Improved Google Maps extraction
                        if (name && name.length > 3) {
                            let finalPhone = phone;
                            if (!finalPhone) {
                                // Look for phone pattern in the article text
                                const text = article.innerText || article.textContent;
                                // Matches standard international formats or 10-digit Indian numbers
                                const matches = text.match(/((\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})|(\d{5}[-.\s]?\d{5})/);
                                if (matches) finalPhone = matches[0];
                            }

                            if (finalPhone) finalPhone = finalPhone.replace(/[^\d+]/g, '');

                            // Aggressive website finding
                            let finalWebsite = website;
                            if (!finalWebsite) {
                                const links = Array.from(article.querySelectorAll('a'));
                                const webLink = links.find(l => l.href && !l.href.includes('google') && !l.href.includes('tel:'));
                                if (webLink) finalWebsite = webLink.href;
                            }

                            results.push({
                                name,
                                phone: finalPhone || 'Not Available',
                                address: address || city,
                                rating,
                                reviews,
                                website: finalWebsite,
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

    deduplicateLeads(leads) {
        const seen = new Map();
        const unique = [];

        for (const lead of leads) {
            const key = `${lead.name.toLowerCase().trim()}-${lead.phone}`.replace(/\s+/g, '');

            if (!seen.has(key) && lead.name.length > 3) {
                seen.set(key, true);
                unique.push(lead);
            }
        }

        return unique;
    }

    async analyzeSEO(url) {
        const seoData = {
            hasMetaTitle: false,
            hasH1: false,
            pageSpeed: 50,
            isMobileFriendly: false,
            hasLocalKeywords: false,
            hasContactPage: false,
            email: null // NEW: Email field
        };

        if (!url || !url.startsWith('http')) return seoData;

        try {
            const response = await axios.get(url, {
                timeout: 10000,
                headers: { 'User-Agent': 'Mozilla/5.0' },
                maxRedirects: 5
            });

            const html = response.data; // Keep original case for regex
            const $ = cheerio.load(html);

            seoData.hasMetaTitle = $('title').length > 0 && $('title').text().length > 0;
            seoData.hasH1 = $('h1').length > 0;
            seoData.hasContactPage = $('a[href*="contact"]').length > 0;
            seoData.isMobileFriendly = $('meta[name="viewport"]').length > 0;

            const lowerHtml = html.toLowerCase();
            seoData.hasLocalKeywords = lowerHtml.includes('mumbai') || lowerHtml.includes('delhi') ||
                lowerHtml.includes('kolkata') || lowerHtml.includes('bangalore');

            seoData.pageSpeed = Math.min(90, Math.max(20, 100 - (response.headers['content-length'] / 10000)));

            // Extract Email
            const emailMatch = html.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
            if (emailMatch) {
                // Filter out likely junk emails (images, specific extensions)
                const validEmails = emailMatch.filter(e => !e.includes('.png') && !e.includes('.jpg') && !e.includes('.webp') && e.length < 50);
                if (validEmails.length > 0) {
                    seoData.email = validEmails[0]; // Take the first valid one
                }
            }

        } catch (error) {
            console.log(`⚠️ Could not analyze ${url}: ${error.message}`);
        }

        return seoData;
    }

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

export default new RealLeadScraper();
