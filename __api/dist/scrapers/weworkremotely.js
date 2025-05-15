"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeWWR = void 0;
// import puppeteer from 'puppeteer-extra';
// import StealthPlugin from 'puppeteer-extra-plugin-stealth';
const playwright_1 = require("playwright");
const scrapeWWR = async (query) => {
    // puppeteer.use(StealthPlugin());
    const browser = await playwright_1.chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
        const page = await browser.newPage();
        // await page.setUserAgent('Mozilla/5.0');
        // await page.setViewport({ width: 1366, height: 768 });
        await page.goto(`https://weworkremotely.com/remote-jobs/search?term=${encodeURIComponent(query)}`, {
            // waitUntil: 'networkidle2',
            timeout: 60000
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
        // Visit individual job pages for more details
        if (jobs.length > 0) {
            for (const job of jobs) {
                try {
                    const jobPage = await browser.newPage();
                    await jobPage.goto(job.link, { waitUntil: 'domcontentloaded', timeout: 30000 });
                    const jobDetails = await jobPage.evaluate(() => {
                        const typeEl = document.querySelector('.lis-container');
                        const job_info = typeEl?.querySelector('.lis-container__job__sidebar__job-about__list')?.querySelectorAll('.lis-container__job__sidebar__job-about__list__item') || [];
                        return {
                            jobType: typeEl?.querySelector('box--jobType')?.textContent?.trim(),
                            date: job_info[0]?.textContent?.trim(),
                            apply_before: job_info[1]?.textContent?.trim(),
                            category: job_info[3]?.textContent?.trim(),
                            location: job_info[4]?.textContent?.trim(),
                            fullDescription: document.querySelector('.lis-container__job__content__description')?.textContent?.trim()
                        };
                    });
                    job.jobType = jobDetails.jobType;
                    job.description = jobDetails.fullDescription || job.description;
                    job.date = jobDetails.date;
                    job.apply_before = jobDetails.apply_before;
                    job.category = jobDetails.category;
                    job.location = jobDetails.location;
                    await jobPage.close();
                }
                catch (error) {
                    console.log(`Couldn't fetch details for ${job.link}:`, error);
                }
            }
        }
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
