import express from "express";
import { createSeats, getSeats, bookSeats, getAvailableSeats, cancelSeats } from "../controllers/seat.Controller";
const seatRoutes = express.Router();

seatRoutes.post("/create", createSeats);
seatRoutes.get("/:voyageId", getSeats);
seatRoutes.get("/available/:voyageId", getAvailableSeats);

seatRoutes.post("/book", bookSeats);
seatRoutes.post("/cancel", cancelSeats);


export default seatRoutes;
