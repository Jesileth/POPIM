
//

import { pool } from "../config/db.js";

export async function obtenerPerfil(usuarioId) 
{
    const [filas] = await pool.query 
    (
        `SELECT u.id, u.nombre_completo AS nombreCompleto, u.correo, u.telefono,
            u.foto_perfil_url AS fotoPerfilUrl, u.fecha_registro AS fechaRegistro,
            u.ultimo_acceso AS ultimoAcceso,
            ce.codigo AS estadoCodigo, ce.nombre AS estadoNombre,
            p.cedula, p.direccion
       FROM usuarios u
       JOIN propietarios p ON p.usuario_id = u.id
       JOIN catalogo_estados ce ON ce.id = u.estado_id AND ce.entidad = 'USUARIO'
      WHERE u.id = ?`,
    [usuarioId]
    ) ;

    return filas [0] ?? null;
}


// Nombre y telefono estan en usuarios y la dirección en propietarios (2 tablas una transacción)
export async function actualizarPerfil({usuarioId, nombreCompleto, telefono, direccion}) 
{
    const conexion = await pool.getConnection();

    try
    {
        await conexion.beginTransaction();
        await conexion.query 
        (
            "UPDATE usuarios SET nombre_completo = ?, telefono = ? WHERE id = ?",
            [nombreCompleto, telefono, usuarioId]
        );

        await conexion.query 
        (
             "UPDATE propietarios SET direccion = ? WHERE usuario_id = ?",
             [direccion, usuarioId]
        );

        await conexion.commit();

    }
    catch (error)
    {
        await conexion.rollback();
        throw error;
    }

    finally
    {
        conexion.release();
    }
}

export async function obtenerFoto(usuarioId) 
{
    const [filas] = await pool.query
    (
        "SELECT foto_perfil_url AS url FROM usuarios WHERE id = ?", [usuarioId]
    );
    return filas [0]?.url ?? null;
}

export async function actualizarFoto(usuarioId, url) 
{
  await pool.query
  (
    "UPDATE usuarios SET foto_perfil_url = ? WHERE id = ?", [url, usuarioId]
  ) ;

}

export async function obtenerCredenciales(usuarioId) 
{
    const [filas] = await pool.query
    (
        "SELECT contrasena, intentos_fallidos AS intentos, estado_id AS estadoId FROM usuarios WHERE id = ?",
        [usuarioId]
    );
  return filas[0] ?? null;
}

export async function actualizarContrasena(usuarioId, hash)
{
    await pool.query
    (
         "UPDATE usuarios SET contrasena = ?, intentos_fallidos = 0 WHERE id = ?",
         [hash, usuarioId]
    );
}




// ---------- PERSONAL de la clínica (no tiene fila en propietarios) ----------

export async function obtenerUsuarioPersonal(usuarioId)
{
    const [filas] = await pool.query
    (
        ` SELECT u.id, u.nombre_completo AS nombreCompleto, u.correo, u.telefono,
          u.foto_perfil_url AS fotoPerfilUrl, u.ultimo_acceso AS ultimoAcceso,
          DATE(u.fecha_registro) AS fechaRegistro,
          ce.nombre AS estadoNombre
           FROM usuarios u
           JOIN catalogo_estados ce ON ce.id = u.estado_id AND ce.entidad = 'USUARIO'
          WHERE u.id = ?`,
        [usuarioId]
    );
    return filas[0] ?? null;
}

// Nombre y teléfono en usuarios; la presentación (solo veterinarios) en perfil_veterinario
export async function actualizarPerfilPersonal({ usuarioId, nombreCompleto, telefono, presentacion, esVeterinario })
{
    const conexion = await pool.getConnection();
    try
    {
        await conexion.beginTransaction();
        await conexion.query
        (
            "UPDATE usuarios SET nombre_completo = ?, telefono = ? WHERE id = ?",
            [nombreCompleto, telefono, usuarioId]
        );
        if (esVeterinario)
        {
            await conexion.query
            (
                "UPDATE perfil_veterinario SET presentacion = ? WHERE usuario_id = ?",
                [presentacion, usuarioId]
            );
        }
        await conexion.commit();
    }
    catch (error)
    {
        await conexion.rollback();
        throw error;
    }
    finally
    {
        conexion.release();
    }
}