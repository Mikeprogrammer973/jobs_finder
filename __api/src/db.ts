import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://antiquesclub007:inazuma15@portofolio.rmyk5uq.mongodb.net/?retryWrites=true&w=majority&appName=portofolio');
    console.log('MongoDB conectado');
  } catch (err) {
    console.error('Erro ao conectar no MongoDB', err);
    process.exit(1);
  }
};
