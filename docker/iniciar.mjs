// Para que nada quede a medias.
// spawn es para encender otro programa desde javascript

// Arranca los 3 programas de nuestro sistema POPIM + nginx dentro del mismo contenedor.
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

// Railway asigna el puerto público en PORT
const PUERTO = process.env.PORT || "8080";

// nginx: escribe su configuración con el puerto real
const plantilla = readFileSync("/app/nginx.conf.template", "utf8");
writeFileSync("/app/nginx.conf", plantilla.replaceAll("__PUERTO__", PUERTO));

// Cada programa recibe su propio puerto interno
const programas = [
  { nombre: "backend", comando: "node", args: ["src/index.js"], carpeta: "/app/backend", env: { PORT: "4000" } },
  { nombre: "propietario", comando: "node", args: ["server.js"], carpeta: "/app/propietario", env: { PORT: "3000", HOSTNAME: "127.0.0.1" } },
  { nombre: "clinica", comando: "node", args: ["server.js"], carpeta: "/app/clinica", env: { PORT: "3001", HOSTNAME: "127.0.0.1" } },
  { nombre: "nginx", comando: "nginx", args: ["-c", "/app/nginx.conf", "-g", "daemon off;"], carpeta: "/app", env: {} },
];

let apagando = false;
const procesos = [];

// Detiene todo; Railway vuelve a encender el contenedor
function apagar(codigo) {
  if (apagando) return;
  apagando = true;
  for (const p of procesos) p.kill("SIGTERM");
  setTimeout(() => process.exit(codigo), 3000);
}

for (const { nombre, comando, args, carpeta, env } of programas) {
  const hijo = spawn(comando, args, {
    cwd: carpeta,
    stdio: "inherit", // sus mensajes salen en los logs de Railway
    env: { ...process.env, ...env },
  });
  hijo.on("error", (error) => {
    console.error(`[${nombre}] no pudo arrancar: ${error.message}`);
    apagar(1);
  });
  hijo.on("exit", (codigo) => {
    if (!apagando) console.error(`[${nombre}] se detuvo (código ${codigo}). Se apaga el contenedor para que Railway lo reinicie.`);
    apagar(1);
  });
  procesos.push(hijo);
}

// Railway manda SIGTERM al desplegar una versión nueva
process.on("SIGTERM", () => apagar(0));
process.on("SIGINT", () => apagar(0));

console.log(`POPIM en el puerto ${PUERTO}: / (propietario), /clinica (clínica), /api (backend)`);