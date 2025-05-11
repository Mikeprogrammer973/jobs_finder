"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchJobs = void 0;
const weworkremotely_1 = require("../scrapers/weworkremotely");
const cache_1 = require("../utils/cache");
const searchJobs = async (req, res) => {
    const { query = '', location = '', page = 1, remote, type, source } = req.query;
    const key = `jobs:${query}:${location}:${page}:${remote}:${type}:${source}`;
    const cached = await (0, cache_1.getCache)(key);
    if (cached)
        return res.json({ cached: true, data: cached });
    const scrapers = [
        // scrapeLinkedIn(query, page),
        // scrapeIndeed(query, location, page),
        // scrapeRemoteOK(query),
        // scrapeRemotive(query),
        (0, weworkremotely_1.scrapeWWR)(query),
        // scrapeGlassdoor(query),
        // scrapeSimplyHired(query),
    ];
    const results = (await Promise.allSettled(scrapers)).flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
    //   await persistJobs(results);
    const filtered = results.filter((job) => {
        if (remote && job.type?.toLowerCase() !== 'remote')
            return false;
        if (type && job.type && job.type.toLowerCase() !== type.toLowerCase())
            return false;
        if (source && job.source && job.source.toLowerCase() !== source.toLowerCase())
            return false;
        return true;
    });
    await (0, cache_1.setCache)(key, filtered, 3600);
    res.json({ cached: false, count: filtered.length, data: filtered });
};
exports.searchJobs = searchJobs;
