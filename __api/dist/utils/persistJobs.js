"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.persistJobs = void 0;
const Job_1 = require("../models/Job");
const persistJobs = async (jobs) => {
    for (const job of jobs) {
        try {
            await Job_1.Job.updateOne({ link: job.link }, { $setOnInsert: job }, { upsert: true });
        }
        catch (err) {
            console.error('Erro ao salvar job:', err);
        }
    }
};
exports.persistJobs = persistJobs;
