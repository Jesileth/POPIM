
// muevo la ruta de salud que habia hecho anteriormente de prueba 

import { Router } from "express";
import { pool } from "../config/db.js";
import authRoutes from "./auth.routes.js";
import catalogosRoutes from "./catalogos.routes.js";
import mascotasRoutes from "./mascotas.routes.js";
import archivosRoutes from "./archivos.routes.js";
import agendaRoutes from "./agenda.routes.js";


const router = Router();

router.get("/salud", async (req, res) => {
  try {
    const [filas] = await pool.query("SELECT DATABASE() AS bd");
    res.json({ servidor: "ok", baseDeDatos: filas[0].bd });
  } catch (error) {
    res.status(503).json({ servidor: "ok", baseDeDatos: "ERROR", detalle: error.code });
  }
});

router.use("/auth", authRoutes);
router.use("/catalogos", catalogosRoutes);
router.use("/mascotas", mascotasRoutes);
router.use("/archivos", archivosRoutes);
router.use(agendaRoutes);

export default router;