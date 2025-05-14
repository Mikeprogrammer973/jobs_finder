"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeDice = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const scrapeDice = async (query, options = {}) => {
    const { location = '', headless = true, timeout = 60000 // Increased default timeout
     } = options;
    const browser = await puppeteer_1.default.launch({
        headless: headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        await page.setViewport({ width: 1366, height: 768 });
        const url = `https://www.dice.com/jobs?q=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`;
        console.log(`Navigating to: ${url}`);
        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: timeout
        });
        const max_pages = await page.evaluate(() => {
            const max_pages = document.querySelector('[role="navigation"]')?.children[2].children[2].textContent?.trim();
            return max_pages ? Number(max_pages) : 1;
        });
        console.log(`Found ${max_pages} pages`);
        const jobList = [];
        console.log('Extracting job data...');
        for (let i = 0; i < max_pages; i++) {
            const url = `https://www.dice.com/jobs?q=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&page=${i + 1}`;
            console.log(`Navigating to: ${url}`);
            await page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: timeout
            });
            const jobs = await page.evaluate(() => {
                const jobCards = Array.from(document.querySelectorAll('[data-job-guid]') || []);
                return jobCards.map(card => {
                    return {
                        title: card.querySelector('[data-testid="job-search-job-detail-link"]')?.textContent?.trim() || '',
                        company: card.querySelector('[data-rac], .header')?.children[0]?.textContent?.trim() || '',
                        logo: card.querySelector('[data-rac], .header')?.children[0]?.children[0]?.children[0]?.getAttribute('src') || '',
                        location: card.querySelector('.content')?.children[1]?.children[0]?.children[0]?.textContent?.trim() || '',
                        date: card.querySelector('.content')?.children[1]?.children[0]?.children[1]?.textContent?.trim() || '',
                        salary: card.querySelector('.content')?.querySelector('[aria-labelledby="salary-label"]')?.textContent?.trim() || '',
                        apply: card.querySelector('.content')?.querySelector('[aria-labelledby="easyApply-label"]')?.textContent?.trim() || '',
                        jobType: card.querySelector('.content')?.querySelector('[aria-labelledby="employmentType-label"]')?.textContent?.trim() || '',
                        link: card.querySelector('[data-testid="job-search-job-detail-link"]')?.getAttribute('href') || '',
                        description: card.querySelector('.card-description, .job-description')?.textContent?.trim(),
                        source: 'Dice'
                    };
                });
            });
            jobList.push(...jobs);
        }
        console.log(`Found ${jobList.length} jobs`);
        return jobList;
    }
    catch (error) {
        console.error('Error scraping Dice:', error);
        return [];
    }
    finally {
        await browser.close();
    }
};
exports.scrapeDice = scrapeDice;
