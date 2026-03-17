import express from 'express';
import ParkingDAO from '../database/parking-dao.js';
import UsuarioDAO from '../database/usuario-dao.js';

const router = express.Router();

const parkingDB = new ParkingDAO('datos.sqlite');
const cuentasDB = new UsuarioDAO('datos.sqlite');

router.get('/', (req, res) => {
    res.render('index', { title: 'Dónde Aparqué' });
});

router.get('/historial', (req, res) => {
    res.render('historial', { title: 'Mis Aparcamientos' });
});

router.get('/acceso', (req, res) => {
    res.render('login', { title: 'Acceder' });
});

router.post('/acceso', (req, res) => {
    const { username, password } = req.body;
    let cuenta = cuentasDB.buscarPorNombre(username);

    if (!cuenta) {
        const nuevoId = cuentasDB.registrar(username, password);
        cuenta = { id: nuevoId, nombre: username };
    } else if (cuenta.clave !== password) {
        return res.render('login', {
            title: 'Acceder',
            error: 'Contraseña incorrecta'
        });
    }

    req.session.usuario = { id: cuenta.id, nombre: cuenta.nombre };
    res.redirect('/');
});

router.get('/salir', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

router.post('/api/aparcamientos', (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({ error: 'Sin sesión activa, datos solo en local.' });
    }

    const { lat, lng, timestamp } = req.body;
    const id = parkingDB.guardar(req.session.usuario.id, lat, lng, timestamp);
    res.json({ success: true, insertId: id });
});

router.get('/api/aparcamientos', (req, res) => {
    if (!req.session.usuario) return res.json([]);
    const registros = parkingDB.listarPorUsuario(req.session.usuario.id);
    res.json(registros);
});

export default router;
