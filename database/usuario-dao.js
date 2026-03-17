import Database from 'better-sqlite3';

export default class UsuarioDAO {
    constructor(rutaBD) {
        this.db = new Database(rutaBD);
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS cuentas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT UNIQUE NOT NULL,
                clave TEXT NOT NULL
            )
        `).run();
    }

    registrar(nombre, clave) {
        try {
            const consulta = this.db.prepare(
                'INSERT INTO cuentas (nombre, clave) VALUES (?, ?)'
            );
            const resultado = consulta.run(nombre, clave);
            return resultado.lastInsertRowid;
        } catch {
            return null;
        }
    }

    buscarPorNombre(nombre) {
        const consulta = this.db.prepare('SELECT * FROM cuentas WHERE nombre = ?');
        return consulta.get(nombre);
    }
}
