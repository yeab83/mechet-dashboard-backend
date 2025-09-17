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

// Get seats for a specific VoyageSelection
export const getVoyageSelectionSeats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: "VoyageSelection ID is required" });
    }
    
    // Verify VoyageSelection exists
    const voyageSelection = await Voyage.findById(id).populate('voyage', 'routeName');
    if (!voyageSelection) {
      return res.status(404).json({ message: "VoyageSelection not found" });
    }
    
    // Get all seats for this VoyageSelection
    const Seat = require('../models/seat').default;
    const seats = await Seat.find({ voyageId: id }).sort({ number: 1 });
    
    // Group seats by row for easier frontend rendering
    interface SeatInfo {
      number: string;
      status: string;
      row: number;
      column: string;
    }
    
    const seatLayout: {
      rows1to9: SeatInfo[];
      row10: SeatInfo[];
    } = {
      rows1to9: [], // A1-D9
      row10: []     // A10-E10
    };
    
    seats.forEach((seat: any) => {
      const seatNumber = seat.number;
      const row = parseInt(seatNumber.slice(1));
      const col = seatNumber.slice(0, 1);
      
      if (row <= 9) {
        seatLayout.rows1to9.push({
          number: seatNumber, // Use seat number as the key identifier
          status: seat.status,
          row: row,
          column: col
        });
      } else if (row === 10) {
        seatLayout.row10.push({
          number: seatNumber, // Use seat number as the key identifier
          status: seat.status,
          row: row,
          column: col
        });
      }
    });
    
    res.json({
      success: true,
      voyageSelection: voyageSelection,
      seatLayout: seatLayout,
      totalSeats: seats.length,
      availableSeats: seats.filter((s: any) => s.status === 'available').length,
      bookedSeats: seats.filter((s: any) => s.status === 'booked').length
    });
    
  } catch (error: any) {
    console.error("Error fetching voyage selection seats:", error);
    res.status(500).json({ 
      message: "Failed to fetch seats",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const createVoyageselection = async (req: Request, res: Response) => {
  try {
    const { voyage: voyageId, ...otherData } = req.body;
    
    // Validate that voyage field is provided
    if (!voyageId) {
      return res.status(400).json({ 
        message: "Voyage ID is required. Please provide a valid voyage reference." 
      });
    }
    
    // Verify that the referenced voyage exists
    const VoyageModel = require('../models/voyage').default;
    const existingVoyage = await VoyageModel.findById(voyageId);
    if (!existingVoyage) {
      return res.status(400).json({ 
        message: "Referenced voyage not found. Please provide a valid voyage ID." 
      });
    }
    
    const voyageSelection = new Voyage({ voyage: voyageId, ...otherData });
    const savedVoyageSelection = await voyageSelection.save();
    
    // Populate the voyage reference to get routeName
    const populatedVoyageSelection = await Voyage.findById(savedVoyageSelection._id).populate('voyage', 'routeName');
    
    // Automatically create seats for this voyage selection
    const Seat = require('../models/seat').default;
    const seats = [];
    const totalSeats = savedVoyageSelection.totalSeats || 41; // 36 + 5 = 41 seats
    
    // Create seats with proper naming convention based on bus layout
    // Rows 1-9: A1-A9, B1-B9, C1-C9, D1-D9 (36 seats)
    // Row 10: A10, B10, C10, D10, E10 (5 seats)
    const rows1to9 = ['A', 'B', 'C', 'D'];
    const row10 = ['A', 'B', 'C', 'D', 'E'];
    
    // Create seats for rows 1-9 (4 columns × 9 rows = 36 seats)
    for (let row = 1; row <= 9; row++) {
      for (const col of rows1to9) {
        seats.push({
          voyageId: savedVoyageSelection._id,
          number: `${col}${row}`,
          status: "available"
        });
      }
    }
    
    // Create seats for row 10 (5 seats: A10, B10, C10, D10, E10)
    for (const col of row10) {
      seats.push({
        voyageId: savedVoyageSelection._id,
        number: `${col}10`,
        status: "available"
      });
    }
    
    const createdSeats = await Seat.insertMany(seats);
    console.log(`Created ${createdSeats.length} seats for voyage selection ${savedVoyageSelection._id}`);
    
    res.status(201).json({
      message: "Voyage selection created with seats",
      voyageSelection: populatedVoyageSelection,
      seatsCreated: createdSeats.length,
      seats: createdSeats.map((seat: any) => ({
        id: seat._id,
        number: seat.number,
        status: seat.status
      }))
    });
  } catch (error: any) {
    console.error("Error creating voyage selection:", error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validationErrors 
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: "Duplicate entry. A voyage selection with this data already exists." 
      });
    }
    
    res.status(400).json({ message: "Error creating voyage selection" });
  }
};
