"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeIndeed = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = __importDefault(require("cheerio"));
const scrapeIndeed = async (query, location = '', page = 1, maxJobs = 5) => {
    try {
        const ZENROWS_API_KEY = '8d7128b940c81592a7efe255add41d18d008e996'; // Substitua pela sua chave
        const start = (page - 1) * 10;
        const indeedUrl = `https://www.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&start=${start}`;
        // Configuração completa do ZenRows
        const zenRowsUrl = `https://api.zenrows.com/v1/?url=${encodeURIComponent(indeedUrl)}&apikey=${ZENROWS_API_KEY}&js_render=true&premium_proxy=true&antibot=true&wait=2000`;
        // 1. Fazer a requisição com tratamento de timeout
        const response = await axios_1.default.get(zenRowsUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            timeout: 40000 // 40 segundos
        });
        // 2. Verificar se a resposta contém HTML válido
        if (!response.data || typeof response.data !== 'string') {
            throw new Error('Resposta da API ZenRows inválida');
        }
        // 3. Carregar o HTML no Cheerio com verificação
        const $ = cheerio_1.default.load(response.data);
        if (!$('body').length) {
            throw new Error('HTML inválido retornado pelo ZenRows');
        }
        // 4. Verificar se estamos na página correta
        const isBlocked = $('title').text().includes('Access Denied') ||
            $('body').text().includes('bot detected');
        if (isBlocked) {
            throw new Error('Acesso bloqueado pelo Indeed');
        }
        // 5. Extração de dados com fallbacks robustos
        const jobs = [];
        const jobElements = $('.job_seen_beacon, .resultContent').slice(0, maxJobs);
        if (jobElements.length === 0) {
            console.warn('Nenhuma vaga encontrada - possivelmente estrutura alterada');
            return [];
        }
        jobElements.each((_, el) => {
            try {
                const title = $(el).find('h2.jobTitle span[title]').attr('title') ||
                    $(el).find('h2.jobTitle').text().trim();
                const company = $(el).find('[data-testid="company-name"]').text().trim() ||
                    $(el).find('.companyName').text().trim();
                if (!title || !company)
                    return; // Pular entradas inválidas
                const job = {
                    title,
                    company,
                    location: $(el).find('[data-testid="text-location"]').text().trim() ||
                        $(el).find('.companyLocation').text().trim() || 'Remote',
                    salary: $(el).find('.salary-snippet, .salaryText').text().trim(),
                    link: '',
                    date: $(el).find('.date').text().trim(),
                    description: $(el).find('.job-snippet').text().trim(),
                    source: 'Indeed',
                    jobType: ''
                };
                // Construir link corretamente
                const href = $(el).find('a[href*="/rc/clk?"]').attr('href') ||
                    $(el).find('a[href*="/viewjob?"]').attr('href') ||
                    $(el).find('a.jobTitle').attr('href');
                job.link = href ? (href.startsWith('http') ? href : `https://www.indeed.com${href}`) : '';
                jobs.push(job);
            }
            catch (error) {
                console.error('Erro ao processar vaga individual:', error);
            }
        });
        // 6. Retornar os dados básicos (opcional: remover o detalhamento individual se estiver causando problemas)
        return jobs;
    }
    catch (error) {
        console.error('Erro no scraping com ZenRows:', error.response?.data || error.message);
        return [];
    }
};
exports.scrapeIndeed = scrapeIndeed;
