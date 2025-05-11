"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeRemoteOK = void 0;
const axios_1 = __importDefault(require("axios"));
const scrapeRemoteOK = async (query) => {
    const { data } = await axios_1.default.get(`https://remoteok.com/api`);
    return data
        .filter((job) => job.position?.toLowerCase().includes(query.toLowerCase()))
        .map((job) => ({
        title: job.position,
        company: job.company,
        location: job.location || 'Remote',
        salary: job.salary,
        link: `https://remoteok.com${job.url}`,
        logo: job.logo,
        source: 'RemoteOK',
        type: 'Remote',
        description: job.description || 'No description available'
    }));
};
exports.scrapeRemoteOK = scrapeRemoteOK;
