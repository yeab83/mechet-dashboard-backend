// controllers/ticketController.ts
import { Request, Response } from 'express';
import Ticket, { ITicket } from '../models/ticket';
import Passenger from '../models/PassengerDetails';
import VoyageSelection from '../models/VoyageSelection';
import Voyage from '../models/voyage';
import Seat from '../models/seat';
import mongoose from 'mongoose';

// Create a new ticket
export const createTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, email, voyage, seatNo, farePrice, issuedBy, paymentStatus } = req.body;

    // Validation
    if (!name || !phone || !voyage || !seatNo || !farePrice || !issuedBy) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: name, phone, voyage, seatNo, farePrice, issuedBy'
      });
      return;
    }

    // First find the voyage by routeName
    const voyageDoc = await Voyage.findOne({ routeName: voyage });
    console.log('Looking for voyage with routeName:', voyage);
    console.log('Found voyage:', voyageDoc ? voyageDoc._id : 'Not found');
    
    if (!voyageDoc) {
      res.status(404).json({
        success: false,
        error: 'Voyage not found'
      });
      return;
    }

    // Then find the voyage selection record by voyage ID
    const voyageSelection = await VoyageSelection.findOne({ voyage: voyageDoc._id });
    console.log('Looking for voyage selection with voyage ID:', voyageDoc._id);
    console.log('Found voyage selection:', voyageSelection ? voyageSelection._id : 'Not found');
    
    if (!voyageSelection) {
      res.status(404).json({
        success: false,
        error: 'Voyage selection not found for this voyage'
      });
      return;
    }

    // Find or create passenger with the correct voyageId
    let passenger = await Passenger.findOne({
      name: name.trim(),
      phone: phone.trim()
    });

    if (!passenger) {
      // Create new passenger if not found
      passenger = new Passenger({
        name: name.trim(),
        phone: phone.trim(),
        email: email ? email.trim().toLowerCase() : null,
        voyageId: voyageDoc._id // Use the voyage ID we found
      });
      await passenger.save();
      console.log('Created new passenger:', passenger._id);
    } else {
      console.log('Found existing passenger:', passenger._id);
    }

    // Check if seat is already booked for this voyage
    const existingTicket = await Ticket.findOne({
      voyage: voyage,
      seatNo: seatNo
    });

    if (existingTicket) {
      res.status(409).json({
        success: false,
        error: 'Seat is already booked for this voyage'
      });
      return;
    }

    // Check if seats are available
    if (voyageSelection.availableSeats <= 0) {
      res.status(400).json({
        success: false,
        error: 'No seats available for this voyage'
      });
      return;
    }

    // Find the specific seat and check if it's available
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

    // Create new ticket
    const ticket = new Ticket({
      name: name.trim(),
      voyage: voyage.trim(),
      seatNo: seatNo.trim(),
      farePrice: Number(farePrice),
      issuedBy: issuedBy.trim(),
      paymentStatus: paymentStatus || 'Pending',
      passengerId: passenger._id,
      voyageId: voyageSelection._id
    });

    const savedTicket = await ticket.save();

    // Update seat status to booked
    await Seat.findByIdAndUpdate(
      seat._id,
      { status: 'booked' }
    );

    // Decrease available seats count in VoyageSelection
    await VoyageSelection.findByIdAndUpdate(
      voyageSelection._id,
      { $inc: { availableSeats: -1 } }
    );

    // Populate the ticket with passenger and voyage details
    const populatedTicket = await Ticket.findById(savedTicket._id)
      .populate('passengerId', 'name phone email')
      .populate('voyageId', 'voyage busPlateNo driver departureTime arrivalTime status');

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully and seat booked',
      data: {
        ticket: populatedTicket,
        seatBooked: seatNo,
        availableSeatsRemaining: voyageSelection.availableSeats - 1
      }
    });

  } catch (error) {
    console.error('Error creating ticket:', error);
    
    // More detailed error response for debugging
    let errorMessage = 'Failed to create ticket';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Handle specific MongoDB errors
      if (error.name === 'ValidationError') {
        statusCode = 400;
        errorMessage = `Validation Error: ${error.message}`;
      } else if (error.name === 'CastError') {
        statusCode = 400;
        errorMessage = `Invalid data format: ${error.message}`;
      } else if (error.name === 'MongoError' && (error as any).code === 11000) {
        statusCode = 409;
        errorMessage = 'Duplicate entry - seat may already be booked';
      }
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get all tickets with passenger details
export const getAllTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const tickets = await Ticket.find()
      .populate('passengerId', 'name phone email')
      .populate('voyageId', 'voyage busPlateNo driver departureTime arrivalTime status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets
    });

  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tickets'
    });
  }
};

// Get single ticket by ID with passenger details
export const getTicketById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findById(id)
      .populate('passengerId', 'name phone email')
      .populate('voyageId', 'voyage busPlateNo driver departureTime arrivalTime status');

    if (!ticket) {
      res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: ticket
    });

  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ticket'
    });
  }
};

// Get tickets by voyage
export const getTicketsByVoyage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { voyageId } = req.params;

    const tickets = await Ticket.find({ voyageId })
      .populate('passengerId', 'name phone email')
      .populate('voyageId', 'voyage busPlateNo driver departureTime arrivalTime status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets
    });

  } catch (error) {
    console.error('Error fetching tickets by voyage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tickets'
    });
  }
};

// Update ticket
export const updateTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, voyage, seatNo, farePrice, paymentStatus } = req.body;

    const updateData: Partial<ITicket> = {};
    if (name) updateData.name = name.trim();
    if (voyage) updateData.voyage = voyage.trim();
    if (seatNo) updateData.seatNo = seatNo.trim();
    if (farePrice) updateData.farePrice = Number(farePrice);
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const ticket = await Ticket.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('passengerId', 'name phone email')
     .populate('voyageId', 'routeName departureTime arrivalTime busPlateNo');

    if (!ticket) {
      res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Ticket updated successfully',
      data: ticket
    });

  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update ticket'
    });
  }
};

// Delete ticket
export const deleteTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Find the ticket first to get seat and voyage information
    const ticket = await Ticket.findById(id);

    if (!ticket) {
      res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
      return;
    }

    // Find the voyage selection record
    const voyageSelection = await VoyageSelection.findOne({ routeName: ticket.voyage });
    
    if (!voyageSelection) {
      res.status(404).json({
        success: false,
        error: 'Voyage not found'
      });
      return;
    }

    // Find the specific seat
    const seat = await Seat.findOne({ 
      voyageId: voyageSelection._id, 
      number: ticket.seatNo 
    });

    if (!seat) {
      res.status(404).json({
        success: false,
        error: 'Seat not found'
      });
      return;
    }

    // Start transaction to ensure data consistency
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Delete the ticket
      await Ticket.findByIdAndDelete(id, { session });

      // Update seat status back to available
      await Seat.findByIdAndUpdate(
        seat._id,
        { status: 'available' },
        { session }
      );

      // Increase available seats count in VoyageSelection
      await VoyageSelection.findByIdAndUpdate(
        voyageSelection._id,
        { $inc: { availableSeats: 1 } },
        { session }
      );

      // Commit transaction
      await session.commitTransaction();

      res.status(200).json({
        success: true,
        message: 'Ticket deleted successfully and seat released',
        data: {
          seatReleased: ticket.seatNo,
          availableSeatsNow: voyageSelection.availableSeats + 1
        }
      });

    } catch (transactionError) {
      // Rollback transaction on error
      await session.abortTransaction();
      throw transactionError;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Error deleting ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete ticket'
    });
  }
};