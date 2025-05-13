import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';;

interface LinkedInJob {
  title: string;
  company: string;
  location: string;
  link: string;
  date?: string;
  description?: string;
  salary?: string;
  benefits?: string;
  jobType?: string; // Part-time, Full-time, etc.
  qualifications?: string;
  requirements?: string;
  logo?: string;
  source: string;
}

export const scrapeLinkedIn = async (
  query: string,
  headless: boolean = true
): Promise<LinkedInJob[]> => {
  // Configuração do Puppeteer com Stealth
  puppeteer.use(StealthPlugin());
  const browser = await puppeteer.launch({
    headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1920,1080',
      `--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`
    ]
  });

  const pageObj = await browser.newPage();
  
  try {
    // Configurações browser
    await pageObj.setViewport({ width: 1920, height: 1080 });
    await pageObj.setJavaScriptEnabled(true);

    // Navegação para a página de vagas
    const url = `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(query)}`;
    
    console.log(`Acessando: ${url}`);
    await pageObj.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Verificação de login
    if (await pageObj.$('.authwall') !== null) {
      throw new Error('LinkedIn requer login para visualizar vagas');
    }

    // Espera pelos resultados
    await pageObj.waitForSelector('.jobs-search__results-list', { timeout: 15000 });

    // Extração dos dados principais
    const jobElements = await pageObj.$$('.jobs-search__results-list li');
    const limitedJobs = jobElements;
    const jobs: LinkedInJob[] = [];

    for (const [index, elHandle] of limitedJobs.entries()) {
      try {
        const el = await elHandle.evaluateHandle(el => el);
        
        // Extrai dados básicos
        const jobInfo = await pageObj.evaluate(el => {
          const extractText = (selector: string) => 
            el.querySelector(selector)?.textContent?.trim() || '';
            
          return {
            title: extractText('.base-search-card__title'),
            company: extractText('.base-search-card__subtitle'),
            location: extractText('.job-search-card__location'),
            link: el.querySelector<HTMLAnchorElement>('.base-card__full-link')?.href || '',
            date: extractText('.job-search-card__listdate'),
            description: extractText('.job-search-card__description'),
            salary: extractText('.job-search-card__salary-info'),
            benefits: extractText('.job-search-card__benefits'),
            logo: el.getElementsByTagName('img')[0].getAttribute('src') || ''
          };
        }, el);

        jobs.push({
          ...jobInfo,
          source: 'LinkedIn'
        });
      } catch (error) {
        console.log(`Erro ao processar vaga ${index + 1}:`, error);
      }
    }

    return jobs;
  } catch (error) {
    console.error('Erro durante o scraping:', error);
    return [];
  } finally {
    await browser.close();
  }
};