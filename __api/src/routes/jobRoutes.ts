import express from 'express';
import { searchJobs } from '../controllers/searchController';

const router = express.Router();
router.get('/search', searchJobs);
export default router;
