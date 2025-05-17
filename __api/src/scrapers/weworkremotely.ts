import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import path = require('path');


interface WWRJob {
  title: string;
  company: string;
  location: string;
  link: string;
  source: string;
  type: string;
  date?: string;
  description?: string;
  salary?: string;
  apply_before?: string;
  category?: string;
  logo?: string;
  jobType?: string;
  benefits?: string[];
  qualifications?: string[];
}

interface ScrapeOptions {
  query: string;
  location?: string;
  limit?: number;
  headless?: boolean;
  timeout?: number;
}


export const scrapeWWR = async (query: string) => {
  puppeteer.use(StealthPlugin());
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: './chrome/linux-136.0.7103.94/chrome-linux64/chrome'
  })

  try {
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0');
    await page.setViewport({ width: 1366, height: 768 });

    await page.goto(`https://weworkremotely.com/remote-jobs/search?term=${encodeURIComponent(query)}`, {
      waitUntil: 'networkidle2',
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
        const logo = el.querySelector<HTMLDivElement>('.tooltip--flag-logo__flag-logo')?.style?.backgroundImage?.match(/url\((.*?)\)/)?.[1] || ''
        
        return {
          title: titleEl?.textContent?.trim() || '',
          company: companyEl?.textContent?.trim() || '',
          link: linkEl?.getAttribute('href') ? 'https://weworkremotely.com' + linkEl.getAttribute('href') : '',
          source: 'WeWorkRemotely',
          logo: logo
        } as WWRJob;
      }).filter(job => job.title && job.company);
    });

    await browser.close();
    return jobs;
  } catch (error) {
    console.error('Error scraping We Work Remotely:', error);
    await browser.close();
    return [];
  }
  };
