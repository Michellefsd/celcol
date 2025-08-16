const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auth.controller');
const { authenticateJWT, authorize } = require('../../middleware/auth');
const auth = require('../controllers/auth.controller');


// públicas
router.post('/login',   ctrl.login);
router.post('/accept',  ctrl.accept);
router.post('/refresh', ctrl.refresh); // usa cookie httpOnly
router.post('/logout',  ctrl.logout);
router.post('/forgot-password', auth.forgotPassword);
router.post('/reset-password', auth.resetPassword);

// solo ADMIN
router.post('/invite', authenticateJWT, authorize(['ADMIN']), ctrl.invite);

// perfil actual
router.get('/me', authenticateJWT, ctrl.me);

module.exports = router;
