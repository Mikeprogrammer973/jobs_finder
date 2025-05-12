import axios from 'axios';

export const scrapeRemotive = async (query: string) => {
  const { data } = await axios.get('https://remotive.com/api/remote-jobs');
  return data.jobs
    .filter((job: any) => job.title.toLowerCase().includes(query.toLowerCase()))
    .map((job: any) => ({
      title: job.title,
      company: job.company_name,
      location: job.candidate_required_location,
      salary: job.salary,
      link: job.url,
      logo: job.company_logo_url,
      source: 'Remotive',
      type: job.job_type,
      date:job.created_at,
      description: job.description,
      tags: job.tags
    }));
};
