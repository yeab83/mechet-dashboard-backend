import { Request, Response } from "express";
import Voyage from "../models/VoyageSelection";

export const getVoyageselection = async (req: Request, res: Response) => {
  try {
    const voyages = await Voyage.find().populate('voyage', 'routeName');
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
    
    // Populate the voyage reference to get routeName
    const populatedVoyage = await Voyage.findById(savedVoyage._id).populate('voyage', 'routeName');
    
    // Automatically create seats for this voyage
    const Seat = require('../models/seat').default;
    const seats = [];
    const totalSeats = savedVoyage.totalSeats || 40;
    
    // Create seats with proper naming convention (A1-A10, B1-B10, C1-C10, D1-D10, E1-E10)
    const rows = ['A', 'B', 'C', 'D', 'E'];
    const seatsPerRow = 10; // Fixed 10 seats per row
    
    for (let i = 0; i < rows.length; i++) {
      for (let j = 1; j <= seatsPerRow; j++) {
        seats.push({
          voyageId: savedVoyage._id,
          number: `${rows[i]}${j}`,
          status: "available"
        });
      }
    }
    
    const createdSeats = await Seat.insertMany(seats);
    console.log(`Created ${createdSeats.length} seats for voyage ${savedVoyage._id}`);
    
    res.status(201).json({
      message: "Voyage selection created with seats",
      voyage: populatedVoyage,
      seatsCreated: createdSeats.length,
      seats: createdSeats.map((seat: any) => ({
        id: seat._id,
        number: seat.number,
        status: seat.status
      }))
    });
  } catch (error) {
    console.error("Error creating voyage selection:", error);
    res.status(400).json({ message: "Error creating voyage selection" });
  }
};
