import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. No hay token provisto.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.usuario = verified;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Token no válido' });
  }
};

export default authMiddleware;