// Datos de demostración del módulo administrador. Sustituir las funciones por peticion()
// cuando estén disponibles los endpoints del backend.
let personal = [
 {id:"p1",nombre:"Dra. Ana Morales",correo:"ana.morales@correo.com",rol:"Veterinario",licencia:"VET-1042",especialidad:"Medicina General",estado:"Activa",vinculo:"Activo",telefono:"8888-1024"},
 {id:"p2",nombre:"Dr. José Rivera",correo:"jose.rivera@correo.com",rol:"Veterinario",licencia:"VET-2210",especialidad:"Dermatología",estado:"Activa",vinculo:"Activo",telefono:"8888-2210"},
 {id:"p3",nombre:"Dra. Karla Díaz",correo:"karla.diaz@correo.com",rol:"Veterinario",licencia:"VET-1877",especialidad:"Cirugía General",estado:"Bloqueada",vinculo:"Activo",telefono:"8888-1877"},
 {id:"p4",nombre:"Dr. Luis Herrera",correo:"luis.herrera@correo.com",rol:"Veterinario",licencia:"VET-3305",especialidad:"Medicina de Animales Exóticos",estado:"Activa",vinculo:"Activo",telefono:"8888-3305"},
 {id:"p5",nombre:"Rosa Castillo",correo:"rosa.castillo@correo.com",rol:"Recepcionista",licencia:"—",especialidad:"—",estado:"Activa",vinculo:"Activo",telefono:"8888-1001"},
 {id:"p6",nombre:"Marvin López",correo:"marvin.lopez@correo.com",rol:"Recepcionista",licencia:"—",especialidad:"—",estado:"Activa",vinculo:"Activo",telefono:"8888-1002"},
 {id:"p7",nombre:"Elena Pérez",correo:"elena.perez@correo.com",rol:"Recepcionista",licencia:"—",especialidad:"—",estado:"Pendiente de activación",vinculo:"Activo",telefono:"8888-1003"},
 {id:"p8",nombre:"Dr. Mario Sánchez",correo:"mario.sanchez@correo.com",rol:"Veterinario",licencia:"VET-0991",especialidad:"Cirugía Menor",estado:"Activa",vinculo:"Inactivo",telefono:"8888-0991"},
];
export const listarPersonal = async () => personal.map(x=>({...x}));
export const desbloquearPersonal = async (id) => { const p=personal.find(x=>x.id===id); if(!p) throw new Error("No se encontró la persona"); p.estado="Activa"; return {...p}; };
export const vincularPersonal = async (datos) => { const p={id:`p${Date.now()}`,...datos,estado:"Pendiente de activación",vinculo:"Activo",licencia:datos.rol==="Veterinario"?datos.licencia:"—",especialidad:datos.rol==="Veterinario"?datos.especialidad:"—"}; personal=[p,...personal]; return {...p}; };
export const guardarClinica = async (datos) => ({...datos});
