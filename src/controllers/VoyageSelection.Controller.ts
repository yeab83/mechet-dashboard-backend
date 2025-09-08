import { Request, Response } from "express";
import Voyage from "../models/VoyageSelection";

export const getVoyageselection = async (req: Request, res: Response) => {
  try {
    const voyages = await Voyage.find();
    res.json(voyages);
  } catch (error) {
    console.error("Error fetching voyage selections:", error);
    res.status(500).json({ message: "Failed to fetch voyage selections" });
  }
};

export const createVoyageselection = async (req: Request, res: Response) => {
  try {
    const voyage = new Voyage(req.body);
    const savedVoyage = await voyage.save();
    
    // Automatically create seats for this voyage
    const Seat = require('../models/seat').default;
    const seats = [];
    const totalSeats = savedVoyage.totalSeats || 40;
    
    for (let i = 1; i <= totalSeats; i++) {
      seats.push({
        voyageId: savedVoyage._id,
        number: i.toString().padStart(2, '0'), // Format as "01", "02", etc.
        status: "available"
      });
    }
    
    await Seat.insertMany(seats);
    console.log(`Created ${seats.length} seats for voyage ${savedVoyage._id}`);
    
    res.status(201).json({
      message: "Voyage selection created with seats",
      voyage: savedVoyage,
      seatsCreated: seats.length
    });
  } catch (error) {
    console.error("Error creating voyage selection:", error);
    res.status(400).json({ message: "Error creating voyage selection" });
  }
};
