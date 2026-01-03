"use strict";

import { IContact } from "../../types/contact.type";
import mongoose from "../index";

const Schema = mongoose.Schema;

const ContactSchema = new Schema<IContact>(
  {
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
      required: true,
    },
    phone_number: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

const Contact = mongoose.model("Contact", ContactSchema);

export default Contact;
