import Database from 'better-sqlite3';

export default class ParkingDAO {
    constructor(rutaBD) {
        this.db = new Database(rutaBD);
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS registros_parking (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                id_usuario INTEGER,
                lat REAL NOT NULL,
                lng REAL NOT NULL,
                momento INTEGER NOT NULL,
                en_curso INTEGER DEFAULT 1
            )
        `).run();
    }

    guardar(idUsuario, lat, lng, momento) {
        const consulta = this.db.prepare(
            'INSERT INTO registros_parking (id_usuario, lat, lng, momento, en_curso) VALUES (?, ?, ?, ?, 1)'
        );
        const resultado = consulta.run(idUsuario, lat, lng, momento);
        return resultado.lastInsertRowid;
    }

    listarPorUsuario(idUsuario) {
        const consulta = this.db.prepare(
            'SELECT * FROM registros_parking WHERE id_usuario = ? ORDER BY momento DESC'
        );
        return consulta.all(idUsuario);
    }

    cerrar(id) {
        const consulta = this.db.prepare(
            'UPDATE registros_parking SET en_curso = 0 WHERE id = ?'
        );
        const resultado = consulta.run(id);
        return resultado.changes;
    }
}
