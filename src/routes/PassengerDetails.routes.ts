import express from "express";
import { 
  createPassengerInfo, 
  getPassengerInfo, 
  updatePassengerInfo, 
  deletePassengerInfo, 
  getVoyagePassengers,
  createTickets, 
  getTickets 
} from "../controllers/PassengerDetails.Controller";

const PassengerDetails = express.Router();

// New passenger information endpoints (UI provides voyageId and seatNumber in body)
PassengerDetails.post("/", createPassengerInfo);
PassengerDetails.get("/", getPassengerInfo);
PassengerDetails.patch("/update", updatePassengerInfo);
PassengerDetails.delete("/delete", deletePassengerInfo);


// Legacy endpoints for backward compatibility

export default PassengerDetails;
