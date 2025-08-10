const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auth.controller');
const { authenticateJWT, authorize } = require('../../middleware/auth');

// públicas
router.post('/login',   ctrl.login);
router.post('/accept',  ctrl.accept);
router.post('/refresh', ctrl.refresh); // usa cookie httpOnly
router.post('/logout',  ctrl.logout);

// solo ADMIN
router.post('/invite', authenticateJWT, authorize(['ADMIN']), ctrl.invite);

// perfil actual
router.get('/me', authenticateJWT, ctrl.me);

module.exports = router;
