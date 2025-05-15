import express from 'express'
import mongoose  from 'mongoose'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import { config } from 'dotenv'

import jobRoutes from './routes/jobRoutes'
import path from 'path'
import fs from 'fs'
// import { connectDB } from './db';

// connectDB();

config()

const app = express()

app.use(cors())
app.use(helmet())
app.use(morgan('dev'))
app.use(express.json())

app.use('/api/jobs', jobRoutes)
app.get('/health', (req, res) => {
    res.send('OK')
})

const start_server = async () => {
    try {
        // await mongoose.connect(process.env.MONGODB_URI || '')
        app.listen(process.env.PORT || 4000, () => {
            console.log(`Servidor rodando na porta ${process.env.PORT}`)
        })
    } catch (error) {
        console.error("Erro ao iniciar o servidor: ", error)
    }
}

start_server()
