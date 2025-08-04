const express = require('express');
const router = express.Router();
const { listarArchivados } = require('../controllers/archivados.controller');

router.get('/', listarArchivados);

module.exports = router;
