
// muevo la ruta de salud que habia hecho anteriormente de prueba 

import { Router } from "express";
import { pool } from "../config/db.js";

const router = Router();

router.get("/salud", async (req, res) => {
  try {
    const [filas] = await pool.query("SELECT DATABASE() AS bd");
    res.json({ servidor: "ok", baseDeDatos: filas[0].bd });
  } catch (error) {
    res.status(503).json({ servidor: "ok", baseDeDatos: "ERROR", detalle: error.code });
  }
});

export default router;