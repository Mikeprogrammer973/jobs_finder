"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeWWR = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = __importDefault(require("cheerio"));
const scrapeWWR = async (query) => {
    const { data } = await axios_1.default.get(`https://weworkremotely.com/remote-jobs/search?term=${query}`);
    const $ = cheerio_1.default.load(data);
    const jobs = [];
    $('.jobs li:not(.view-all)').each((_, el) => {
        const title = $(el).find('.title').text().trim();
        const company = $(el).find('.company').text().trim();
        const link = 'https://weworkremotely.com' + $(el).find('a').attr('href');
        const date = $(el).find('.date').text().trim();
        const type = $(el).find('.type').text().trim() || 'Remote';
        const location = $(el).find('.location').text().trim() || 'Remote';
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
exports.scrapeWWR = scrapeWWR;
