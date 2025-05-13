import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { setTimeout } from 'timers/promises';

interface SimplyHiredJob {
  title: string;
  company: string;
  location: string;
  salary?: string;
  link: string;
  source: string;
  description?: string;
  description_short?: string;
  date?: string;
  rating?: string;
  jobType?: string;
  benefits?: string[];
  qualifications?: string[];
  logo?: string;
}

export const scrapeSimplyHired = async (
  query: string,
  location: string = '',
  headless: boolean = true
): Promise<SimplyHiredJob[]> => {
  puppeteer.use(StealthPlugin());

  const browser = await puppeteer.launch({
    headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1920,1080',
      '--disable-dev-shm-usage',
      `--user-agent=Mozilla/5.0`
    ]
  });

  const pageObj = await browser.newPage();
  
  try {
    // realistic browser behavior
    await pageObj.setViewport({ width: 1920, height: 1080 });
    await pageObj.setJavaScriptEnabled(true);

    // Block unnecessary resources
    await pageObj.setRequestInterception(true);
    pageObj.on('request', (req) => {
      if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    const url = `https://www.simplyhired.com/search?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`;
    console.log(`Navigating to: ${url}`);
    
    await pageObj.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Check for blocking
    const isBlocked = await pageObj.evaluate(() => {
      return document.title.includes('Access Denied') || 
             document.querySelector('.challenge-form') !== null;
    });

    if (isBlocked) {
      throw new Error('SimplyHired has blocked the request');
    }

    const selectorsToTry = ['.css-obg9ou', '[data-testid="searchSerpJob"]', '[role="presentation"]', '.SerpJob-jobCard', '.job-card', '.card-job'];
    let jobs: SimplyHiredJob[] = [];
    
    for (const selector of selectorsToTry) {
      try {
        await pageObj.waitForSelector(selector, { timeout: 15000 });
        jobs = await pageObj.evaluate((sel) => {
          const cards = Array.from(document.querySelectorAll(sel))
          return cards.map((el) => ({
            title: el.querySelector('.css-1djbb1k')?.textContent?.trim() || '',
            company: el.querySelector('[data-testid="companyName"]')?.textContent?.trim() || '',
            location: el.querySelector('[data-testid="searchSerpJobLocation"], .css-1t92pv')?.textContent?.trim() || '',
            salary: el.querySelector('[data-testid="searchSerpJobSalaryConfirmed"]')?.textContent?.trim(),
            link: 'https://www.simplyhired.com' + (el.querySelector('a')?.getAttribute('href') || ''),
            source: 'SimplyHired',
            description_short: el.querySelector('[data-testid="searchSerpJobSnippet"]')?.textContent?.trim(),
            description: el.querySelector('.jobposting-snippet, .snippet')?.textContent?.trim(),
            date: el.querySelector('.jobposting-date, .date')?.textContent?.trim(),
            rating: el.querySelector('[data-testid="searchSerpJobCompanyRating"]')?.textContent?.trim()
          }));
        }, selector);
        
        if (jobs.length > 0) break;
      } catch (err) {
        console.log(`Selector ${selector} not found, trying next...`);
      }
    }

    // Visit individual job pages for more details
    if (jobs.length > 0) {
      for (const job of jobs) {
        try {
          const jobPage = await browser.newPage();
          await jobPage.goto(job.link, { waitUntil: 'domcontentloaded', timeout: 30000 });
          
          const jobDetails = await jobPage.evaluate(() => {
            const typeEl = document.querySelector('.css-nzjs22');
            
            return {
              jobType: typeEl?.querySelector('[data-testid="viewJobBodyJobDetailsJobType"]')?.textContent?.trim(),
              logo: typeEl?.querySelector('[data-testid="companyVJLogo"]')?.getAttribute('src'),
              date: typeEl?.querySelector('[data-testid="viewJobBodyJobPostingTimestamp"]')?.textContent?.trim(),
              benefits: Array.from(typeEl?.querySelector('[data-testid="viewJobBodyJobBenefits"]')?.querySelectorAll('[data-testid="viewJobBenefitItem"]') || []).map(el => el.textContent?.trim()),
              qualifications: Array.from(typeEl?.querySelector('[data-testid="viewJobQualificationsContainer"]')?.querySelectorAll('[data-testid="viewJobQualificationItem"]') || []).map(el => el.textContent?.trim()),
              fullDescription: document.querySelector('[data-testid="viewJobBodyJobFullDescriptionContent"]')?.textContent?.trim()
            };
          });

          job.jobType = jobDetails.jobType;
          job.description = jobDetails.fullDescription || job.description;
          job.date = jobDetails.date;
          job.benefits = jobDetails.benefits as string[];
          job.qualifications = jobDetails.qualifications as string[];
          job.logo = jobDetails.logo as string;
          
          await setTimeout(2000 + Math.random() * 3000);
          await jobPage.close();
        } catch (error) {
          console.log(`Couldn't fetch details for ${job.link}:`, error);
        }
      }
    }

    return jobs;
  } catch (error) {
    console.error('Error scraping SimplyHired:', error);
    
    // Save debug files
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await pageObj.screenshot({ path: `simplyhired_error_${timestamp}.png` });
    const html = await pageObj.content();
    require('fs').writeFileSync(`simplyhired_page_${timestamp}.html`, html);
    
    return [];
  } finally {
    await browser.close();
  }
};