// GET /api/resenas/populares
async function getLibrosPopulares(req, res) {
  try {
    const populares = await Resena.aggregate([
      {
        $group: {
          _id: '$ol_id',
          titulo_libro:  { $first: '$titulo_libro'  },
          portada_libro: { $first: '$portada_libro' },
          autor_libro:   { $first: '$autor_libro'   },
          total_resenas: { $sum: 1 },
          promedio_calificacion: { $avg: '$calificacion' },
          total_recomiendan: {
            $sum: { $cond: ['$recomienda', 1, 0] }
          },
        },
      },
      {
        $addFields: {
          porcentaje_recomienda: {
            $round: [
              { $multiply: [
                { $divide: ['$total_recomiendan', '$total_resenas'] },
                100
              ]},
              0
            ]
          },
          promedio_calificacion: {
            $round: ['$promedio_calificacion', 1]
          },
          ol_id: '$_id',
        },
      },
      { $sort: { total_resenas: -1 } },
      { $limit: 12 },
    ]);

    res.json(populares);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { 
  crearResena, 
  getResenasPorLibro, 
  getMisResenas, 
  eliminarResena,
  getLibrosPopulares, // ← agregar
};