import axios from 'axios';

export const scrapeRemoteOK = async (query: string) => {
  const { data } = await axios.get(`https://remoteok.com/api`);
  return data
    .filter((job: any) => job.position?.toLowerCase().includes(query.toLowerCase()))
    .map((job: any) => ({
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
