import express from "express";
import { createSeats, getSeats, bookSeats, getAvailableSeats, cancelSeats, selectSeats, deselectSeats, getSeatStatus } from "../controllers/seat.Controller";
const seatRoutes = express.Router();

seatRoutes.post("/create", createSeats);
seatRoutes.get("/:voyageId", getSeats);
seatRoutes.get("/available/:voyageId", getAvailableSeats);

// Seat selection endpoints
seatRoutes.post("/select", selectSeats);
seatRoutes.post("/deselect", deselectSeats);
seatRoutes.post("/status", getSeatStatus);

seatRoutes.post("/book", bookSeats);
seatRoutes.post("/cancel", cancelSeats);


export default seatRoutes;
