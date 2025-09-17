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
import PassengerDetails from "./routes/PassengerDetails.routes";
import ticketRoutes from "./routes/ticket.routes";


dotenv.config();
const app = express();

app.use(express.json());

// Enhanced CORS configuration
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"];

app.use(cors({ 
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (corsOrigin.includes(origin)) {
      return callback(null, true);
    }
    
    console.log(`CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// CORS debugging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.get('Origin') || 'No Origin'}`);
  next();
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/routings", routingRoutes);
app.use("/api/cities", cityrouter);
app.use("/api/voyage", Voyagerouter);
app.use("/api/voyageselection", Voyageselection);
app.use("/api/seats", seatRoutes);
app.use("/api/passengerdetails", PassengerDetails);
app.use("/api/tickets", ticketRoutes);

const PORT = Number(process.env.PORT) || 3000;
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mechet-dashboard";

connectDB(mongoUri).then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
