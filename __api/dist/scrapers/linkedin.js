"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeLinkedIn = void 0;
const puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
const scrapeLinkedIn = async (query, page = 1, headless = true) => {
    // Configuração do Puppeteer com Stealth
    puppeteer_extra_1.default.use((0, puppeteer_extra_plugin_stealth_1.default)());
    const browser = await puppeteer_extra_1.default.launch({
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
        const start = (page - 1) * 25;
        const url = `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(query)}&start=${start}`;
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
        const jobs = [];
        for (const [index, elHandle] of limitedJobs.entries()) {
            try {
                const el = await elHandle.evaluateHandle(el => el);
                // Extrai dados básicos
                const jobInfo = await pageObj.evaluate(el => {
                    const extractText = (selector) => el.querySelector(selector)?.textContent?.trim() || '';
                    return {
                        title: extractText('.base-search-card__title'),
                        company: extractText('.base-search-card__subtitle'),
                        location: extractText('.job-search-card__location'),
                        link: el.querySelector('.base-card__full-link')?.href || '',
                        date: extractText('.job-search-card__listdate'),
                        description: extractText('.job-search-card__description'),
                        salary: extractText('.job-search-card__salary-info'),
                        benefits: extractText('.job-search-card__benefits'),
                        logo: el.querySelector('img.artdeco-entity-image, .ivm-view-attr__img--centered')?.src || ''
                    };
                }, el);
                jobs.push({
                    ...jobInfo,
                    source: 'LinkedIn'
                });
                // Visita a página individual da vaga para mais detalhes
                if (jobInfo.link) {
                    const newPage = await browser.newPage();
                    await newPage.setViewport({ width: 1920, height: 1080 });
                    try {
                        await newPage.goto(jobInfo.link, {
                            waitUntil: 'domcontentloaded',
                            timeout: 30000
                        });
                        // Extrai detalhes adicionais
                        const jobDetails = await newPage.evaluate(() => {
                            const description = document.querySelector('.description__text')?.textContent?.trim() || '';
                            // Extrai tipo de vaga
                            const jobTypeElement = Array.from(document.querySelectorAll('.description__job-criteria-list li'))
                                .find(li => li.querySelector('h3')?.textContent?.trim() === 'Employment type');
                            const jobType = jobTypeElement?.querySelector('span')?.textContent?.trim();
                            // Extrai outras qualificações
                            const qualifications = Array.from(document.querySelectorAll('.description__job-criteria-list li'))
                                .map(li => {
                                const label = li.querySelector('h3')?.textContent?.trim();
                                const value = li.querySelector('span')?.textContent?.trim();
                                return `${label}: ${value}`;
                            })
                                .join(' | ');
                            return { description, jobType, qualifications };
                        });
                        jobs.push({
                            ...jobInfo,
                            description: jobDetails.description || jobInfo.description,
                            jobType: jobDetails.jobType,
                            qualifications: jobDetails.qualifications,
                            source: 'LinkedIn'
                        });
                        // Delay aleatório 
                        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
                    }
                    catch (error) {
                        console.log(`Erro ao acessar vaga ${index + 1}:`, error);
                        // Adiciona mesmo sem os detalhes completos
                        jobs.push({
                            ...jobInfo,
                            source: 'LinkedIn'
                        });
                    }
                    finally {
                        await newPage.close();
                    }
                }
                else {
                    jobs.push({
                        ...jobInfo,
                        source: 'LinkedIn'
                    });
                }
            }
            catch (error) {
                console.log(`Erro ao processar vaga ${index + 1}:`, error);
            }
        }
        return jobs;
    }
    catch (error) {
        console.error('Erro durante o scraping:', error);
        return [];
    }
    finally {
        await browser.close();
    }
};
exports.scrapeLinkedIn = scrapeLinkedIn;
