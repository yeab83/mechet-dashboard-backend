import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import userRoutes from "./routes/user.Routes";   // ✅ import
import Rolerouter from "./routes/role.Routes";

dotenv.config();
const app = express();

app.use(express.json());
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : true;
app.use(cors({ origin: corsOrigin as any, credentials: true }));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/role", Rolerouter); 

const PORT = Number(process.env.PORT) || 3000;
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mechet-dashboard";

connectDB(mongoUri).then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
