import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import userRoutes from "./routes/user.Routes";   // ✅ import
import roleRoutes from "./routes/role.Routes";
import busRoutes from "./routes/bus.routes";
import routingRoutes from "./routes/routing.Routes";
import cityrouter from "./routes/city.routes";
import Voyagerouter from "./routes/voyage.routes";
import Voyageselection from "./routes/VoyageSelection.routes";
import seatRoutes from "./routes/seat.routes";


dotenv.config();
const app = express();

app.use(express.json());
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : true;
app.use(cors({ origin: corsOrigin as any, credentials: true }));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/routings", routingRoutes);
app.use("/api/cities", cityrouter);
app.use("/api/voyage", Voyagerouter);
app.use("/api/voyageselection", Voyageselection);
app.use("/api/seats", seatRoutes);

const PORT = Number(process.env.PORT) || 3000;
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mechet-dashboard";

connectDB(mongoUri).then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
