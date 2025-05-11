"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = require("dotenv");
const jobRoutes_1 = __importDefault(require("./routes/jobRoutes"));
// import { connectDB } from './db';
// connectDB();
(0, dotenv_1.config)();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use('/api/jobs', jobRoutes_1.default);
const start_server = async () => {
    try {
        // await mongoose.connect(process.env.MONGODB_URI || '')
        app.listen(process.env.PORT, () => {
            console.log(`Servidor rodando na porta ${process.env.PORT}`);
        });
    }
    catch (error) {
        console.error("Erro ao iniciar o servidor: ", error);
    }
};
start_server();
