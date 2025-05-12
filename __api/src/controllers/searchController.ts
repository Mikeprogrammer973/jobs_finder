import { scrapeLinkedIn } from '../scrapers/linkedin';
import { scrapeRemoteOK } from '../scrapers/remoteok';
import { scrapeRemotive } from '../scrapers/remotive';
import { scrapeWWR } from '../scrapers/weworkremotely';
import { getCache, setCache } from '../utils/cache';
import { scrapeGlassdoor } from '../scrapers/glassdoor';
import { scrapeSimplyHired } from '../scrapers/simplyhired';

export const searchJobs = async (req: any, res: any) => {
  const {
    query = '',
    location = '',
    page = 1,
    remote,
    type,
    source
  } = req.query;

  // const key = `jobs:${query}:${location}:${page}:${remote}:${type}:${source}`;
  // const cached = await getCache(key);
  // if (cached) return res.json({ cached: true, data: cached });

  const scrapers = [
    scrapeLinkedIn(query, 10),
    scrapeRemoteOK(query),
    scrapeRemotive(query),
    scrapeWWR(query),
    scrapeGlassdoor(query),
    scrapeSimplyHired(query),
  ];

  const results = (await Promise.allSettled(scrapers)).flatMap((r: any) => (r.status === 'fulfilled' ? r.value : []));
  
  const filtered = results.filter((job: any) => {
    if (remote && job.type?.toLowerCase() !== 'remote') return false;
    if (type && job.type && job.type.toLowerCase() !== type.toLowerCase()) return false;
    if (source && job.source && job.source.toLowerCase() !== source.toLowerCase()) return false;
    return true;
  });

  // await setCache(key, filtered, 3600);
  res.json({ cached: false, count: filtered.length, data: filtered });
};
