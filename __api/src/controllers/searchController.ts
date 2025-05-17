import { Request, Response } from 'express';
import { scrapeLinkedIn } from '../scrapers/linkedin';
import { scrapeRemoteOK } from '../scrapers/remoteok';
import { scrapeRemotive } from '../scrapers/remotive';
import { scrapeWWR } from '../scrapers/weworkremotely';
import { scrapeGlassdoor } from '../scrapers/glassdoor';
import { scrapeSimplyHired } from '../scrapers/simplyhired';
import { scrapeDice } from '../scrapers/dice';
import { scrapeZipRecruiter } from '../scrapers/zipRecruiter';

export const searchJobs = async (req: Request, res: Response) => {
  const {
    query = '',
    location = '',
    page = 1,
    remote,
    type,
    source
  } = req.query;

  const key = `jobs:${query}:${location}:${page}:${remote}:${type}:${source}`;
  
  // Configura SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Função para enviar dados via SSE
  const sendEvent = (data: any, event = 'message') => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    res.flushHeaders()
  };

  const scrapers = [
    { name: 'RemoteOK', fn: () => scrapeRemoteOK(query.toString()) },
    { name: 'Remotive', fn: () => scrapeRemotive(query.toString()) },
    { name: 'Dice', fn: () => scrapeDice(query.toString())},
    { name: 'WeWorkRemotely', fn: () => scrapeWWR(query.toString()) },
    { name: 'ZipRecruiter', fn: () => scrapeZipRecruiter(query.toString()), location },
    { name: 'SimplyHired', fn: () => scrapeSimplyHired(query.toString(), location.toString())},
    { name: 'Glassdoor', fn: () => scrapeGlassdoor(query.toString(), location.toString(), Number(page.toLocaleString()) )},
    { name: 'LinkedIn', fn: () => scrapeLinkedIn(query.toString()) }, 
  ];

  const allResults: any[] = [];

  for (const { name, fn } of scrapers) {
    try {
      console.log({ status: 'progress', message: `Iniciando busca no ${name}...` });
      
      const startTime = Date.now();
      const results = await fn();
      const duration = Date.now() - startTime;

      // Filtrar resultados conforme parâmetros
      const filtered = results.filter((job: any) => {
        if (remote && remote !== 'false' && job.type?.toLowerCase() !== 'remote') return false;
        if (type && job.type && job.type.toLowerCase() !== type.toString().toLowerCase()) return false;
        if (source && job.source && job.source.toLowerCase() !== source.toString().toLowerCase()) return false;
        if (location && job.location && !job.location.toLowerCase().includes(location.toString().toLowerCase())) return false;
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
      
    } catch (error: any) {
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