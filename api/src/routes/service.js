
import express from "express";
import { getServices } from "../services/services.js";

export const router = express.Router();


router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        
        const result = await getServices(page, pageSize);
        
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Get services error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch services'
        });
    }
});
