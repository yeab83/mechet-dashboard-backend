import express from "express";
import { 
  createTicket,
  getAllTickets,
  getTicketsByVoyage,
  updateTicket,
  deleteTicket
} from "../controllers/ticket.controller";

const ticketRouter = express.Router();

// POST /api/tickets - Create ticket
ticketRouter.post("/", createTicket);

// GET /api/tickets - Get all tickets with passenger details
ticketRouter.get("/", getAllTickets);

// GET /api/tickets/voyage/:voyageId - Get tickets by voyage
ticketRouter.get("/voyage/:voyageId", getTicketsByVoyage);

// PUT /api/tickets/:id - Update ticket
ticketRouter.put("/:id", updateTicket);

// DELETE /api/tickets/:id - Delete ticket
ticketRouter.delete("/:id", deleteTicket);

export default ticketRouter;
