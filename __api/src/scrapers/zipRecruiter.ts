import { Page } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { setTimeout } from 'timers/promises';

interface Job {
  title: string;
  company: string;
  location: string;
  link: string;
  date?: string;
  logo?: string;
  salary?: string;
  jobType?: string;
  source: string;
}

export const scrapeZipRecruiter = async (
  query: string,
  location: string = '',
  options: {
    headless?: boolean;
    maxPages?: number;
    slowMo?: number;
  } = {}
): Promise<Job[]> => {
  const {
    headless = true,
    maxPages = 5,
    slowMo = 100
  } = options;

  puppeteer.use(StealthPlugin());
  const browser = await puppeteer.launch({
    headless,
    slowMo,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1280,720',
      '--disable-dev-shm-usage',
      `--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36`
    ]
  });

  const page = await browser.newPage();
  const jobs: Job[] = [];

  try {
    // Configure browser
    await page.setViewport({ width: 1280, height: 720 });
    await page.setJavaScriptEnabled(true);

    // Block unnecessary resources
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    const baseUrl = `https://www.ziprecruiter.com/jobs-search?search=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`;
    let currentPage = 1;

    while (currentPage <= maxPages) {
      const url = currentPage === 1 ? baseUrl : `${baseUrl}&page=${currentPage}`;
      console.log(`Navigating to: ${url}`);

      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      // Check for blocking
      const isBlocked = await page.evaluate(() => {
        return document.title.includes('Access Denied') || 
               document.querySelector('.captcha-container') !== null;
      });

      if (isBlocked) {
        throw new Error('ZipRecruiter has blocked the request');
      }

      try {
        await page.waitForSelector('.job_result_two_pane', { timeout: 30000 });
      } catch (err) {
        console.log('No job cards found, ending pagination');
        break;
      }

      await autoScroll(page);

      // Extract job data
      const pageJobs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.job_result_two_pane')).map(el => {
          const titleEl = el.querySelector('.text-header-sm [target="_self"]');
          const companyEl = el.querySelector('[data-testid="job-card-company"]');
          const locationEl = el.querySelector('[data-testid="job-card-location"]');
          const logoEl = el.querySelector('[srcset]')
          
          return {
            title: titleEl?.textContent?.trim() || '',
            company: companyEl?.textContent?.trim() || '',
            location: locationEl?.textContent?.trim() || '',
            link: titleEl?.getAttribute('href') || '',
            logo: logoEl?.getAttribute('src') || '',
            source: 'ZipRecruiter'
          };
        });
      });

      if (pageJobs.length === 0) break;

      jobs.push(...pageJobs);
      console.log(`Found ${pageJobs.length} jobs on page ${currentPage}`);

      currentPage++;
      await setTimeout(3000 + Math.random() * 4000); 
    }

    return jobs;
  } catch (error) {
    console.error('Error scraping ZipRecruiter:', error);
    await page.screenshot({ path: 'ziprecruiter_error.png' });
    return [];
  } finally {
    await browser.close();
  }
};

async function autoScroll(page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
}