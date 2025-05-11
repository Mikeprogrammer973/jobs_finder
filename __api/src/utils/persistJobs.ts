import { Job } from '../models/Job';

export const persistJobs = async (jobs: any[]) => {
  for (const job of jobs) {
    try {
      await Job.updateOne({ link: job.link }, { $setOnInsert: job }, { upsert: true });
    } catch (err) {
      console.error('Erro ao salvar job:', err);
    }
  }
};
