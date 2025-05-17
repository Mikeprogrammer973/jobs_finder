"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeWWR = void 0;
const puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
const scrapeWWR = async (query) => {
    puppeteer_extra_1.default.use((0, puppeteer_extra_plugin_stealth_1.default)());
    const browser = await puppeteer_extra_1.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: './chrome/linux-136.0.7103.94/chrome-linux64/chrome'
    });
    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0');
        await page.setViewport({ width: 1366, height: 768 });
        await page.goto(`https://weworkremotely.com/remote-jobs/search?term=${encodeURIComponent(query)}`, {
            waitUntil: 'networkidle2',
            timeout: 60000 * 3
        });
        const isBlocked = await page.evaluate(() => {
            return document.title.includes('Access Denied') ||
                document.querySelector('.cf-browser-verification') !== null;
        });
        if (isBlocked) {
            throw new Error('Access blocked by We Work Remotely');
        }
        // Extract job data
        const jobs = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('.new-listing-container'));
            return items.map(el => {
                const titleEl = el.querySelector('.new-listing__header__title');
                const companyEl = el.querySelector('.new-listing__company-name');
                const linkEl = el.getElementsByTagName('a')[1] || el.getElementsByTagName('a')[0];
                const logo = el.querySelector('.tooltip--flag-logo__flag-logo')?.style?.backgroundImage?.match(/url\((.*?)\)/)?.[1] || '';
                return {
                    title: titleEl?.textContent?.trim() || '',
                    company: companyEl?.textContent?.trim() || '',
                    link: linkEl?.getAttribute('href') ? 'https://weworkremotely.com' + linkEl.getAttribute('href') : '',
                    source: 'WeWorkRemotely',
                    logo: logo
                };
            }).filter(job => job.title && job.company);
        });
        await browser.close();
        return jobs;
    }
    catch (error) {
        console.error('Error scraping We Work Remotely:', error);
        await browser.close();
        return [];
    }
};
exports.scrapeWWR = scrapeWWR;
