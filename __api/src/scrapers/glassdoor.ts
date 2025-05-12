import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { setTimeout } from 'timers/promises';
import { Browser, Page } from 'puppeteer';

interface GlassdoorJob {
  title: string;
  company: string;
  location: string;
  salary?: string;
  link: string;
  source: string;
  date?: string;
  description?: string;
  rating?: string;
  logo?: string;
  jobType?: string;
}

export const scrapeGlassdoor = async (
  query: string,
  location: string = '',
  page: number = 1,
  maxJobs: number = 10,
  headless: boolean = false // Mantenha false para debug
): Promise<GlassdoorJob[]> => {
  // Configuração avançada para evitar detecção
  puppeteer.use(StealthPlugin());
  const browser = await puppeteer.launch({
    headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1920,1080',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      `--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`
    ]
  });

  const pageObj = await browser.newPage();
  
  try {
    // Configurações browser
    await pageObj.setViewport({ width: 1920, height: 1080 });
    await pageObj.setJavaScriptEnabled(true);

    // Interceptação de requests para melhor performance
    await pageObj.setRequestInterception(true);
    pageObj.on('request', (req) => {
      if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Construção da URL com parâmetros
    const url = buildGlassdoorUrl(query, location, page);
    console.log(`Acessando: ${url}`);

    // Navegação com timeout aumentado
    await pageObj.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 90000
    });

    // Verificação de bloqueios
    await checkForBlocks(pageObj);

    // Espera dinâmica pelos resultados
    await waitForJobListings(pageObj);

    // Extração dos dados
    const jobs = await extractJobData(pageObj, maxJobs);

    // Visita páginas individuais para mais detalhes
    await enrichJobDetails(browser, jobs);

    return jobs;
  } catch (error) {
    console.error('Erro durante scraping:', error);
    await saveDebugFiles(pageObj);
    return [];
  } finally {
    await browser.close();
  }
};

function buildGlassdoorUrl(query: string, location: string, page: number): string {
  const baseUrl = 'https://www.glassdoor.com/Job/jobs.htm';
  const params = new URLSearchParams({
    'sc.keyword': query,
    p: page.toString(),
    fromAge: '-1',
    minSalary: '0',
    includeNoSalaryJobs: 'true',
    radius: '100',
    minRating: '0.0',
    industryId: '-1',
    sgocId: '-1',
    empType: 'all',
    applicationType: '0',
    remoteWorkType: '0'
  });

  if (location) {
    params.set('locT', 'N');
    params.set('locId', '1');
    params.set('typedKeyword', location);
  }

  return `${baseUrl}?${params.toString()}`;
}

async function checkForBlocks(page: Page): Promise<void> {
  try {
    // Verifica se há CAPTCHA
    if (await page.$('#captchaChallenge') !== null) {
      throw new Error('CAPTCHA detectado - requer intervenção manual');
    }

    // Verifica se há wall de login
    if (await page.$('#InlineLoginModule') !== null) {
      throw new Error('Glassdoor requer login para visualizar vagas');
    }

    // Verifica se há mensagem de bloqueio
    const blockMsg = await page.$eval('body', el => 
      el.textContent?.includes('Access Denied') ? 'Access Denied' : null
    );
    if (blockMsg) {
      throw new Error(`Bloqueio detectado: ${blockMsg}`);
    }
  } catch (error) {
    console.log('Erro na verificação de bloqueios:', error);
    throw error;
  }
}

async function waitForJobListings(page: Page): Promise<void> {
  const selectorsToTry = [
    '[data-test="jobListing"]',
    '.react-job-listing',
    '.jobListing',
    '.jlGrid',
    '[id^="JobListing_"]'
  ];

  for (const selector of selectorsToTry) {
    try {
      await page.waitForSelector(selector, { timeout: 20000 });
      return;
    } catch (e) {
      console.log(`Seletor ${selector} não encontrado, tentando próximo...`);
    }
  }

  throw new Error('Não foi possível encontrar listagens de vagas');
}

async function extractJobData(page: Page, maxJobs: number): Promise<GlassdoorJob[]> {
  return page.evaluate((max) => {
    const jobElements = Array.from(
      document.querySelectorAll('[data-test="jobListing"], .react-job-listing, .jl')
    ).slice(0, max);

    return jobElements.map((el) => {
      const titleEl = el.querySelector('[data-test="job-title"], .JobCard_jobTitle__GLyJ1');
      const companyEl = el.querySelector('[data-test="employer-name"], .EmployerProfile_compactEmployerName__9MGcV');
      const locationEl = el.querySelector('[data-test="emp-location"], .JobCard_location__Ds1fM');
      const salaryEl = el.querySelector('[data-test="detailSalary"], .JobCard_salaryEstimate__QpbTW');
      const dateEl = el.querySelector('[data-test="job-age"], .jobDate');
      const ratingEl = el.querySelector('[data-test="rating"], .rating-single-star_RatingText__XENmU');
      const logoEl = el.querySelector('.avatar-base_Image__2RcF9');

      return {
        title: titleEl?.textContent?.trim() || '',
        company: companyEl?.textContent?.trim() || '',
        location: locationEl?.textContent?.trim() || '',
        salary: salaryEl?.textContent?.trim(),
        link: titleEl?.getAttribute('href') 
          ? 'https://www.glassdoor.com' + titleEl.getAttribute('href') 
          : '',
        source: 'Glassdoor',
        date: dateEl?.textContent?.trim(),
        rating: ratingEl?.textContent?.trim(),
        logo: logoEl?.getAttribute('src')
      } as GlassdoorJob;
    });
  }, maxJobs);
}

async function enrichJobDetails(browser: Browser, jobs: GlassdoorJob[]): Promise<void> {
  for (const job of jobs) {
    if (!job.link || !job.link.includes('glassdoor.com')) continue;

    try {
      const jobPage = await browser.newPage();
      await jobPage.setViewport({ width: 1920, height: 1080 });
      
      // Navegação com timeout
      await jobPage.goto(job.link, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      // Extrai detalhes adicionais
      const details = await jobPage.evaluate(() => {
        const descEl = document.querySelector('.JobDetails_jobDescription__uW_fK .JobDetails_showHidden__C_FOA');
        const typeEl = Array.from(document.querySelectorAll('.jobInfoItem'))
          .find(el => el.textContent?.includes('Employment Type'));
        
        return {
          description: descEl?.textContent?.trim(),
          jobType: typeEl?.querySelector('.value')?.textContent?.trim()
        };
      });

      job.description = details.description;
      job.jobType = details.jobType;

      // Delay aleatório
      await setTimeout(2000 + Math.random() * 3000);
      await jobPage.close();
    } catch (error) {
      console.log(`Erro ao obter detalhes para ${job.link}:`, error);
    }
  }
}

async function saveDebugFiles(page: Page): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  try {
    await page.screenshot({ path: `glassdoor_error_${timestamp}.png`, fullPage: true });
    const html = await page.content();
    require('fs').writeFileSync(`glassdoor_page_${timestamp}.html`, html);
    console.log(`Arquivos de debug salvos: glassdoor_error_${timestamp}.png/html`);
  } catch (e) {
    console.error('Erro ao salvar arquivos de debug:', e);
  }
}