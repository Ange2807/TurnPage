import { Schema, model } from 'mongoose';
import { hash, compare } from 'bcrypt';

const usuarioSchema = new Schema({
  username: {
    type: String,
    required: [true, 'El username es obligatorio'],
    unique: true,
    trim: true,
    minlength: [3, 'El username debe tener al menos 3 caracteres'],
    maxlength: [50, 'El username no puede superar 50 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido']
  },
  password_hash: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    default: null
  }
}, { timestamps: true });

// Hash de contraseña antes de guardar
usuarioSchema.pre('save', async function (next) {
  if (!this.isModified('password_hash')) return next();
  this.password_hash = await hash(this.password_hash, 10);
  next();
});

// Método para comparar contraseña
usuarioSchema.methods.compararPassword = function (password) {
  return compare(password, this.password_hash);
};

// Nunca devolver el hash en respuestas
usuarioSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password_hash;
  return obj;
};

export default model('Usuario', usuarioSchema);
