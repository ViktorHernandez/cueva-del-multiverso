require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const passport = require("passport");

require("./config/passport");

const {
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
} = require("./models");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "tu_clave_secreta_super_segura_cambiar_en_produccion";

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5000",
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "frontend")));

app.use(session({
  secret: process.env.SESSION_SECRET || "session_secret_cambiar_en_produccion",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token inválido o expirado" });
    }
    req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user.type !== 'admin') {
    return res.status(403).json({ error: "Acceso denegado. Solo administradores" });
  }
  next();
};

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "Actividad2.html"));
});

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "🚀 Servidor de La Cueva del Multiverso funcionando correctamente con JWT y OAuth",
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? "Conectada" : "Desconectada"
  });
});

app.get("/auth/google", 
  passport.authenticate("google", { 
    scope: ["email", "profile"] 
  })
);

app.get("/auth/google/callback", 
  passport.authenticate("google", { 
    failureRedirect: "/login-failed",
    session: false
  }),
  (req, res) => {
    const { user, token } = req.user;
    
    res.redirect(`/?googleAuth=success&token=${token}&email=${user.email}&name=${user.name}&type=${user.type}`);
  }
);

app.get("/login-failed", (req, res) => {
  res.redirect("/?googleAuth=failed");
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ Conectado exitosamente a MongoDB Atlas");
    initializeCategories();
    initializeDiscountCodes();
    initializeStock();
  })
  .catch((err) => {
    console.error("❌ Error al conectar a MongoDB Atlas:", err.message);
    process.exit(1);
  });

async function initializeCategories() {
  const categories = [
    { nombre: "peliculas",    emoji: "🎬" },
    { nombre: "series",       emoji: "📺" },
    { nombre: "anime",        emoji: "🍥" },
    { nombre: "videojuegos",  emoji: "🎮" }
  ];

  for (const cat of categories) {
    const exists = await Categoria.findOne({ nombre: cat.nombre });
    if (!exists) {
      await Categoria.create(cat);
      console.log(`  ➕ Categoría creada: ${cat.emoji} ${cat.nombre}`);
    }
  }
}

async function initializeStock() {
  const result = await Producto.updateMany(
    { stock: { $exists: false } },
    { $set: { stock: 50 } }
  );
  if (result.modifiedCount > 0) {
    console.log(`  📦 Stock inicializado en 50 para ${result.modifiedCount} productos sin stock.`);
  }
}

async function initializeDiscountCodes() {
  const now = new Date();
  const creadoEn = now.toLocaleDateString("es-MX") + " " + now.toLocaleTimeString("es-MX", { hour12: false });

  const codigos = [
    {
      codigo:       "MULTIVERSO15",
      porcentaje:   15,
      descripcion:  "Descuento especial de La Cueva del Multiverso",
      activo:       true,
      usoMaximo:    0,
      usosActuales: 0,
      fechaExpira:  "",
      creadoEn
    },
    {
      codigo:       "RELIQUIAS20",
      porcentaje:   20,
      descripcion:  "Promo en reliquias legendarias",
      activo:       true,
      usoMaximo:    50,
      usosActuales: 0,
      fechaExpira:  "",
      creadoEn
    }
  ];

  for (const c of codigos) {
    const existe = await CodigoDescuento.findOne({ codigo: c.codigo });
    if (!existe) {
      await CodigoDescuento.create(c);
      console.log(`  🏷️  Código de descuento creado: ${c.codigo} (${c.porcentaje}%)`);
    }
  }
}

app.get("/api/categories", async (req, res) => {
  try {
    const cats = await Categoria.find({});
    res.json(cats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/users/register", async (req, res) => {
  try {
    const { name, email, phone, password, registrationDate, registrationTime } = req.body;

    const exists = await Usuario.findOne({ email });
    if (exists) {
      return res.status(400).json({ error: "El correo electrónico ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await Usuario.create({
      name, 
      email, 
      phone, 
      password: hashedPassword, 
      type: "user", 
      registrationDate, 
      registrationTime
    });

    const token = jwt.sign(
      { 
        id: newUser._id, 
        email: newUser.email, 
        type: newUser.type 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...userData } = newUser.toObject();
    res.status(201).json({ 
      message: "Cuenta creada exitosamente", 
      user: userData,
      token 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await Usuario.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Correo o contraseña incorrectos" });
    }

    let isValidPassword = false;
    
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      isValidPassword = await bcrypt.compare(password, user.password);
    } else if (user.password) {
      isValidPassword = (password === user.password);
      
      if (isValidPassword) {
        console.log(`⚠️  Migrando contraseña de ${email} a hash...`);
        user.password = await bcrypt.hash(password, 10);
        await user.save();
        console.log(`✅ Contraseña de ${email} migrada automáticamente`);
      }
    } else {
      return res.status(401).json({ error: "Esta cuenta usa autenticación con Google" });
    }
    
    if (!isValidPassword) {
      return res.status(401).json({ error: "Correo o contraseña incorrectos" });
    }

    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        type: user.type 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...userData } = user.toObject();
    res.json({ 
      user: userData,
      token 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/verify-token", authenticateToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: req.user 
  });
});

app.get("/api/users/profile", authenticateToken, async (req, res) => {
  try {
    const user = await Usuario.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/users/profile", authenticateToken, async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    
    const user = await Usuario.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    
    const { password: _, ...userData } = user.toObject();
    res.json({ message: "Perfil actualizado exitosamente", user: userData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/users", authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await Usuario.find({});
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/users/:oldEmail", authenticateToken, isAdmin, async (req, res) => {
  try {
    const oldEmail = req.params.oldEmail.toLowerCase();
    const { name, email: newEmail, phone, password, type } = req.body;

    const user = await Usuario.findOne({ email: oldEmail });
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (newEmail && newEmail.toLowerCase() !== oldEmail) {
      const emailExists = await Usuario.findOne({ email: newEmail.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({ error: "El correo electronico ya esta en uso" });
      }
    }

    if (name !== undefined)     user.name = name;
    if (newEmail !== undefined) user.email = newEmail.toLowerCase();
    if (phone !== undefined)    user.phone = phone;
    if (password)               user.password = await require("bcryptjs").hash(password, 10);
    if (type !== undefined)     user.type = type;

    await user.save();
    const { password: _, ...userData } = user.toObject();
    res.json({ message: "Usuario actualizado exitosamente", user: userData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/users/:email", authenticateToken, isAdmin, async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();
    const result = await Usuario.findOneAndDelete({ email });
    if (!result) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json({ message: "Usuario eliminado exitosamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const products = await Producto.find({}).populate("categoriaId", "nombre emoji");
    const result = products.map(p => ({
      _id:             p._id,
      title:           p.title,
      description:     p.description,
      fullDescription: p.fullDescription,
      franchise:       p.franchise || "",
      category:        p.categoriaId ? p.categoriaId.nombre : "",
      price:           p.price,
      seller:          p.seller,
      image:           p.image,
      stock:           p.stock !== undefined ? p.stock : 50
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Producto.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Producto no encontrado" });
    const cat = await Categoria.findById(product.categoriaId);
    res.json({
      _id:             product._id,
      title:           product.title,
      description:     product.description,
      fullDescription: product.fullDescription,
      franchise:       product.franchise || "",
      category:        cat ? cat.nombre : "",
      price:           product.price,
      seller:          product.seller,
      image:           product.image,
      stock:           product.stock !== undefined ? product.stock : 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/products", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { title, description, fullDescription, franchise, category, price, seller, image } = req.body;

    const cat = await Categoria.findOne({ nombre: category });
    if (!cat) {
      return res.status(400).json({ error: `Categoria "${category}" no encontrada` });
    }

    const product = await Producto.create({
      title, description, fullDescription, franchise: franchise || "", categoriaId: cat._id, price, seller, image
    });

    res.status(201).json({
      _id: product._id, title: product.title,
      description: product.description, fullDescription: product.fullDescription,
      franchise: product.franchise || "", category, price: product.price, seller: product.seller, image: product.image,
      stock: product.stock
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/products/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { category, ...rest } = req.body;
    const updateData = { ...rest };

    if (category) {
      const cat = await Categoria.findOne({ nombre: category });
      if (!cat) {
        return res.status(400).json({ error: `Categoria "${category}" no encontrada` });
      }
      updateData.categoriaId = cat._id;
    }

    const product = await Producto.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate("categoriaId", "nombre");

    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({
      _id: product._id, title: product.title,
      description: product.description, fullDescription: product.fullDescription,
      franchise: product.franchise || "",
      category: product.categoriaId ? product.categoriaId.nombre : "",
      price: product.price, seller: product.seller, image: product.image,
      stock: product.stock !== undefined ? product.stock : 50
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/products/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await Producto.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    res.json({ message: "Producto eliminado exitosamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/products/:id/stock", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { cantidad } = req.body;
    if (!cantidad || isNaN(cantidad) || Number(cantidad) <= 0) {
      return res.status(400).json({ error: "Cantidad inválida" });
    }

    const product = await Producto.findByIdAndUpdate(
      req.params.id,
      { $inc: { stock: Number(cantidad) } },
      { new: true }
    ).populate("categoriaId", "nombre");

    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    if (product.stock > 10) {
      await Notificacion.deleteMany({ type: "low_stock", customerName: product.title });
    }

    res.json({
      _id: product._id,
      title: product.title,
      stock: product.stock,
      category: product.categoriaId ? product.categoriaId.nombre : "",
      price: product.price,
      seller: product.seller,
      image: product.image
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/cart", authenticateToken, async (req, res) => {
  try {
    const user = await Usuario.findById(req.user.id);
    if (!user) return res.json([]);

    let carrito = await Carrito.findOne({ usuarioId: user._id, activo: true });
    if (!carrito) return res.json([]);

    const detalles = await DetalleCarrito.find({ carritoId: carrito._id })
      .populate("productoId");

    const items = detalles.map(d => ({
      _id:         d._id,
      productoId:  d.productoId ? d.productoId._id : null,
      productId:   d.productoId ? d.productoId._id : null,
      title:       d.productoId ? d.productoId.title : "",
      description: d.productoId ? d.productoId.description : "",
      price:       d.precio,
      image:       d.productoId ? d.productoId.image : "",
      seller:      d.productoId ? d.productoId.seller : "",
      quantity:    d.cantidad,
      stock:       d.productoId ? d.productoId.stock : 0
    }));

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/cart", authenticateToken, async (req, res) => {
  try {
    const items = req.body;
    const user = await Usuario.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    let carrito = await Carrito.findOne({ usuarioId: user._id, activo: true });
    if (!carrito) {
      carrito = await Carrito.create({ usuarioId: user._id, activo: true });
    }

    await DetalleCarrito.deleteMany({ carritoId: carrito._id });

    for (const item of items) {
      let producto = null;
      if (item.productId || item.productoId) {
        producto = await Producto.findById(item.productId || item.productoId);
      }
      if (!producto) {
        producto = await Producto.findOne({ title: item.title });
      }
      if (producto) {
        await DetalleCarrito.create({
          carritoId:  carrito._id,
          productoId: producto._id,
          cantidad:   item.quantity,
          precio:     item.price
        });
      }
    }

    const detalles = await DetalleCarrito.find({ carritoId: carrito._id }).populate("productoId");
    const result = detalles.map(d => ({
      _id:         d._id,
      productoId:  d.productoId ? d.productoId._id : null,
      productId:   d.productoId ? d.productoId._id : null,
      title:       d.productoId ? d.productoId.title : "",
      description: d.productoId ? d.productoId.description : "",
      price:       d.precio,
      image:       d.productoId ? d.productoId.image : "",
      seller:      d.productoId ? d.productoId.seller : "",
      quantity:    d.cantidad,
      stock:       d.productoId ? d.productoId.stock : 0
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/cart", authenticateToken, async (req, res) => {
  try {
    const user = await Usuario.findById(req.user.id);
    if (!user) return res.json([]);

    const carrito = await Carrito.findOne({ usuarioId: user._id, activo: true });
    if (carrito) {
      await DetalleCarrito.deleteMany({ carritoId: carrito._id });
    }
    res.json([]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/orders", authenticateToken, async (req, res) => {
  try {
    const { orderNumber, date, total, subtotalOriginal, discountCode, discountPercent, discountAmount, discountType, email, customer, items } = req.body;

    const orden = await Orden.create({
      usuarioId: req.user.id,
      orderNumber, date,
      total,
      subtotalOriginal: subtotalOriginal || total,
      discountCode:    discountCode    || "",
      discountPercent: discountPercent || 0,
      discountAmount:  discountAmount  || 0,
      discountType:    discountType    || "",
      email: email.toLowerCase(),
      customer
    });

    const admin = await Usuario.findOne({ type: "admin" });

    for (const item of items) {
      const idProducto = item.productId || item.productoId || null;
      const cantidad = Math.max(1, parseInt(item.quantity) || 1);

      console.log(`\n📦 Procesando item: "${item.title}" | productId="${idProducto}" | cantidad=${cantidad}`);

      let producto = null;

      // Buscar el producto por ID primero, luego por título
      if (idProducto) {
        producto = await Producto.findById(idProducto);
        if (!producto) console.warn(`⚠️  findById(${idProducto}) no encontró producto`);
      }
      if (!producto) {
        producto = await Producto.findOne({ title: item.title });
        if (!producto) console.warn(`⚠️  findOne({title:"${item.title}"}) tampoco encontró producto`);
      }

      if (producto) {
        const stockAntes = producto.stock;
        await Producto.findByIdAndUpdate(producto._id, { $inc: { stock: -cantidad } });
        producto = await Producto.findById(producto._id);
        if (producto.stock < 0) {
          await Producto.findByIdAndUpdate(producto._id, { $set: { stock: 0 } });
          producto.stock = 0;
        }
        console.log(`✅ Stock actualizado: "${producto.title}" | antes=${stockAntes} | después=${producto.stock}`);

        // Guardar DetalleOrden con el productoId real
        await DetalleOrden.create({
          ordenId:    orden._id,
          productoId: producto._id,
          cantidad:   cantidad,
          precio:     item.price,
          title:      item.title,
          seller:     item.seller
        });
      } else {
        console.error(`❌ No se encontró producto: title="${item.title}" id="${idProducto}" — stock NO descontado`);
        // Guardar DetalleOrden de igual manera usando findOne como fallback de título
        // para no romper el registro de la orden aunque no se pueda descontar stock
      }

      if (producto && admin) {
        const stockActual = producto.stock;
        let nivelAlerta = null;
        if (stockActual === 1)       nivelAlerta = 1;
        else if (stockActual <= 3)   nivelAlerta = 3;
        else if (stockActual <= 5)   nivelAlerta = 5;
        else if (stockActual <= 10)  nivelAlerta = 10;

        if (nivelAlerta !== null) {
          const now = new Date();
          const fecha = now.toLocaleDateString("es-MX") + " " + now.toLocaleTimeString("es-MX", { hour12: false });
          await Notificacion.create({
            usuarioId:     admin._id,
            type:          "low_stock",
            ordenId:       null,
            orderNumber:   "",
            customerName:  producto.title,
            customerEmail: "",
            total:         stockActual,
            discountCode:  String(nivelAlerta),
            date:          fecha,
            read:          false,
            timestamp:     Date.now()
          });
        }
      }
    }

    if (discountType === "nuevo_usuario") {
      await Usuario.findByIdAndUpdate(req.user.id, { firstPurchaseUsed: true });
    }

    if (discountType === "codigo" && discountCode) {
      await CodigoDescuento.findOneAndUpdate(
        { codigo: discountCode.toUpperCase() },
        { $inc: { usosActuales: 1 } }
      );
    }

    res.status(201).json({ message: "Orden creada exitosamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/orders/last", authenticateToken, async (req, res) => {
  try {
    const orden = await Orden.findOne({ usuarioId: req.user.id }).sort({ _id: -1 });
    if (!orden) {
      return res.status(404).json({ error: "No se encontro orden" });
    }

    const detalles = await DetalleOrden.find({ ordenId: orden._id });

    res.json({
      orderNumber: orden.orderNumber,
      date:        orden.date,
      total:       orden.total,
      email:       orden.email,
      customer:    orden.customer,
      items: detalles.map(d => ({
        title: d.title, price: d.precio, quantity: d.cantidad, seller: d.seller
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/notifications", authenticateToken, async (req, res) => {
  try {
    const notifications = await Notificacion.find({}).sort({ timestamp: -1 });
    const result = [];
    for (const notif of notifications) {
      let items = [];
      if (notif.ordenId) {
        const detalles = await DetalleOrden.find({ ordenId: notif.ordenId });
        items = detalles.map(d => ({ title: d.title, quantity: d.cantidad, price: d.precio }));
      }
      result.push({ ...notif.toObject(), items });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/notifications", async (req, res) => {
  try {
    const { orderNumber, customerName, customerEmail, total, discountCode, discountPercent, discountAmount, discountType, date } = req.body;

    const admin = await Usuario.findOne({ type: "admin" });
    if (!admin) {
      return res.status(500).json({ error: "No se encontro usuario administrador" });
    }

    const orden = await Orden.findOne({ orderNumber });

    const notification = await Notificacion.create({
      usuarioId:       admin._id,
      type:            "purchase",
      ordenId:         orden ? orden._id : null,
      orderNumber,
      customerName,
      customerEmail,
      total,
      discountCode:    discountCode    || "",
      discountPercent: discountPercent || 0,
      discountAmount:  discountAmount  || 0,
      discountType:    discountType    || "",
      date,
      read:            false,
      timestamp:       Date.now()
    });

    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/notifications/markAllRead", authenticateToken, async (req, res) => {
  try {
    await Notificacion.updateMany({}, { read: true });
    res.json({ message: "Todas marcadas como leidas" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/notifications/:id", authenticateToken, async (req, res) => {
  try {
    const notification = await Notificacion.findByIdAndUpdate(
      req.params.id, { read: true }, { new: true }
    );
    if (!notification) {
      return res.status(404).json({ error: "Notificacion no encontrada" });
    }
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/notifications/:id", authenticateToken, async (req, res) => {
  try {
    const result = await Notificacion.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: "Notificacion no encontrada" });
    }
    res.json({ message: "Notificacion eliminada" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/notifications", authenticateToken, async (req, res) => {
  try {
    await Notificacion.deleteMany({});
    res.json({ message: "Todas las notificaciones eliminadas" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/lastviewed", async (req, res) => {
  try {
    const vistas = await HistorialVista.find({}).sort({ viewedAt: -1 });
    const grouped = {};
    vistas.forEach(v => {
      const cat = v.category || "otros";
      if (!grouped[cat]) grouped[cat] = [];
      const yaExiste = grouped[cat].find(item => item.title === v.title);
      if (!yaExiste && grouped[cat].length < 5) {
        grouped[cat].push({
          title: v.title, description: v.description,
          price: v.price, seller: v.seller,
          image: v.image, category: v.category
        });
      }
    });
    res.json(grouped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/lastviewed", async (req, res) => {
  try {
    const history = req.body;

    for (const category of Object.keys(history)) {
      for (const item of history[category]) {
        const yaExiste = await HistorialVista.findOne({ title: item.title, category });
        if (!yaExiste) {
          const producto = await Producto.findOne({ title: item.title });
          await HistorialVista.create({
            usuarioId: null, productoId: producto ? producto._id : null,
            category, title: item.title, description: item.description,
            price: item.price, seller: item.seller, image: item.image, viewedAt: new Date()
          });
        } else {
          await HistorialVista.findOneAndUpdate(
            { title: item.title, category }, { viewedAt: new Date() }
          );
        }
      }
    }

    const allVistas = await HistorialVista.find({}).sort({ viewedAt: -1 });
    const grouped = {};
    allVistas.forEach(v => {
      const cat = v.category || "otros";
      if (!grouped[cat]) grouped[cat] = [];
      const yaExiste = grouped[cat].find(i => i.title === v.title);
      if (!yaExiste && grouped[cat].length < 5) {
        grouped[cat].push({
          title: v.title, description: v.description,
          price: v.price, seller: v.seller, image: v.image, category: v.category
        });
      }
    });
    res.json(grouped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/lastviewed", async (req, res) => {
  try {
    await HistorialVista.deleteMany({});
    res.json({ message: "Historial limpiado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/contacts", async (req, res) => {
  try {
    const contacts = await Contacto.find({});
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/contacts", async (req, res) => {
  try {
    const contact = await Contacto.create(req.body);
    res.status(201).json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/contacts/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await Contacto.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: "Contacto no encontrado" });
    }
    res.json({ message: "Contacto eliminado exitosamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/accessibility", async (req, res) => {
  try {
    const doc = await Accessibility.findOne({});
    res.json(doc || { screenReader: false, speechRate: 1, colorFilter: "none" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/accessibility", async (req, res) => {
  try {
    const { screenReader, speechRate, colorFilter } = req.body;
    const doc = await Accessibility.findOne({});
    if (doc) {
      if (screenReader !== undefined) doc.screenReader = screenReader;
      if (speechRate   !== undefined) doc.speechRate   = speechRate;
      if (colorFilter  !== undefined) doc.colorFilter  = colorFilter;
      await doc.save();
      res.json(doc);
    } else {
      const newDoc = await Accessibility.create({ screenReader, speechRate, colorFilter });
      res.json(newDoc);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/discounts", authenticateToken, isAdmin, async (req, res) => {
  try {
    const codigos = await CodigoDescuento.find({}).sort({ creadoEn: -1 });
    res.json(codigos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/discounts", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { codigo, porcentaje, descripcion, usoMaximo, fechaExpira } = req.body;

    const existe = await CodigoDescuento.findOne({ codigo: codigo.toUpperCase() });
    if (existe) {
      return res.status(400).json({ error: "Ya existe un código con ese nombre" });
    }

    const now = new Date();
    const creadoEn = now.toLocaleDateString("es-MX") + " " + now.toLocaleTimeString("es-MX", { hour12: false });

    const nuevo = await CodigoDescuento.create({
      codigo: codigo.toUpperCase(),
      porcentaje: Number(porcentaje),
      descripcion: descripcion || "",
      activo: true,
      usoMaximo: Number(usoMaximo) || 0,
      usosActuales: 0,
      fechaExpira: fechaExpira || "",
      creadoEn
    });

    res.status(201).json(nuevo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/discounts/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { porcentaje, descripcion, activo, usoMaximo, fechaExpira } = req.body;
    const update = {};
    if (porcentaje  !== undefined) update.porcentaje  = Number(porcentaje);
    if (descripcion !== undefined) update.descripcion = descripcion;
    if (activo      !== undefined) update.activo      = activo;
    if (usoMaximo   !== undefined) update.usoMaximo   = Number(usoMaximo);
    if (fechaExpira !== undefined) update.fechaExpira = fechaExpira;

    const codigo = await CodigoDescuento.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!codigo) return res.status(404).json({ error: "Código no encontrado" });
    res.json(codigo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/discounts/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await CodigoDescuento.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: "Código no encontrado" });
    res.json({ message: "Código eliminado exitosamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/discounts/validate", authenticateToken, async (req, res) => {
  try {
    const { codigo } = req.body;

    if (codigo.toUpperCase() === "NUEVOUSUARIO10") {
      const usuario = await Usuario.findById(req.user.id);
      if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

      if (usuario.firstPurchaseUsed) {
        return res.status(400).json({ error: "Este descuento de nuevo usuario ya fue utilizado" });
      }

      return res.json({
        valido: true,
        porcentaje: 10,
        descripcion: "Descuento de bienvenida para nuevos usuarios",
        tipo: "nuevo_usuario",
        codigo: "NUEVOUSUARIO10"
      });
    }

    const doc = await CodigoDescuento.findOne({ codigo: codigo.toUpperCase() });

    if (!doc) {
      return res.status(404).json({ error: "Código de descuento no válido" });
    }
    if (!doc.activo) {
      return res.status(400).json({ error: "Este código está desactivado" });
    }
    if (doc.usoMaximo > 0 && doc.usosActuales >= doc.usoMaximo) {
      return res.status(400).json({ error: "Este código ya alcanzó su límite de usos" });
    }
    if (doc.fechaExpira) {
      const expira = new Date(doc.fechaExpira);
      if (!isNaN(expira) && expira < new Date()) {
        return res.status(400).json({ error: "Este código ha expirado" });
      }
    }

    res.json({
      valido: true,
      porcentaje: doc.porcentaje,
      descripcion: doc.descripcion,
      tipo: "codigo",
      codigo: doc.codigo,
      _id: doc._id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/users/new-user-discount", authenticateToken, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.user.id);
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json({ disponible: !usuario.firstPurchaseUsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/reviews/:productoId", async (req, res) => {
  try {
    const resenas = await Resena.find({ productoId: req.params.productoId }).sort({ _id: -1 });
    res.json(resenas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/reviews", authenticateToken, async (req, res) => {
  try {
    const { productoId, calificacion, comentario } = req.body;

    if (!productoId || !calificacion) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    const yaReseno = await Resena.findOne({ productoId, usuarioId: req.user.id });
    if (yaReseno) {
      return res.status(400).json({ error: "Ya escribiste una reseña para este producto" });
    }

    const usuario = await Usuario.findById(req.user.id);
    const now = new Date();
    const fecha = now.toLocaleDateString("es-MX") + " " + now.toLocaleTimeString("es-MX", { hour12: false });

    const resena = await Resena.create({
      productoId,
      usuarioId: req.user.id,
      usuarioName: usuario ? usuario.name : "Usuario",
      calificacion: Number(calificacion),
      comentario: comentario || "",
      fecha
    });

    res.status(201).json(resena);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/reviews/:id", authenticateToken, async (req, res) => {
  try {
    const resena = await Resena.findById(req.params.id);
    if (!resena) return res.status(404).json({ error: "Reseña no encontrada" });

    const esAutor = resena.usuarioId.toString() === req.user.id;
    const esAdmin = req.user.type === "admin";
    if (!esAutor && !esAdmin) return res.status(403).json({ error: "No tienes permiso para eliminar esta reseña" });

    await Resena.findByIdAndDelete(req.params.id);
    res.json({ message: "Reseña eliminada" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/wishlist", authenticateToken, async (req, res) => {
  try {
    const items = await Wishlist.find({ usuarioId: req.user.id }).sort({ addedAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/wishlist", authenticateToken, async (req, res) => {
  try {
    const { productoId, title, description, price, seller, image, category } = req.body;

    const producto = await Producto.findById(productoId);
    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });

    const yaExiste = await Wishlist.findOne({ usuarioId: req.user.id, productoId });
    if (yaExiste) return res.status(400).json({ error: "El producto ya está en tu wishlist" });

    const item = await Wishlist.create({
      usuarioId: req.user.id,
      productoId,
      title:       title       || producto.title,
      description: description || producto.description,
      price:       price       || producto.price,
      seller:      seller      || producto.seller,
      image:       image       || producto.image,
      category:    category    || "",
      addedAt:     new Date()
    });

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/wishlist/:productoId", authenticateToken, async (req, res) => {
  try {
    const result = await Wishlist.findOneAndDelete({ usuarioId: req.user.id, productoId: req.params.productoId });
    if (!result) return res.status(404).json({ error: "Item no encontrado en wishlist" });
    res.json({ message: "Eliminado de wishlist" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/orders/history", authenticateToken, async (req, res) => {
  try {
    const ordenes = await Orden.find({ usuarioId: req.user.id }).sort({ _id: -1 });

    const result = [];
    for (const orden of ordenes) {
      const detalles = await DetalleOrden.find({ ordenId: orden._id });
      result.push({
        _id:              orden._id,
        orderNumber:      orden.orderNumber,
        date:             orden.date,
        total:            orden.total,
        subtotalOriginal: orden.subtotalOriginal,
        discountCode:     orden.discountCode,
        discountPercent:  orden.discountPercent,
        discountAmount:   orden.discountAmount,
        discountType:     orden.discountType,
        email:            orden.email,
        customer:         orden.customer,
        items: detalles.map(d => ({
          title:    d.title,
          price:    d.precio,
          quantity: d.cantidad,
          seller:   d.seller
        }))
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ 
    error: "Ruta no encontrada", 
    message: `La ruta ${req.method} ${req.path} no existe` 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📡 API disponible en http://localhost:${PORT}/api`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 JWT habilitado - Rutas protegidas activas`);
  console.log(`🔑 Google OAuth habilitado`);
});