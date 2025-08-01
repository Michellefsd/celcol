// routes/avisos.route.js
const express = require('express');
const router = express.Router();
const avisoController = require('../controllers/avisos.controller');

router.get('/', avisoController.listarAvisos);
router.put('/:id/leido', avisoController.marcarComoLeido);
router.delete('/:id', avisoController.eliminarAviso);

module.exports = router;
