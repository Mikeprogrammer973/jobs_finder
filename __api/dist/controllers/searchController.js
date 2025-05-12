"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchJobs = void 0;
const linkedin_1 = require("../scrapers/linkedin");
const remoteok_1 = require("../scrapers/remoteok");
const remotive_1 = require("../scrapers/remotive");
const weworkremotely_1 = require("../scrapers/weworkremotely");
const glassdoor_1 = require("../scrapers/glassdoor");
const simplyhired_1 = require("../scrapers/simplyhired");
const searchJobs = async (req, res) => {
    const { query = '', location = '', page = 1, remote, type, source } = req.query;
    // const key = `jobs:${query}:${location}:${page}:${remote}:${type}:${source}`;
    // const cached = await getCache(key);
    // if (cached) return res.json({ cached: true, data: cached });
    const scrapers = [
        (0, linkedin_1.scrapeLinkedIn)(query, 10),
        (0, remoteok_1.scrapeRemoteOK)(query),
        (0, remotive_1.scrapeRemotive)(query),
        (0, weworkremotely_1.scrapeWWR)(query),
        (0, glassdoor_1.scrapeGlassdoor)(query),
        (0, simplyhired_1.scrapeSimplyHired)(query),
    ];
    const results = (await Promise.allSettled(scrapers)).flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
    const filtered = results.filter((job) => {
        if (remote && job.type?.toLowerCase() !== 'remote')
            return false;
        if (type && job.type && job.type.toLowerCase() !== type.toLowerCase())
            return false;
        if (source && job.source && job.source.toLowerCase() !== source.toLowerCase())
            return false;
        return true;
    });
    // await setCache(key, filtered, 3600);
    res.json({ cached: false, count: filtered.length, data: filtered });
};
exports.searchJobs = searchJobs;
