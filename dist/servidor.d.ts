import type { Usuario } from "./auth.js";
import type { Request, Response, NextFunction } from "express";
declare module 'express-session' {
    interface SessionData {
        usuario?: Usuario;
    }
}
export declare function requireAuth(req: Request, res: Response, next: NextFunction): void;
export declare function requireAuthAPI(req: Request, res: Response, next: NextFunction): void;
export declare const ERROR = "<code>ERROR 404 </code> <h1> error <h1>";
//# sourceMappingURL=servidor.d.ts.map