import mongoose from "mongoose";

const TicketSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  email: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Ticket", TicketSchema);
