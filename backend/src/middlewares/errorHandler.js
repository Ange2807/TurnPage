const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: messages.join(', ') });
  }

  // Duplicate key (username o email ya existe)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ error: `El ${field} ya está en uso` });
  }

  // CastError (ID inválido)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'ID inválido' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
};

export default errorHandler;
