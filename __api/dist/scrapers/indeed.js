"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeIndeed = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = __importDefault(require("cheerio"));
const scrapeIndeed = async (query, location = '', page = 1) => {
    const start = (page - 1) * 10;
    const url = `https://www.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&start=${start}`;
    const { data } = await axios_1.default.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio_1.default.load(data);
    const jobs = [];
    $('.resultContent').each((_, el) => {
        const title = $(el).find('h2.jobTitle span').last().text().trim();
        const company = $(el).find('.companyName').text().trim();
        const location = $(el).find('.companyLocation').text().trim();
        const salary = $(el).find('.salary-snippet').text().trim();
        const link = 'https://www.indeed.com' + $(el).parent().attr('href');
        const date = $(el).find('.date').text().trim();
        const description = $(el).find('.job-snippet').text().trim();
        const qualifications = $(el).find('.qualifications').text().trim();
        const requirements = $(el).find('.requirements').text().trim();
        const logo = $(el).find('.companyLogo').attr('src');
        const benefits = $(el).find('.benefits').text().trim();
        jobs.push({ title, company, location, salary, link, date, description, qualifications, requirements, logo, benefits, source: 'Indeed' });
    });
    return jobs;
};
exports.scrapeIndeed = scrapeIndeed;
