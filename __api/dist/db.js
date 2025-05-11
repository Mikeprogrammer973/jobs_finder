"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGO_URI || 'mongodb+srv://antiquesclub007:inazuma15@portofolio.rmyk5uq.mongodb.net/?retryWrites=true&w=majority&appName=portofolio');
        console.log('MongoDB conectado');
    }
    catch (err) {
        console.error('Erro ao conectar no MongoDB', err);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
