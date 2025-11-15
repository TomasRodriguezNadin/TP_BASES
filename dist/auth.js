import bcrypt from 'bcrypt';
const SALT_ROUNDS = 10;
/**
 * Hashea una contraseña usando bcrypt
 */
export async function hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
}
/**
 * Verifica una contraseña contra su hash
 */
export async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}
/**
 * Autentica un usuario con username y password
 * Retorna el usuario si las credenciales son correctas, null en caso contrario
 */
export async function autenticarUsuario(client, username, password) {
    try {
        const result = await client.query('SELECT id, username, password_hash, nombre, email FROM tp.usuarios WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return null;
        }
        const user = result.rows[0];
        const passwordValida = await verifyPassword(password, user.password_hash);
        if (!passwordValida) {
            return null;
        }
        return {
            id: user.id,
            username: user.username,
            nombre: user.nombre,
            email: user.email,
        };
    }
    catch (error) {
        console.error('Error al autenticar usuario:', error);
        return null;
    }
}
/**
 * Crea un nuevo usuario
 */
export async function crearUsuario(client, username, password, nombre, email) {
    try {
        const passwordHash = await hashPassword(password);
        const result = await client.query(`INSERT INTO tp.usuarios (username, password_hash, nombre, email)
             VALUES ($1, $2, $3, $4)
             RETURNING id, username, nombre, email`, [username, passwordHash, nombre || null, email || null]);
        return result.rows[0];
    }
    catch (error) {
        console.error('Error al crear usuario:', error);
        return null;
    }
}
/**
 * Cambia la contraseña de un usuario
 */
export async function cambiarPassword(client, userId, newPassword) {
    try {
        const passwordHash = await hashPassword(newPassword);
        await client.query('UPDATE tp.usuarios SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
        return true;
    }
    catch (error) {
        console.error('Error al cambiar contraseña:', error);
        return false;
    }
}
//# sourceMappingURL=auth.js.map