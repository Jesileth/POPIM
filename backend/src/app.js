
// !! Express revisa de arriba hacia abajo, el orden importa 

import express from "express";
import routes from "./routes/index.js";
import { noEncontrado, manejarErrores } from "./middlewares/errores.js";
import cookieParser from "cookie-parser";
import cors from "cors";

export const app = express();

const origenesPermitidos = (process.env.ORIGENES_PERMITIDOS ?? "http://localhost:3000").split(",");
app.use(cors({ origin: origenesPermitidos, credentials: true }));

app.use(express.json());
app.use(cookieParser()); // permite leer las cookies
app.use("/api", routes);   // todas las rutas empiezan con /api

app.use(noEncontrado);     // si nada coincidió
app.use(manejarErrores);   // siempre al final