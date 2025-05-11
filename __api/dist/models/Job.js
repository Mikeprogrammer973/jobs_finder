"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Job = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const jobSchema = new mongoose_1.default.Schema({
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
exports.Job = mongoose_1.default.model('Job', jobSchema);
