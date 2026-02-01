require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

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
  Accessibility
} = require("./models");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "..", "frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "Actividad2.html"));
});

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "🚀 Servidor de La Cueva del Multiverso funcionando correctamente",
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? "Conectada" : "Desconectada"
  });
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ Conectado exitosamente a MongoDB Atlas");
    initializeCategories();
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

    const newUser = await Usuario.create({
      name, email, phone, password, type: "user", registrationDate, registrationTime
    });

    const { password: _, ...userData } = newUser.toObject();
    res.status(201).json({ message: "Cuenta creada exitosamente", user: userData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Usuario.findOne({ email, password });
    if (!user) {
      return res.status(401).json({ error: "Correo o contraseña incorrectos" });
    }
    res.json({ user: user.toObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await Usuario.find({});
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/users/:oldEmail", async (req, res) => {
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
        return res.status(400).json({ error: "El correo electrónico ya está en uso" });
      }
    }

    if (name !== undefined)     user.name = name;
    if (newEmail !== undefined) user.email = newEmail.toLowerCase();
    if (phone !== undefined)    user.phone = phone;
    if (password)               user.password = password;
    if (type !== undefined)     user.type = type;

    await user.save();
    res.json({ message: "Usuario actualizado exitosamente", user: user.toObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/users/:email", async (req, res) => {
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
      category:        p.categoriaId ? p.categoriaId.nombre : "",
      price:           p.price,
      seller:          p.seller,
      image:           p.image
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const { title, description, fullDescription, category, price, seller, image } = req.body;

    const cat = await Categoria.findOne({ nombre: category });
    if (!cat) {
      return res.status(400).json({ error: `Categoría "${category}" no encontrada` });
    }

    const product = await Producto.create({
      title, description, fullDescription, categoriaId: cat._id, price, seller, image
    });

    res.status(201).json({
      _id: product._id,
      title: product.title,
      description: product.description,
      fullDescription: product.fullDescription,
      category: category,
      price: product.price,
      seller: product.seller,
      image: product.image
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    const { category, ...rest } = req.body;

    const updateData = { ...rest };
    if (category) {
      const cat = await Categoria.findOne({ nombre: category });
      if (!cat) {
        return res.status(400).json({ error: `Categoría "${category}" no encontrada` });
      }
      updateData.categoriaId = cat._id;
    }

    const product = await Producto.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate("categoriaId", "nombre");

    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({
      _id: product._id,
      title: product.title,
      description: product.description,
      fullDescription: product.fullDescription,
      category: product.categoriaId ? product.categoriaId.nombre : "",
      price: product.price,
      seller: product.seller,
      image: product.image
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/products/:id", async (req, res) => {
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

app.get("/api/cart/:email", async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();
    const user = await Usuario.findOne({ email });
    if (!user) return res.json([]);

    let carrito = await Carrito.findOne({ usuarioId: user._id, activo: true });
    if (!carrito) return res.json([]);

    const detalles = await DetalleCarrito.find({ carritoId: carrito._id })
      .populate("productoId");

    const items = detalles.map(d => ({
      _id:         d._id,
      productoId:  d.productoId ? d.productoId._id : null,
      title:       d.productoId ? d.productoId.title : "",
      description: d.productoId ? d.productoId.description : "",
      price:       d.precio,
      image:       d.productoId ? d.productoId.image : "",
      seller:      d.productoId ? d.productoId.seller : "",
      quantity:    d.cantidad
    }));

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/cart/:email", async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();
    const items = req.body;

    const user = await Usuario.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    let carrito = await Carrito.findOne({ usuarioId: user._id, activo: true });
    if (!carrito) {
      carrito = await Carrito.create({ usuarioId: user._id, activo: true });
    }

    await DetalleCarrito.deleteMany({ carritoId: carrito._id });

    for (const item of items) {
      const producto = await Producto.findOne({ title: item.title });
      if (producto) {
        await DetalleCarrito.create({
          carritoId: carrito._id,
          productoId: producto._id,
          cantidad: item.quantity,
          precio: item.price
        });
      }
    }

    const detalles = await DetalleCarrito.find({ carritoId: carrito._id })
      .populate("productoId");

    const result = detalles.map(d => ({
      _id: d._id,
      productoId: d.productoId ? d.productoId._id : null,
      title: d.productoId ? d.productoId.title : "",
      description: d.productoId ? d.productoId.description : "",
      price: d.precio,
      image: d.productoId ? d.productoId.image : "",
      seller: d.productoId ? d.productoId.seller : "",
      quantity: d.cantidad
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/cart/:email", async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();
    const user = await Usuario.findOne({ email });
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

app.post("/api/orders", async (req, res) => {
  try {
    const { email, orderNumber, date, total, customer, items } = req.body;

    const user = await Usuario.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const orden = await Orden.create({
      usuarioId: user._id,
      orderNumber,
      date,
      total,
      email: email.toLowerCase(),
      customer
    });

    for (const item of items) {
      await DetalleOrden.create({
        ordenId: orden._id,
        productoId: null,
        cantidad: item.quantity,
        precio: item.price,
        title: item.title,
        seller: item.seller
      });
    }

    res.status(201).json({ message: "Orden creada exitosamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/orders/:email", async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();
    const user = await Usuario.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const orden = await Orden.findOne({ usuarioId: user._id }).sort({ _id: -1 });
    if (!orden) {
      return res.status(404).json({ error: "No se encontró orden" });
    }

    const detalles = await DetalleOrden.find({ ordenId: orden._id });

    const orderData = {
      orderNumber: orden.orderNumber,
      date:        orden.date,
      total:       orden.total,
      email:       orden.email,
      customer:    orden.customer,
      items: detalles.map(d => ({
        title:    d.title,
        price:    d.precio,
        quantity: d.cantidad,
        seller:   d.seller
      }))
    };

    res.json(orderData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/notifications", async (req, res) => {
  try {
    const notifications = await Notificacion.find({}).sort({ timestamp: -1 });
    const result = [];
    for (const notif of notifications) {
      let items = [];
      if (notif.ordenId) {
        const detalles = await DetalleOrden.find({ ordenId: notif.ordenId });
        items = detalles.map(d => ({
          title:    d.title,
          quantity: d.cantidad,
          price:    d.precio
        }));
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
    const { orderNumber, customerName, customerEmail, total, date } = req.body;

    const admin = await Usuario.findOne({ type: "admin" });
    if (!admin) {
      return res.status(500).json({ error: "No se encontró usuario administrador" });
    }

    const orden = await Orden.findOne({ orderNumber });

    const notification = await Notificacion.create({
      usuarioId:     admin._id,
      type:          "purchase",
      ordenId:       orden ? orden._id : null,
      orderNumber,
      customerName,
      customerEmail,
      total,
      date,
      read:          false,
      timestamp:     Date.now()
    });

    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/notifications/:id", async (req, res) => {
  try {
    const notification = await Notificacion.findByIdAndUpdate(
      req.params.id, { read: true }, { new: true }
    );
    if (!notification) {
      return res.status(404).json({ error: "Notificación no encontrada" });
    }
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/notifications/markAllRead", async (req, res) => {
  try {
    await Notificacion.updateMany({}, { read: true });
    res.json({ message: "Todas marcadas como leídas" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/notifications/:id", async (req, res) => {
  try {
    const result = await Notificacion.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: "Notificación no encontrada" });
    }
    res.json({ message: "Notificación eliminada" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/notifications", async (req, res) => {
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
          title:       v.title,
          description: v.description,
          price:       v.price,
          seller:      v.seller,
          image:       v.image,
          category:    v.category
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

    const existingTitles = await HistorialVista.find({}).select("title category");

    for (const category of Object.keys(history)) {
      for (const item of history[category]) {
        const yaExiste = await HistorialVista.findOne({ title: item.title, category: category });
        if (!yaExiste) {
          const producto = await Producto.findOne({ title: item.title });

          await HistorialVista.create({
            usuarioId:   null,
            productoId:  producto ? producto._id : null,
            category:    category,
            title:       item.title,
            description: item.description,
            price:       item.price,
            seller:      item.seller,
            image:       item.image,
            viewedAt:    new Date()
          });
        } else {
          await HistorialVista.findOneAndUpdate(
            { title: item.title, category: category },
            { viewedAt: new Date() }
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

app.delete("/api/contacts/:id", async (req, res) => {
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
      if (speechRate !== undefined)   doc.speechRate = speechRate;
      if (colorFilter !== undefined)  doc.colorFilter = colorFilter;
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
});