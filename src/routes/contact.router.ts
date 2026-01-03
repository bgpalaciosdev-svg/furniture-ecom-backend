import express from "express";
import {
  createContact,
  getContacts,
  getContact,
} from "../controllers/contact.controller";

const router = express.Router();

router.post("/", createContact);
router.get("/", getContacts);
router.get("/:id", getContact);

export default router;
