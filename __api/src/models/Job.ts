import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: String,
  company: String,
  location: String,
  salary: String,
  type: String,
  logo: String,
  link: { type: String, unique: true },
  source: String,
  createdAt: { type: Date, default: Date.now },
  description: String,
  requirements: String,
  responsibilities: String,
  benefits: String,
  puub_date: Date
});

export const Job = mongoose.model('Job', jobSchema);
