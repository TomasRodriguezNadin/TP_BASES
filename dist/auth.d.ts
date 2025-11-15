import { Client } from 'pg';
export interface Usuario {
    id: number;
    username: string;
    nombre: string | null;
    email: string | null;
}
/**
 * Hashea una contraseña usando bcrypt
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * Verifica una contraseña contra su hash
 */
export declare function verifyPassword(password: string, hash: string): Promise<boolean>;
/**
 * Autentica un usuario con username y password
 * Retorna el usuario si las credenciales son correctas, null en caso contrario
 */
export declare function autenticarUsuario(client: Client, username: string, password: string): Promise<Usuario | null>;
/**
 * Crea un nuevo usuario
 */
export declare function crearUsuario(client: Client, username: string, password: string, nombre?: string, email?: string): Promise<Usuario | null>;
/**
 * Cambia la contraseña de un usuario
 */
export declare function cambiarPassword(client: Client, userId: number, newPassword: string): Promise<boolean>;
//# sourceMappingURL=auth.d.ts.map