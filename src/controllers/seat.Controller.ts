import { Request, Response } from "express";
import Seat from "../models/seat";
import Voyage from "../models/voyage";
import VoyageSelection from "../models/VoyageSelection";

export const getSeats = async (req: Request, res: Response) => {
  try {
    const { voyageId } = req.params;
    
    if (!voyageId) {
      return res.status(400).json({ message: "Voyage ID is required" });
    }

    // Get all seats for this voyage (both available and booked)
    const seats = await Seat.find({ voyageId }).sort({ number: 1 });
    
    // Count available and booked seats
    const availableSeats = seats.filter(seat => seat.status === "available");
    const bookedSeats = seats.filter(seat => seat.status === "booked");
    
    res.json({
      voyageId,
      totalSeats: seats.length,
      availableSeats: availableSeats.length,
      bookedSeats: bookedSeats.length,
      seats: seats.map(seat => ({
        id: seat._id,
        number: seat.number,
        status: seat.status,
        isAvailable: seat.status === "available",
        isBooked: seat.status === "booked"
      }))
    });
  } catch (error) {
    console.error("Error fetching seats:", error);
    res.status(500).json({ message: "Error fetching seats" });
  }
};

export const bookSeats = async (req: Request, res: Response) => {
  try {
    const { voyageId, seatNumbers } = req.body;

    // Validate input
    if (!voyageId || !seatNumbers || !Array.isArray(seatNumbers)) {
      return res.status(400).json({ message: "Invalid input: voyageId and seatNumbers array are required" });
    }

    // Check if seats exist and are available
    const availableSeats = await Seat.find({ 
      voyageId, 
      number: { $in: seatNumbers }, 
      status: "available" 
    });

    if (availableSeats.length !== seatNumbers.length) {
      return res.status(400).json({ 
        message: "Some seats are not available", 
        availableSeats: availableSeats.map(seat => seat.number)
      });
    }

    // Update seats to booked status
    const updatedSeats = await Seat.updateMany(
      { voyageId, number: { $in: seatNumbers }, status: "available" },
      { $set: { status: "booked" } }
    );

    // Update available seats count in VoyageSelection
    const updatedVoyage = await VoyageSelection.findByIdAndUpdate(
      voyageId, 
      { $inc: { availableSeats: -seatNumbers.length } },
      { new: true }
    );

    if (!updatedVoyage) {
      return res.status(404).json({ message: "Voyage selection not found" });
    }

    res.json({ 
      message: "Seats booked successfully", 
      updatedSeats: updatedSeats.modifiedCount,
      bookedSeats: seatNumbers,
      voyageUpdate: {
        totalSeats: updatedVoyage.totalSeats,
        availableSeats: updatedVoyage.availableSeats,
        bookedSeats: updatedVoyage.totalSeats - updatedVoyage.availableSeats
      }
    });
  } catch (error) {
    console.error("Error booking seats:", error);
    res.status(500).json({ message: "Error booking seats" });
  }
};

export const cancelSeats = async (req: Request, res: Response) => {
  try {
    const { voyageId, seatNumbers } = req.body;

    // Validate input
    if (!voyageId || !seatNumbers || !Array.isArray(seatNumbers)) {
      return res.status(400).json({ message: "Invalid input: voyageId and seatNumbers array are required" });
    }

    // Check if seats exist and are booked
    const bookedSeats = await Seat.find({ 
      voyageId, 
      number: { $in: seatNumbers }, 
      status: "booked" 
    });

    if (bookedSeats.length !== seatNumbers.length) {
      return res.status(400).json({ 
        message: "Some seats are not booked", 
        bookedSeats: bookedSeats.map(seat => seat.number)
      });
    }

    // Update seats to available status
    const updatedSeats = await Seat.updateMany(
      { voyageId, number: { $in: seatNumbers }, status: "booked" },
      { $set: { status: "available" } }
    );

    // Update available seats count in VoyageSelection
    const updatedVoyage = await VoyageSelection.findByIdAndUpdate(
      voyageId, 
      { $inc: { availableSeats: seatNumbers.length } },
      { new: true }
    );

    if (!updatedVoyage) {
      return res.status(404).json({ message: "Voyage selection not found" });
    }

    res.json({ 
      message: "Seats cancelled successfully", 
      updatedSeats: updatedSeats.modifiedCount,
      cancelledSeats: seatNumbers,
      voyageUpdate: {
        totalSeats: updatedVoyage.totalSeats,
        availableSeats: updatedVoyage.availableSeats,
        bookedSeats: updatedVoyage.totalSeats - updatedVoyage.availableSeats
      }
    });
  } catch (error) {
    console.error("Error cancelling seats:", error);
    res.status(500).json({ message: "Error cancelling seats" });
  }
};

export const getAvailableSeats = async (req: Request, res: Response) => {
  try {
    const { voyageId } = req.params;
    
    if (!voyageId) {
      return res.status(400).json({ message: "Voyage ID is required" });
    }

    const availableSeats = await Seat.find({ voyageId, status: "available" }).sort({ number: 1 });
    
    res.json({
      voyageId,
      availableSeats: availableSeats.length,
      seats: availableSeats.map(seat => ({
        id: seat._id,
        number: seat.number,
        status: seat.status
      }))
    });
  } catch (error) {
    console.error("Error fetching available seats:", error);
    res.status(500).json({ message: "Error fetching available seats" });
  }
};
