import { Request, Response } from "express";
import Seat from "../models/seat";
import Voyage from "../models/voyage";
import VoyageSelection from "../models/VoyageSelection";
import Ticket from "../models/PassengerDetails";

// Create seats for a voyage
export const createSeats = async (req: Request, res: Response) => {
  try {
    const { voyageId, totalSeats = 40 } = req.body;

    if (!voyageId) {
      return res.status(400).json({ message: "Voyage ID is required" });
    }

    // Check if voyage exists
    const voyageSelection = await VoyageSelection.findById(voyageId);
    if (!voyageSelection) {
      return res.status(404).json({ message: "Voyage not found" });
    }

    // Check if seats already exist for this voyage
    const existingSeats = await Seat.find({ voyageId });
    if (existingSeats.length > 0) {
      return res.status(400).json({ message: "Seats already exist for this voyage" });
    }

    // Create seats array to match UI layout:
    // Rows 1-9: A1-B1, C1-D1 (4 seats per row)
    // Row 10: A10, B10, C10, D10, E10 (5 seats)
    const seats = [];
    const rows = ['A', 'B', 'C', 'D'];
    
    // Create rows 1-9 with A, B, C, D
    for (let rowNum = 1; rowNum <= 9; rowNum++) {
      for (let i = 0; i < rows.length; i++) {
        seats.push({
          voyageId,
          number: `${rows[i]}${rowNum}`,
          status: "available"
        });
      }
    }
    
    // Create row 10 with A, B, C, D, E
    for (let i = 0; i < rows.length; i++) {
      seats.push({
        voyageId,
        number: `${rows[i]}10`,
        status: "available"
      });
    }
    seats.push({
      voyageId,
      number: "E10",
      status: "available"
    });

    // Insert all seats
    const createdSeats = await Seat.insertMany(seats);

    res.json({
      message: "Seats created successfully",
      voyageId,
      totalSeats: createdSeats.length,
      seats: createdSeats.map(seat => ({
        id: seat._id,
        number: seat.number,
        status: seat.status
      }))
    });
  } catch (error) {
    console.error("Error creating seats:", error);
    res.status(500).json({ message: "Error creating seats" });
  }
};

export const getSeats = async (req: Request, res: Response) => {
  try {
    const { voyageId } = req.params;
    
    if (!voyageId) {
      return res.status(400).json({ message: "Voyage ID is required" });
    }

    // First check voyage availability from VoyageSelection
    const voyageSelection = await VoyageSelection.findById(voyageId).populate('voyage', 'routeName');
    if (!voyageSelection) {
      return res.status(404).json({ message: "Voyage not found" });
    }

    // Get all seats for this voyage (both available and booked)
    const seats = await Seat.find({ voyageId }).sort({ number: 1 });
    
    // Count available, selected, and booked seats
    const availableSeats = seats.filter(seat => seat.status === "available");
    const selectedSeats = seats.filter(seat => seat.status === "selected");
    const bookedSeats = seats.filter(seat => seat.status === "booked");
    
    res.json({
      voyageId,
      voyageInfo: {
        busPlateNo: voyageSelection.busPlateNo,
        driver: voyageSelection.driver,
        routeName: (voyageSelection.voyage as any)?.routeName,
        departureTime: voyageSelection.departureTime,
        arrivalTime: voyageSelection.arrivalTime,
        status: voyageSelection.status
      },
      seatAvailability: {
        totalSeats: voyageSelection.totalSeats,
        availableSeats: voyageSelection.availableSeats,
        bookedSeats: voyageSelection.totalSeats - voyageSelection.availableSeats
      },
      seats: seats.map(seat => ({
        id: seat._id,
        number: seat.number,
        status: seat.status,
        isAvailable: seat.status === "available",
        isSelected: seat.status === "selected",
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

    // Step 1: Check voyage availability from VoyageSelection
    const voyageSelection = await VoyageSelection.findById(voyageId);
    if (!voyageSelection) {
      return res.status(404).json({ message: "Voyage not found" });
    }

    if (voyageSelection.status !== "Active") {
      return res.status(400).json({ message: "Voyage is not active for booking" });
    }

    if (voyageSelection.availableSeats < seatNumbers.length) {
      return res.status(400).json({ 
        message: "Not enough available seats", 
        availableSeats: voyageSelection.availableSeats,
        requestedSeats: seatNumbers.length
      });
    }

    // Step 2: Check if specific seats exist and are selected
    const selectedSeats = await Seat.find({ 
      voyageId, 
      number: { $in: seatNumbers }, 
      status: "selected" 
    });

    if (selectedSeats.length !== seatNumbers.length) {
      return res.status(400).json({ 
        message: "Some seats are not selected for booking", 
        selectedSeats: selectedSeats.map(seat => seat.number),
        unselectedSeats: seatNumbers.filter(seatNum => 
          !selectedSeats.some(seat => seat.number === seatNum)
        )
      });
    }

    // Step 3: Update seats to booked status
    const updatedSeats = await Seat.updateMany(
      { voyageId, number: { $in: seatNumbers }, status: "selected" },
      { $set: { status: "booked" } }
    );

    // Step 4: Update available seats count in VoyageSelection
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

    // Step 1: Update seats to available status (Seat → PassengerDetails flow)
    const updatedSeats = await Seat.updateMany(
      { voyageId, number: { $in: seatNumbers }, status: "booked" },
      { $set: { status: "available" } }
    );

    // Step 2: Delete passenger details/tickets for cancelled seats (Seat → PassengerDetails)
    const deletedTickets = await Ticket.deleteMany({
      voyage: voyageId,
      seatNo: { $in: seatNumbers }
    });

    // Step 3: Update available seats count in VoyageSelection (PassengerDetails → VoyageSelection)
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
      deletedTickets: deletedTickets.deletedCount,
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
        status: seat.status,
        isAvailable: true,
        isBooked: false
      }))
    });
  } catch (error) {
    console.error("Error fetching available seats:", error);
    res.status(500).json({ message: "Error fetching available seats" });
  }
};

// Select seats (temporary selection before booking)
export const selectSeats = async (req: Request, res: Response) => {
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
        availableSeats: availableSeats.map(seat => seat.number),
        unavailableSeats: seatNumbers.filter(seatNum => 
          !availableSeats.some(seat => seat.number === seatNum)
        )
      });
    }

    // Update seats to selected status
    const updatedSeats = await Seat.updateMany(
      { voyageId, number: { $in: seatNumbers }, status: "available" },
      { $set: { status: "selected" } }
    );

    res.json({ 
      message: "Seats selected successfully", 
      updatedSeats: updatedSeats.modifiedCount,
      selectedSeats: seatNumbers
    });
  } catch (error) {
    console.error("Error selecting seats:", error);
    res.status(500).json({ message: "Error selecting seats" });
  }
};

// Deselect seats (remove selection)
export const deselectSeats = async (req: Request, res: Response) => {
  try {
    const { voyageId, seatNumbers } = req.body;

    // Validate input
    if (!voyageId || !seatNumbers || !Array.isArray(seatNumbers)) {
      return res.status(400).json({ message: "Invalid input: voyageId and seatNumbers array are required" });
    }

    // Update seats back to available status
    const updatedSeats = await Seat.updateMany(
      { voyageId, number: { $in: seatNumbers }, status: "selected" },
      { $set: { status: "available" } }
    );

    res.json({ 
      message: "Seats deselected successfully", 
      updatedSeats: updatedSeats.modifiedCount,
      deselectedSeats: seatNumbers
    });
  } catch (error) {
    console.error("Error deselecting seats:", error);
    res.status(500).json({ message: "Error deselecting seats" });
  }
};

// Get seat status for specific seats
export const getSeatStatus = async (req: Request, res: Response) => {
  try {
    const { voyageId, seatNumbers } = req.body;

    if (!voyageId || !seatNumbers || !Array.isArray(seatNumbers)) {
      return res.status(400).json({ message: "Invalid input: voyageId and seatNumbers array are required" });
    }

    const seats = await Seat.find({ 
      voyageId, 
      number: { $in: seatNumbers }
    });

    res.json({
      seats: seats.map(seat => ({
        id: seat._id,
        number: seat.number,
        status: seat.status,
        isAvailable: seat.status === "available",
        isSelected: seat.status === "selected",
        isBooked: seat.status === "booked"
      }))
    });
  } catch (error) {
    console.error("Error fetching seat status:", error);
    res.status(500).json({ message: "Error fetching seat status" });
  }
};
