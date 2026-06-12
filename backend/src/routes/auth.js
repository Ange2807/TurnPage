import { Router } from 'express';
import { registro, login, me } from '../controllers/authController.js';
import authMiddleware from '../middlewares/auth.js';

const router = Router();

router.post('/registro', registro);
router.post('/login', login);
router.get('/me', authMiddleware, me);  // protegida: verifica que el token sea válido
router.get('/populares', getLibrosPopulares); // público — antes de /:ol_id
router.get('/libro/:ol_id', getResenasPorLibro);

export default router;
