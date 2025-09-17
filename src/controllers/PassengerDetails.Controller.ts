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
    const { name, phone, email, voyageId, voyageSelectionId, seatId, seatNo, farePrice, issuedBy } = req.body;

    // Validation - prioritize seatNo over seatId
    if (!name || !phone || (!voyageId && !voyageSelectionId) || (!seatNo && !seatId) || !farePrice || !issuedBy) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: name, phone, (voyageId or voyageSelectionId), (seatNo or seatId), farePrice, issuedBy'
      });
      return;
    }

    // Validate provided IDs format
    if (voyageId && !mongoose.Types.ObjectId.isValid(voyageId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid voyage ID format'
      });
      return;
    }

    if (voyageSelectionId && !mongoose.Types.ObjectId.isValid(voyageSelectionId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid voyage selection ID format'
      });
      return;
    }

    // Resolve voyage and voyageSelection
    let resolvedVoyageId = voyageId as string;
    let resolvedVoyageSelectionId: string | undefined = voyageSelectionId as string | undefined;

    if (voyageSelectionId && !voyageId) {
      const selectionDoc = await VoyageSelection.findById(voyageSelectionId).select('voyage');
      if (!selectionDoc) {
        res.status(404).json({ success: false, error: 'Voyage selection not found' });
        return;
      }
      resolvedVoyageId = selectionDoc.voyage?.toString();
      resolvedVoyageSelectionId = voyageSelectionId;
    }

    // If both provided, ensure they match
    if (voyageId && voyageSelectionId) {
      const selectionDoc = await VoyageSelection.findById(voyageSelectionId).select('voyage');
      if (!selectionDoc) {
        res.status(404).json({ success: false, error: 'Voyage selection not found' });
        return;
      }
      if (selectionDoc.voyage?.toString() !== voyageId.toString()) {
        res.status(400).json({ success: false, error: 'voyageId does not match voyageSelectionId' });
        return;
      }
      resolvedVoyageSelectionId = voyageSelectionId;
    }

    // Ensure we have resolvedVoyageId
    if (!resolvedVoyageId) {
      res.status(400).json({ success: false, error: 'Unable to resolve voyageId from voyageSelectionId' });
      return;
    }

    // Check if passenger already exists for this voyage
    const existingPassenger = await Passenger.findOne({
      phone: phone,
      voyageId: resolvedVoyageId
    });

    if (existingPassenger) {
      res.status(409).json({
        success: false,
        error: 'Passenger with this phone number already exists for this voyage'
      });
      return;
    }

    // Find voyage and voyage selection
    const voyage = await Voyage.findById(resolvedVoyageId);
    if (!voyage) {
      res.status(404).json({
        success: false,
        error: 'Voyage not found'
      });
      return;
    }

    // Determine voyageSelection
    const voyageSelection = resolvedVoyageSelectionId
      ? await VoyageSelection.findById(resolvedVoyageSelectionId)
      : await VoyageSelection.findOne({ voyage: resolvedVoyageId });
    if (!voyageSelection) {
      res.status(404).json({
        success: false,
        error: 'Voyage selection not found for this voyage'
      });
      return;
    }

    // Find the seat - prioritize seatNo over seatId
    let seat;
    if (seatNo) {
      // Find by seatNo (preferred method)
      seat = await Seat.findOne({ 
        voyageId: voyageSelection._id, 
        number: seatNo 
      });
      if (!seat) {
        res.status(404).json({
          success: false,
          error: `Seat ${seatNo} not found for this VoyageSelection`
        });
        return;
      }
    } else if (seatId) {
      // Find by seatId (fallback method)
      seat = await Seat.findById(seatId);
      if (!seat) {
        res.status(404).json({
          success: false,
          error: 'Seat not found'
        });
        return;
      }
      // Verify seat belongs to this VoyageSelection
      if (seat.voyageId.toString() !== (voyageSelection._id as string).toString()) {
        res.status(400).json({
          success: false,
          error: 'Seat does not belong to this VoyageSelection'
        });
        return;
      }
    }

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
      voyageId: resolvedVoyageId
    });

    const savedPassenger = await passenger.save();

    // Create ticket automatically
    const ticket = new Ticket({
      name: name.trim(),
      voyage: voyage.routeName,
      seatNo: seat.number, // Use seat number from found seat
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
      message: `Passenger and ticket created successfully for seat ${seat.number}`,
      data: {
        passenger: savedPassenger,
        ticket: populatedTicket,
        seatBooked: seat.number,
        seatId: seat._id
      }
    });

  } catch (error: any) {
    console.error('Error creating passenger and ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create passenger and ticket',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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

  } catch (error: any) {
    console.error('Error fetching passengers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch passengers',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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

  } catch (error: any) {
    console.error('Error fetching passengers by voyage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch passengers',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};