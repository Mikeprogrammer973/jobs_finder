"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchJobs = void 0;
const linkedin_1 = require("../scrapers/linkedin");
const remoteok_1 = require("../scrapers/remoteok");
const remotive_1 = require("../scrapers/remotive");
const weworkremotely_1 = require("../scrapers/weworkremotely");
const glassdoor_1 = require("../scrapers/glassdoor");
const simplyhired_1 = require("../scrapers/simplyhired");
const dice_1 = require("../scrapers/dice");
const zipRecruiter_1 = require("../scrapers/zipRecruiter");
const searchJobs = async (req, res) => {
    const { query = '', location = '', page = 1, remote, type, source } = req.query;
    const key = `jobs:${query}:${location}:${page}:${remote}:${type}:${source}`;
    // Configura SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    // Função para enviar dados via SSE
    const sendEvent = (data, event = 'message') => {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
        res.flushHeaders();
    };
    const scrapers = [
        { name: 'RemoteOK', fn: () => (0, remoteok_1.scrapeRemoteOK)(query.toString()) },
        { name: 'Remotive', fn: () => (0, remotive_1.scrapeRemotive)(query.toString()) },
        { name: 'Dice', fn: () => (0, dice_1.scrapeDice)(query.toString()) },
        { name: 'WeWorkRemotely', fn: () => (0, weworkremotely_1.scrapeWWR)(query.toString()) },
        { name: 'ZipRecruiter', fn: () => (0, zipRecruiter_1.scrapeZipRecruiter)(query.toString()), location },
        { name: 'SimplyHired', fn: () => (0, simplyhired_1.scrapeSimplyHired)(query.toString(), location.toString()) },
        { name: 'Glassdoor', fn: () => (0, glassdoor_1.scrapeGlassdoor)(query.toString(), location.toString(), Number(page.toLocaleString())) },
        { name: 'LinkedIn', fn: () => (0, linkedin_1.scrapeLinkedIn)(query.toString()) },
    ];
    const allResults = [];
    for (const { name, fn } of scrapers) {
        try {
            console.log({ status: 'progress', message: `Iniciando busca no ${name}...` });
            const startTime = Date.now();
            const results = await fn();
            const duration = Date.now() - startTime;
            // Filtrar resultados conforme parâmetros
            const filtered = results.filter((job) => {
                if (remote && remote !== 'false' && job.type?.toLowerCase() !== 'remote')
                    return false;
                if (type && job.type && job.type.toLowerCase() !== type.toString().toLowerCase())
                    return false;
                if (source && job.source && job.source.toLowerCase() !== source.toString().toLowerCase())
                    return false;
                if (location && job.location && !job.location.toLowerCase().includes(location.toString().toLowerCase()))
                    return false;
                return true;
            });
            allResults.push(...filtered);
            sendEvent({
                status: 'progress',
                source: name,
                count: filtered.length,
                duration: `${duration}ms`,
                data: filtered
            });
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        catch (error) {
            sendEvent({
                status: 'error',
                source: name,
                message: `Erro ao buscar em ${name}: ${error.message}`
            });
        }
    }
    sendEvent({
        status: 'complete',
        cached: false,
        count: allResults.length,
        data: allResults
    }, 'complete');
    res.end();
};
exports.searchJobs = searchJobs;
