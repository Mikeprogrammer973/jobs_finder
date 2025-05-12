"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeRemotive = void 0;
const axios_1 = __importDefault(require("axios"));
const scrapeRemotive = async (query) => {
    const { data } = await axios_1.default.get('https://remotive.com/api/remote-jobs');
    return data.jobs
        .filter((job) => job.title.toLowerCase().includes(query.toLowerCase()))
        .map((job) => ({
        title: job.title,
        company: job.company_name,
        location: job.candidate_required_location,
        salary: job.salary,
        link: job.url,
        logo: job.company_logo_url,
        source: 'Remotive',
        type: job.job_type,
        date: job.created_at,
        description: job.description,
        tags: job.tags
    }));
};
exports.scrapeRemotive = scrapeRemotive;
