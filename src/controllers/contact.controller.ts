import { Request, Response, NextFunction } from "express";
import Contact from "../db/models/contact.model";

// Create a new contact form entry
export const createContact = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { first_name, last_name, phone_number, email, message } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !phone_number || !email || !message) {
      res.status(400).json({
        message:
          "All fields are required: first_name, last_name, phone_number, email, message",
      });
      return;
    }

    const contact = new Contact({
      first_name,
      last_name,
      phone_number,
      email,
      message,
    });

    await contact.save();

    res.status(201).json({
      message: "Contact form submitted successfully",
      contact,
    });
  } catch (error) {
    next(error);
  }
};

// Get all contact form entries (optional - for admin use)
export const getContacts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page = "1", limit = "10" } = req.query;

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    const [contacts, totalCount] = await Promise.all([
      Contact.find().skip(skip).limit(limitNumber).sort({ created_at: -1 }),
      Contact.countDocuments(),
    ]);

    const totalPages = Math.ceil(totalCount / limitNumber);

    res.status(200).json({
      contacts,
      pagination: {
        current_page: pageNumber,
        total_pages: totalPages,
        total_count: totalCount,
        has_next: pageNumber < totalPages,
        has_prev: pageNumber > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get a single contact form entry by ID
export const getContact = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const contact = await Contact.findById(id);

    if (!contact) {
      res.status(404).json({ message: "Contact entry not found" });
      return;
    }

    res.status(200).json({
      contact,
    });
  } catch (error) {
    next(error);
  }
};
