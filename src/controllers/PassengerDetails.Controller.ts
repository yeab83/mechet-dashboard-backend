import { Request, Response } from "express";
import Ticket from "../models/PassengerDetails";
import Seat from "../models/seat";

// Create passenger information (UI form data)
export const createPassengerInfo = async (req: Request, res: Response) => {
  try {
    const { fullName, phoneNumber, email } = req.body;

    // Validate required fields
    if (!fullName) {
      return res.status(400).json({ message: "Full name is required" });
    }
    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Create passenger information
    const passengerInfo = new Ticket({
      fullName,
      phoneNumber,
      email
    });

    const savedPassenger = await passengerInfo.save();

    res.status(201).json({
      message: "Ticket issued successfully",
      ticket: {
        id: savedPassenger._id,
        fullName: savedPassenger.fullName,
        phoneNumber: savedPassenger.phoneNumber,
        email: savedPassenger.email,
        createdAt: savedPassenger.createdAt
      }
    });
  } catch (error) {
    console.error("Error creating passenger information:", error);
    res.status(500).json({ message: "Error creating passenger information" });
  }
};

// Get passenger information by voyage ID
export const getPassengerInfo = async (req: Request, res: Response) => {
  try {
    const { voyageId } = req.body;

    if (!voyageId) {
      return res.status(400).json({ message: "Voyage ID is required" });
    }

    const passengers = await Ticket.find({ voyage: voyageId }).sort({ createdAt: -1 });

    res.json({
      passengers: passengers.map(passenger => ({
        id: passenger._id,
        fullName: passenger.fullName,
        phoneNumber: passenger.phoneNumber,
        email: passenger.email,
        createdAt: passenger.createdAt
      }))
    });
  } catch (error) {
    console.error("Error fetching passenger information:", error);
    res.status(500).json({ message: "Error fetching passenger information" });
  }
};

// Update passenger information
export const updatePassengerInfo = async (req: Request, res: Response) => {
  try {
    const { ticketId, fullName, phoneNumber, email } = req.body;

    if (!ticketId) {
      return res.status(400).json({ message: "Ticket ID is required" });
    }

    const passenger = await Ticket.findById(ticketId);

    if (!passenger) {
      return res.status(404).json({ 
        message: `No ticket found with ID ${ticketId}` 
      });
    }

    // Update passenger information
    if (fullName) passenger.fullName = fullName;
    if (phoneNumber) passenger.phoneNumber = phoneNumber;
    if (email) passenger.email = email;

    const updatedPassenger = await passenger.save();

    res.json({
      message: "Ticket updated successfully",
      ticket: {
        id: updatedPassenger._id,
        fullName: updatedPassenger.fullName,
        phoneNumber: updatedPassenger.phoneNumber,
        email: updatedPassenger.email,
        createdAt: updatedPassenger.createdAt
      }
    });
  } catch (error) {
    console.error("Error updating passenger information:", error);
    res.status(500).json({ message: "Error updating passenger information" });
  }
};

// Delete passenger information
export const deletePassengerInfo = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.body;

    if (!ticketId) {
      return res.status(400).json({ message: "Ticket ID is required" });
    }

    const passenger = await Ticket.findByIdAndDelete(ticketId);

    if (!passenger) {
      return res.status(404).json({ 
        message: `No ticket found with ID ${ticketId}` 
      });
    }

    res.json({
      message: "Ticket deleted successfully",
      deletedTicket: {
        id: passenger._id,
        fullName: passenger.fullName,
        email: passenger.email
      }
    });
  } catch (error) {
    console.error("Error deleting passenger information:", error);
    res.status(500).json({ message: "Error deleting passenger information" });
  }
};

// Get all passengers for a voyage
export const getVoyagePassengers = async (req: Request, res: Response) => {
  try {
    const { voyageId } = req.params;

    const passengers = await Ticket.find({ voyage: voyageId }).sort({ createdAt: -1 });

    res.json({
      voyageId,
      totalTickets: passengers.length,
      tickets: passengers.map(passenger => ({
        id: passenger._id,
        fullName: passenger.fullName,
        phoneNumber: passenger.phoneNumber,
        email: passenger.email,
        createdAt: passenger.createdAt
      }))
    });
  } catch (error) {
    console.error("Error fetching voyage passengers:", error);
    res.status(500).json({ message: "Error fetching voyage passengers" });
  }
};

// Legacy functions for backward compatibility
export const createTickets = async (req: Request, res: Response) => {
  const ticketsData = req.body;

  if (!Array.isArray(ticketsData) || ticketsData.length === 0) {
    return res.status(400).json({ message: "No passenger data provided" });
  }

  try {
    const tickets = ticketsData.map(p => ({
      passengerName: p.name,
      voyage: p.voyage,
      seatNo: p.seatNumber,
      farePrice: p.farePrice || 500,
      issuedBy: p.issuedBy || "System",
      paymentStatus: p.paymentStatus || "Pending",
    }));

    const createdTickets = await Ticket.insertMany(tickets);
    res.status(201).json({ message: "Tickets created successfully", tickets: createdTickets });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getTickets = async (req: Request, res: Response) => {
  try {
    const tickets = await Ticket.find();
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
