import puppeteer from 'puppeteer';

export const scrapeSimplyHired = async (query: string, location = '', page = 1) => {
  const browser = await puppeteer.launch({ headless: true });
  const pageObj = await browser.newPage();
  const start = (page - 1) * 10;

  const url = `https://www.simplyhired.com/search?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&pn=${page}`;
  await pageObj.goto(url, { waitUntil: 'domcontentloaded' });

  const jobs = await pageObj.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.SerpJob-jobCard'));
    return cards.map((el: any) => ({
      title: el.querySelector('.jobposting-title')?.textContent,
      company: el.querySelector('.JobPosting-labelWithIcon')?.textContent,
      location: el.querySelector('.jobposting-location')?.textContent,
      salary: el.querySelector('.jobposting-salary')?.textContent,
      link: 'https://www.simplyhired.com' + el.querySelector('a')?.getAttribute('href'),
      source: 'SimplyHired',
      description: el.querySelector('.jobposting-snippet')?.textContent,
      date: el.querySelector('.jobposting-date')?.textContent
    }));
  });

  await browser.close();
  return jobs;
};
