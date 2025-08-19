import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth.route";

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 3000;

connectDB(process.env.MONGODB_URI as string).then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
