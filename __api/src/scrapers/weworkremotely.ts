import axios from 'axios';
import cheerio from 'cheerio';

export const scrapeWWR = async (query: string) => {
  const { data } = await axios.get(`https://weworkremotely.com/remote-jobs/search?term=${query}`);
  const $ = cheerio.load(data);
  const jobs: any[] = [];

  $('.jobs li:not(.view-all)').each((_, el) => {
    const title = $(el).find('.title').text().trim();
    const company = $(el).find('.company').text().trim();
    const link = 'https://weworkremotely.com' + $(el).find('a').attr('href');
    const date = $(el).find('.date').text().trim();
    const type = $(el).find('.type').text().trim() || 'Remote'
    const location = $(el).find('.location').text().trim() || 'Remote'
    const description = $(el).find('.description').text().trim();
    const salary = $(el).find('.salary').text().trim();
    const benefits = $(el).find('.benefits').text().trim();
    const requirements = $(el).find('.requirements').text().trim();
    const qualifications = $(el).find('.qualifications').text().trim();
    const responsibilities = $(el).find('.responsibilities').text().trim();

    if (title && company) {
      jobs.push({ title, company, location, link, source: 'WeWorkRemotely', type, date, description, salary, benefits, requirements, qualifications, responsibilities });
    }
  });

  return jobs;
};
