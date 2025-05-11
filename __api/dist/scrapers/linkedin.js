"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeLinkedIn = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = __importDefault(require("cheerio"));
const scrapeLinkedIn = async (query, page = 1) => {
    const start = (page - 1) * 25;
    const url = `https://www.linkedin.com/jobs/search?keywords=${query}&start=${start}`;
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
    };
    const response = await axios_1.default.get(url, { headers });
    const $ = cheerio_1.default.load(response.data);
    const jobs = [];
    $('ul.jobs-search__results-list li').each((_, el) => {
        const title = $(el).find('.base-search-card__title').text().trim();
        const company = $(el).find('.base-search-card__subtitle').text().trim();
        const location = $(el).find('.job-search-card__location').text().trim();
        const link = $(el).find('.base-card__full-link').attr('href') || '';
        const date = $(el).find('.job-search-card__listdate').text().trim();
        const description = $(el).find('.job-search-card__description').text().trim();
        const salary = $(el).find('.job-search-card__salary-info').text().trim();
        const benefits = $(el).find('.job-search-card__benefits').text().trim();
        const qualifications = $(el).find('.job-search-card__qualifications').text().trim();
        const requirements = $(el).find('.job-search-card__job-details').text().trim();
        const logo = $(el).find('img.artdeco-entity-image').attr('data-delayed-url') || '';
        if (title) {
            jobs.push({
                title,
                company,
                location,
                link,
                date,
                description,
                salary,
                benefits,
                qualifications,
                requirements,
                logo,
                source: 'LinkedIn'
            });
        }
    });
    return jobs;
};
exports.scrapeLinkedIn = scrapeLinkedIn;
