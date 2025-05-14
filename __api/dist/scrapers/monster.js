"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeMonster = void 0;
const puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
const puppeteer_extra_plugin_recaptcha_1 = __importDefault(require("puppeteer-extra-plugin-recaptcha"));
const promises_1 = require("timers/promises");
const scrapeMonster = async (query, location = '', options = {}) => {
    const { headless = false, // Keep visible to handle verification
    maxPages = 3, slowMo = 100 // Slower interactions
     } = options;
    // Configure plugins
    puppeteer_extra_1.default.use((0, puppeteer_extra_plugin_stealth_1.default)());
    puppeteer_extra_1.default.use((0, puppeteer_extra_plugin_recaptcha_1.default)({
        provider: {
            id: '2captcha',
            token: '2c5922eab872ce233a2843f51a2d398b'
        }
    }));
    const browser = await puppeteer_extra_1.default.launch({
        headless,
        slowMo,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--window-size=1280,720',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
        ]
    });
    const page = await browser.newPage();
    const jobs = [];
    try {
        // Configure browser to look more human-like
        await page.setViewport({ width: 1280, height: 720 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        await page.setJavaScriptEnabled(true);
        // Simulate human-like behavior
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                req.abort();
            }
            else {
                req.continue();
            }
        });
        const baseUrl = `https://www.monster.com/jobs/search/?q=${encodeURIComponent(query)}&where=${encodeURIComponent(location)}`;
        let currentPage = 1;
        while (currentPage <= maxPages) {
            const url = currentPage === 1 ? baseUrl : `${baseUrl}&page=${currentPage}`;
            console.log(`Navigating to: ${url}`);
            await page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: 60000
            });
            // Check for verification
            await handleVerification(page);
            // Check for blocking
            const isBlocked = await page.evaluate(() => {
                return document.title.includes('Access Denied') ||
                    document.querySelector('.challenge-form') !== null;
            });
            if (isBlocked) {
                throw new Error('Monster has blocked the request');
            }
            // Wait for job cards
            try {
                await page.waitForSelector('.card-content', { timeout: 30000 });
            }
            catch (err) {
                console.log('No job cards found, ending pagination');
                break;
            }
            // Extract job data
            const pageJobs = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('.card-content')).map(el => {
                    const titleEl = el.querySelector('h2.title a');
                    const companyEl = el.querySelector('.company span');
                    const locationEl = el.querySelector('.location span');
                    const dateEl = el.querySelector('time');
                    const descEl = el.querySelector('.metadata-snippet');
                    return {
                        title: titleEl?.textContent?.trim() || '',
                        company: companyEl?.textContent?.trim() || '',
                        location: locationEl?.textContent?.trim() || '',
                        link: titleEl?.getAttribute('href') || '',
                        date: dateEl?.textContent?.trim(),
                        description: descEl?.textContent?.trim(),
                        source: 'Monster'
                    };
                });
            });
            if (pageJobs.length === 0)
                break;
            jobs.push(...pageJobs);
            console.log(`Found ${pageJobs.length} jobs on page ${currentPage}`);
            currentPage++;
            await (0, promises_1.setTimeout)(3000 + Math.random() * 4000); // Random delay 3-7s
        }
        return jobs;
    }
    catch (error) {
        console.error('Error scraping Monster:', error);
        await page.screenshot({ path: 'monster_error.png' });
        return [];
    }
    finally {
        await browser.close();
    }
};
exports.scrapeMonster = scrapeMonster;
async function handleVerification(page) {
    try {
        // Check for CAPTCHA
        const captchaExists = await page.evaluate(() => {
            return document.querySelector('#recaptcha, .challenge-form') !== null;
        });
        if (captchaExists) {
            console.log('CAPTCHA detected, attempting to solve...');
            // Solve reCAPTCHAs
            await page.solveRecaptchas();
            // For audio verification fallback
            const audioChallenge = await page.evaluate(() => {
                const audioBtn = document.querySelector('#recaptcha-audio-button');
                if (audioBtn) {
                    audioBtn.click();
                    return true;
                }
                return false;
            });
            if (audioChallenge) {
                console.log('Audio verification required - manual intervention needed');
                await page.waitForNavigation({ timeout: 300000 }); // Wait 5 minutes for manual solve
            }
        }
        // Check if we're still on verification page
        const stillVerifying = await page.evaluate(() => {
            return document.querySelector('#verification-form') !== null;
        });
        if (stillVerifying) {
            throw new Error('Verification could not be completed automatically');
        }
    }
    catch (error) {
        console.log('Verification handling error:', error);
        throw error;
    }
}
