// controllers/passengerController.ts
import { Request, Response } from 'express';
import Passenger, { IPassenger } from '../models/PassengerDetails';
import Ticket from '../models/ticket';
import Voyage from '../models/voyage';
import VoyageSelection from '../models/VoyageSelection';
import Seat from '../models/seat';
import mongoose from 'mongoose';

// Create a new passenger and automatically create ticket
export const createPassenger = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, email, voyageId, seatNo, farePrice, issuedBy } = req.body;

    // Validation
    if (!name || !phone || !voyageId || !seatNo || !farePrice || !issuedBy) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: name, phone, voyageId, seatNo, farePrice, issuedBy'
      });
      return;
    }

    // Validate voyageId format
    if (!mongoose.Types.ObjectId.isValid(voyageId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid voyage ID format'
      });
      return;
    }

    // Check if passenger already exists for this voyage
    const existingPassenger = await Passenger.findOne({
      phone: phone,
      voyageId: voyageId
    });

    if (existingPassenger) {
      res.status(409).json({
        success: false,
        error: 'Passenger with this phone number already exists for this voyage'
      });
      return;
    }

    // Find voyage and voyage selection
    const voyage = await Voyage.findById(voyageId);
    if (!voyage) {
      res.status(404).json({
        success: false,
        error: 'Voyage not found'
      });
      return;
    }

    const voyageSelection = await VoyageSelection.findOne({ voyage: voyageId });
    if (!voyageSelection) {
      res.status(404).json({
        success: false,
        error: 'Voyage selection not found for this voyage'
      });
      return;
    }

    // Check if seat is available
    const seat = await Seat.findOne({ 
      voyageId: voyageSelection._id, 
      number: seatNo 
    });

    if (!seat) {
      res.status(404).json({
        success: false,
        error: 'Seat not found'
      });
      return;
    }

    if (seat.status !== 'available') {
      res.status(409).json({
        success: false,
        error: 'Seat is not available'
      });
      return;
    }

    // Create new passenger
    const passenger = new Passenger({
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim().toLowerCase() : null,
      voyageId: voyageId
    });

    const savedPassenger = await passenger.save();

    // Create ticket automatically
    const ticket = new Ticket({
      name: name.trim(),
      voyage: voyage.routeName,
      seatNo: seatNo.trim(),
      farePrice: Number(farePrice),
      issuedBy: issuedBy.trim(),
      paymentStatus: 'Pending',
      passengerId: savedPassenger._id,
      voyageId: voyageSelection._id
    });

    const savedTicket = await ticket.save();

    // Update seat status to booked
    await Seat.findByIdAndUpdate(seat._id, { status: 'booked' });

    // Decrease available seats count
    await VoyageSelection.findByIdAndUpdate(
      voyageSelection._id,
      { $inc: { availableSeats: -1 } }
    );

    // Populate ticket data for response
    const populatedTicket = await Ticket.findById(savedTicket._id)
      .populate('passengerId', 'name phone email')
      .populate('voyageId', 'voyage busPlateNo driver departureTime arrivalTime status');

    res.status(201).json({
      success: true,
      message: 'Passenger and ticket created successfully',
      data: {
        passenger: savedPassenger,
        ticket: populatedTicket,
        seatBooked: seatNo
      }
    });

  } catch (error) {
    console.error('Error creating passenger and ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create passenger and ticket'
    });
  }
};

// Get all passengers
export const getAllPassengers = async (req: Request, res: Response): Promise<void> => {
  try {
    const passengers = await Passenger.find()
      .populate('voyageId', 'routeName departureTime arrivalTime busPlateNo')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: passengers.length,
      data: passengers
    });

  } catch (error) {
    console.error('Error fetching passengers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch passengers'
    });
  }
};

// Get passengers by voyage
export const getPassengersByVoyage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { voyageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(voyageId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid voyage ID format'
      });
      return;
    }

    const passengers = await Passenger.find({ voyageId })
      .populate('voyageId', 'routeName departureTime arrivalTime busPlateNo')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: passengers.length,
      data: passengers
    });

  } catch (error) {
    console.error('Error fetching passengers by voyage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch passengers'
    });
  }
};