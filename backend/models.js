const mongoose = require("mongoose");
const { Schema } = mongoose;

const categoriaSchema = new Schema(
  {
    nombre: {
      type: String,
      required: true,
      unique: true,
      enum: ["peliculas", "series", "anime", "videojuegos"]
    },
    emoji: { type: String, default: "" }
  },
  { timestamps: false }
);

const Categoria = mongoose.model("Categoria", categoriaSchema);

// ═══════════════════════════════════════════════════════
// ENTIDAD: Usuario
// Relación: 1 Usuario → N Carritos
// Relación: 1 Usuario → N Ordenes
// Relación: 1 Usuario → N Notificaciones
// Relación: N Usuarios ↔ N Productos  (mediante HistorialVistas)
// ═══════════════════════════════════════════════════════
const usuarioSchema = new Schema(
  {
    name:             { type: String, required: true },
    email:            { type: String, required: true, unique: true, lowercase: true },
    phone:            { type: String, default: "" },
    password:         { type: String, required: true },
    type:             { type: String, enum: ["user", "admin"], default: "user" },
    registrationDate: { type: String, default: "" },
    registrationTime: { type: String, default: "" }
  },
  { timestamps: false }
);

const Usuario = mongoose.model("Usuario", usuarioSchema);

// ═══════════════════════════════════════════════════════
// ENTIDAD: Producto
// Relación: N Productos → 1 Categoria  (FK: categoriaId)
// ═══════════════════════════════════════════════════════
const productoSchema = new Schema(
  {
    title:           { type: String, required: true },
    description:     { type: String, required: true },
    fullDescription: { type: String, default: "" },
    categoriaId:     { type: Schema.Types.ObjectId, ref: "Categoria", required: true },
    price:           { type: String, required: true },
    seller:          { type: String, required: true },
    image:           { type: String, required: true }
  },
  { timestamps: false }
);

const Producto = mongoose.model("Producto", productoSchema);

// ═══════════════════════════════════════════════════════
// ENTIDAD: Carrito
// Relación: N Carritos → 1 Usuario  (FK: usuarioId)
// Solo uno puede estar activo a la vez por usuario.
// ═══════════════════════════════════════════════════════
const carritoSchema = new Schema(
  {
    usuarioId: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    activo:    { type: Boolean, default: true }
  },
  { timestamps: true }
);

const Carrito = mongoose.model("Carrito", carritoSchema);

// ═══════════════════════════════════════════════════════
// ENTIDAD: DetalleCarrito  (tabla intermedia Carrito ↔ Producto)
// Resuelve la relación M:N entre Carritos y Productos.
// ═══════════════════════════════════════════════════════
const detalleCarritoSchema = new Schema(
  {
    carritoId:  { type: Schema.Types.ObjectId, ref: "Carrito",  required: true },
    productoId: { type: Schema.Types.ObjectId, ref: "Producto", required: true },
    cantidad:   { type: Number, required: true, default: 1 },
    precio:     { type: String, required: true }
  },
  { timestamps: false }
);

const DetalleCarrito = mongoose.model("DetalleCarrito", detalleCarritoSchema);

// ═══════════════════════════════════════════════════════
// ENTIDAD: Orden
// Relación: N Ordenes → 1 Usuario  (FK: usuarioId)
// ═══════════════════════════════════════════════════════
const ordenSchema = new Schema(
  {
    usuarioId:   { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    orderNumber: { type: String, required: true, unique: true },
    date:        { type: String, default: "" },
    total:       { type: Number, required: true },
    email:       { type: String, required: true },
    customer: {
      name:    String,
      email:   String,
      address: String,
      city:    String,
      zip:     String
    }
  },
  { timestamps: false }
);

const Orden = mongoose.model("Orden", ordenSchema);

// ═══════════════════════════════════════════════════════
// ENTIDAD: DetalleOrden  (tabla intermedia Orden ↔ Producto)
// Resuelve la relación M:N entre Ordenes y Productos.
// ═══════════════════════════════════════════════════════
const detalleOrdenSchema = new Schema(
  {
    ordenId:    { type: Schema.Types.ObjectId, ref: "Orden",    required: true },
    productoId: { type: Schema.Types.ObjectId, ref: "Producto", required: true },
    cantidad:   { type: Number, required: true },
    precio:     { type: String, required: true },
    title:      { type: String, default: "" },
    seller:     { type: String, default: "" }
  },
  { timestamps: false }
);

const DetalleOrden = mongoose.model("DetalleOrden", detalleOrdenSchema);

// ═══════════════════════════════════════════════════════
// ENTIDAD: Notificacion
// Relación: N Notificaciones → 1 Usuario  (FK: usuarioId)
// ═══════════════════════════════════════════════════════
const notificacionSchema = new Schema(
  {
    usuarioId:     { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    type:          { type: String, default: "purchase" },
    ordenId:       { type: Schema.Types.ObjectId, ref: "Orden", default: null },
    orderNumber:   { type: String, default: "" },
    customerName:  { type: String, default: "" },
    customerEmail: { type: String, default: "" },
    total:         { type: Number, default: 0 },
    date:          { type: String, default: "" },
    read:          { type: Boolean, default: false },
    timestamp:     { type: Number, default: Date.now }
  },
  { timestamps: false }
);

const Notificacion = mongoose.model("Notificacion", notificacionSchema);

// ═══════════════════════════════════════════════════════
// ENTIDAD: HistorialVista  (tabla intermedia Usuario ↔ Producto)
// Resuelve la relación M:N entre Usuarios y Productos.
// ═══════════════════════════════════════════════════════
const historialVistaSchema = new Schema(
  {
    usuarioId:   { type: Schema.Types.ObjectId, ref: "Usuario",  default: null },
    productoId:  { type: Schema.Types.ObjectId, ref: "Producto", default: null },
    category:    { type: String, default: "" },
    title:       { type: String, default: "" },
    description: { type: String, default: "" },
    price:       { type: String, default: "" },
    seller:      { type: String, default: "" },
    image:       { type: String, default: "" },
    viewedAt:    { type: Date, default: Date.now }
  },
  { timestamps: false }
);

const HistorialVista = mongoose.model("HistorialVista", historialVistaSchema);

// ═══════════════════════════════════════════════════════
// ENTIDAD: Contacto  (independiente, sin relaciones)
// ═══════════════════════════════════════════════════════
const contactoSchema = new Schema(
  {
    nombre:  { type: String, required: true },
    correo:  { type: String, required: true },
    mensaje: { type: String, required: true },
    fecha:   { type: String, default: "" },
    hora:    { type: String, default: "" }
  },
  { timestamps: false }
);

const Contacto = mongoose.model("Contacto", contactoSchema);

// ═══════════════════════════════════════════════════════
// ENTIDAD: Accessibility  (config extra, fuera del ER)
// ═══════════════════════════════════════════════════════
const accessibilitySchema = new Schema(
  {
    screenReader: { type: Boolean, default: false },
    speechRate:   { type: Number, default: 1 },
    colorFilter:  { type: String, default: "none" }
  },
  { timestamps: false }
);

const Accessibility = mongoose.model("Accessibility", accessibilitySchema);

// ═══════════════════════════════════════════════════════
module.exports = {
  Categoria,
  Usuario,
  Producto,
  Carrito,
  DetalleCarrito,
  Orden,
  DetalleOrden,
  Notificacion,
  HistorialVista,
  Contacto,
  Accessibility
};