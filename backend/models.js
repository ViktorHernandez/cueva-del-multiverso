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

const usuarioSchema = new Schema(
  {
    name:               { type: String, required: true },
    email:              { type: String, required: true, unique: true, lowercase: true },
    phone:              { type: String, default: "" },
    password:           { type: String, default: "" },
    type:               { type: String, enum: ["user", "admin"], default: "user" },
    registrationDate:   { type: String, default: "" },
    registrationTime:   { type: String, default: "" },
    googleId:           String,
    firstPurchaseUsed:  { type: Boolean, default: false }
  },
  { timestamps: false }
);

const Usuario = mongoose.model("Usuario", usuarioSchema);

const productoSchema = new Schema(
  {
    title:           { type: String, required: true },
    description:     { type: String, required: true },
    fullDescription: { type: String, default: "" },
    franchise:       { type: String, default: "" },
    categoriaId:     { type: Schema.Types.ObjectId, ref: "Categoria", required: true },
    price:           { type: String, required: true },
    seller:          { type: String, required: true },
    image:           { type: String, required: true },
    stock:           { type: Number, default: 50, min: 0 }
  },
  { timestamps: false }
);

const Producto = mongoose.model("Producto", productoSchema);

const carritoSchema = new Schema(
  {
    usuarioId: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    activo:    { type: Boolean, default: true }
  },
  { timestamps: true }
);

const Carrito = mongoose.model("Carrito", carritoSchema);

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

const ordenSchema = new Schema(
  {
    usuarioId:        { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    orderNumber:      { type: String, required: true, unique: true },
    date:             { type: String, default: "" },
    total:            { type: Number, required: true },
    subtotalOriginal: { type: Number, default: 0 },
    discountCode:     { type: String, default: "" },
    discountPercent:  { type: Number, default: 0 },
    discountAmount:   { type: Number, default: 0 },
    discountType:     { type: String, default: "" },
    email:            { type: String, required: true },
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

const detalleOrdenSchema = new Schema(
  {
    ordenId:    { type: Schema.Types.ObjectId, ref: "Orden",    required: true },
    productoId: { type: Schema.Types.ObjectId, ref: "Producto", default: null },
    cantidad:   { type: Number, required: true },
    precio:     { type: String, required: true },
    title:      { type: String, default: "" },
    seller:     { type: String, default: "" }
  },
  { timestamps: false }
);

const DetalleOrden = mongoose.model("DetalleOrden", detalleOrdenSchema);

const notificacionSchema = new Schema(
  {
    usuarioId:       { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    type:            { type: String, default: "purchase" },
    ordenId:         { type: Schema.Types.ObjectId, ref: "Orden", default: null },
    orderNumber:     { type: String, default: "" },
    customerName:    { type: String, default: "" },
    customerEmail:   { type: String, default: "" },
    total:           { type: Number, default: 0 },
    discountCode:    { type: String, default: "" },
    discountPercent: { type: Number, default: 0 },
    discountAmount:  { type: Number, default: 0 },
    discountType:    { type: String, default: "" },
    date:            { type: String, default: "" },
    read:            { type: Boolean, default: false },
    timestamp:       { type: Number, default: Date.now }
  },
  { timestamps: false }
);

const Notificacion = mongoose.model("Notificacion", notificacionSchema);

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

const accessibilitySchema = new Schema(
  {
    screenReader: { type: Boolean, default: false },
    speechRate:   { type: Number, default: 1 },
    colorFilter:  { type: String, default: "none" }
  },
  { timestamps: false }
);

const Accessibility = mongoose.model("Accessibility", accessibilitySchema);

const codigoDescuentoSchema = new Schema(
  {
    codigo:      { type: String, required: true, unique: true, uppercase: true },
    porcentaje:  { type: Number, required: true, min: 1, max: 100 },
    descripcion: { type: String, default: "" },
    activo:      { type: Boolean, default: true },
    usoMaximo:   { type: Number, default: 0 },
    usosActuales:{ type: Number, default: 0 },
    fechaExpira: { type: String, default: "" },
    creadoEn:    { type: String, default: "" }
  },
  { timestamps: false }
);

const CodigoDescuento = mongoose.model("CodigoDescuento", codigoDescuentoSchema);

const resenaSchema = new Schema(
  {
    productoId:  { type: Schema.Types.ObjectId, ref: "Producto", required: true },
    usuarioId:   { type: Schema.Types.ObjectId, ref: "Usuario",  required: true },
    usuarioName: { type: String, default: "" },
    calificacion:{ type: Number, required: true, min: 1, max: 5 },
    comentario:  { type: String, default: "" },
    fecha:       { type: String, default: "" }
  },
  { timestamps: false }
);

const Resena = mongoose.model("Resena", resenaSchema);

const wishlistSchema = new Schema(
  {
    usuarioId:   { type: Schema.Types.ObjectId, ref: "Usuario",  required: true },
    productoId:  { type: Schema.Types.ObjectId, ref: "Producto", required: true },
    title:       { type: String, default: "" },
    description: { type: String, default: "" },
    price:       { type: String, default: "" },
    seller:      { type: String, default: "" },
    image:       { type: String, default: "" },
    category:    { type: String, default: "" },
    addedAt:     { type: Date, default: Date.now }
  },
  { timestamps: false }
);

const Wishlist = mongoose.model("Wishlist", wishlistSchema);

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
  Accessibility,
  CodigoDescuento,
  Resena,
  Wishlist
};