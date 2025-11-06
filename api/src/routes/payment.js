import express, { request } from "express";
import { authenticate } from "../middleware/auth.js";
import { updatePaymentStatus } from "../services/serviceRequest.js";
import { createPayment, getPaymentById } from "../services/payment.js";

export const router = express.Router();

// Crear un nuevo pago
router.post("/", authenticate, async (req, res) => {
  try {
    const data = req.body;
    const payment = await createPayment(data);
    const payment_status = await updatePaymentStatus(data);
    res.status(201).json({ payment, payment_status });
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Obtener un pago por ID
router.get("/:requestId", authenticate, async (req, res) => {
  try {
    const { requestId } = req.params;
    const payment = await getPaymentById(requestId);
    res.status(200).json(payment);
  } catch (error) {
    console.error("Error fetching payment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
