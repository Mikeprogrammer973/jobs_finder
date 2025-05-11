import puppeteer from 'puppeteer';

export const scrapeGlassdoor = async (query: string, location = '', page = 1) => {
  const browser = await puppeteer.launch({ headless: true });
  const pageObj = await browser.newPage(); 
  const start = (page - 1) * 10;

  const url = `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(query)}&locT=C&locId=&jobType=&fromAge=-1&minSalary=0&includeNoSalaryJobs=true&radius=0&cityId=&minRating=0.0&industryId=-1&sgocId=-1&empType=all&applicationType=0&remoteWorkType=0&p=${page}`;
  await pageObj.goto(url, { waitUntil: 'domcontentloaded' });

  const jobs = await pageObj.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.react-job-listing'));
    return cards.map((el: any) => ({
      title: el.querySelector('.jobLink span')?.textContent,
      company: el.querySelector('.jobEmpolyerName')?.textContent,
      location: el.querySelector('.jobLocation')?.textContent,
      salary: el.querySelector('.salary-estimate')?.textContent,
      link: 'https://www.glassdoor.com' + el.getAttribute('href'),
      source: 'Glassdoor',
      date: el.querySelector('.jobDate')?.textContent,
      description: el.querySelector('.jobDescriptionContent')?.textContent
    }));
  });

  await browser.close();
  return jobs;
};
