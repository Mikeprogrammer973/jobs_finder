"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeSimplyHired = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const scrapeSimplyHired = async (query, location = '', page = 1) => {
    const browser = await puppeteer_1.default.launch({ headless: true });
    const pageObj = await browser.newPage();
    const start = (page - 1) * 10;
    const url = `https://www.simplyhired.com/search?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&pn=${page}`;
    await pageObj.goto(url, { waitUntil: 'domcontentloaded' });
    const jobs = await pageObj.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.SerpJob-jobCard'));
        return cards.map((el) => ({
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
exports.scrapeSimplyHired = scrapeSimplyHired;
