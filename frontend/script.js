document.addEventListener("DOMContentLoaded", () => {

    const API_BASE = window.location.origin + "/api";

    function getAuthToken() {
        return localStorage.getItem("authToken");
    }

    function setAuthToken(token) {
        localStorage.setItem("authToken", token);
    }

    function removeAuthToken() {
        localStorage.removeItem("authToken");
    }

    function getAuthHeaders() {
        const token = getAuthToken();
        if (token) {
            return {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            };
        }
        return { "Content-Type": "application/json" };
    }

    async function verifyToken() {
        const token = getAuthToken();
        if (!token) return null;

        try {
            const res = await fetch(`${API_BASE}/verify-token`, {
                headers: getAuthHeaders()
            });
            
            if (res.ok) {
                const data = await res.json();
                return data.user;
            }
            
            removeAuthToken();
            return null;
        } catch (err) {
            console.warn("⚠️ Error verificando token:", err.message);
            removeAuthToken();
            return null;
        }
    }

    function handleGoogleAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const googleAuth = urlParams.get('googleAuth');
        const token = urlParams.get('token');
        const name = urlParams.get('name');

        if (googleAuth === 'success' && token) {
            setAuthToken(token);
            window.history.replaceState({}, document.title, window.location.pathname);
            alert(`✅ Bienvenido ${decodeURIComponent(name)}! Has iniciado sesión con Google.`);
            checkUserSession();
        } else if (googleAuth === 'failed') {
            alert('❌ Error al iniciar sesión con Google. Intenta nuevamente.');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    function loginWithGoogle() {
        window.location.href = `${window.location.origin}/auth/google`;
    }
    window.loginWithGoogle = loginWithGoogle;


    const EMAILJS_CONFIG = {
        PUBLIC_KEY: "wjgohdMEJc_YSabcL",   
        SERVICE_ID: "service_da3m7qh",         
        TEMPLATE_REGISTER: "template_0o5fuyq", 
        TEMPLATE_LOGIN: "template_0q1nudg"     
    };
    
    if (typeof emailjs !== 'undefined') {
        emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
        console.log("✅ EmailJS inicializado correctamente");
    } else {
        console.error("❌ EmailJS no está cargado. Verifica que el script CDN esté en el HTML");
    }
    
    function isRealEmail(email) {
        const realDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 
                            'icloud.com', 'live.com', 'msn.com', 'protonmail.com'];
        const domain = email.split('@')[1];
        return realDomains.includes(domain);
    }
    
    async function sendRegistrationEmail(userData) {
        if (!isRealEmail(userData.email)) {
            console.log("📧 Email de prueba detectado, no se enviará correo");
            return;
        }
        
        try {
            const templateParams = {
                user_name: userData.name,              
                user_email: userData.email,            
                user_phone: userData.phone,        
                registration_date: userData.registrationDate,  
                registration_time: userData.registrationTime   
            };
            
            console.log("📤 Enviando email de registro...");
            console.log("📧 Destinatario:", userData.email);
            console.log("📝 Parámetros del template:", templateParams);
            
            const response = await emailjs.send(
                EMAILJS_CONFIG.SERVICE_ID,
                EMAILJS_CONFIG.TEMPLATE_REGISTER,
                templateParams
            );
            
            console.log("✅ Email de registro enviado exitosamente!");
            console.log("📋 Respuesta de EmailJS:", response);
            
        } catch (error) {
            console.error("❌ Error al enviar email de registro:");
            console.error("📋 Status:", error.status);
            console.error("📋 Texto del error:", error.text);
            console.error("📋 Error completo:", error);
            
            if (error.status === 422) {
                console.error("💡 Error 422: Verifica que el campo 'To email' en tu template de EmailJS esté configurado como {{user_email}}");
            } else if (error.status === 400) {
                console.error("💡 Error 400: Verifica que el Template ID sea correcto:", EMAILJS_CONFIG.TEMPLATE_REGISTER);
            }
        }
    }
    
    async function sendLoginEmail(userData) {
        if (!isRealEmail(userData.email)) {
            console.log("📧 Email de prueba detectado, no se enviará correo");
            return;
        }
        
        try {
            const now = new Date();
            const loginDate = now.toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' });
            const loginTime = now.toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid' });
            
            const templateParams = {
                user_name: userData.name,  
                user_email: userData.email, 
                login_date: loginDate,         
                login_time: loginTime      
            };
            
            console.log("📤 Enviando email de login...");
            console.log("📧 Destinatario:", userData.email);
            console.log("📝 Parámetros del template:", templateParams);
            
            const response = await emailjs.send(
                EMAILJS_CONFIG.SERVICE_ID,
                EMAILJS_CONFIG.TEMPLATE_LOGIN,
                templateParams
            );
            
            console.log("✅ Email de login enviado exitosamente!");
            console.log("📋 Respuesta de EmailJS:", response);
            
        } catch (error) {
            console.error("❌ Error al enviar email de login:");
            console.error("📋 Status:", error.status);
            console.error("📋 Texto del error:", error.text);
            console.error("📋 Error completo:", error);
            
            if (error.status === 422) {
                console.error("💡 Error 422: Verifica que el campo 'To email' en tu template de EmailJS esté configurado como {{user_email}}");
            } else if (error.status === 400) {
                console.error("💡 Error 400: Verifica que el Template ID sea correcto:", EMAILJS_CONFIG.TEMPLATE_LOGIN);
            }
        }
    }

    class Usuario {
        constructor(nombre, correo, mensaje) {
            this.nombre = nombre;
            this.correo = correo;
            this.mensaje = mensaje;
            this.fecha = "";
            this.hora = "";
        }

        async horaRegistro() {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                
                const response = await fetch(
                    'https://timeapi.bio/timeapi/time/components',
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            region: 'Europe/Madrid',
                            fields: 'year,month,day,hour,minute'
                        }),
                        signal: controller.signal
                    }
                );
                
                clearTimeout(timeoutId);
                const data = await response.json();
                
                this.fecha = `${data.year}-${data.month}-${data.day}`;
                this.hora = `${data.hour}:${data.minute}`;
            } catch (error) {
                console.warn("⚠️ API timeout o error, usando hora local:", error.message);
                
                const now = new Date();
                const optionsDate = { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' };
                const optionsTime = { timeZone: 'Europe/Madrid', hour12: false, hour: '2-digit', minute: '2-digit' };
                const fecha = now.toLocaleDateString('es-ES', optionsDate).split('/');
                this.fecha = `${fecha[2]}-${fecha[1]}-${fecha[0]}`;
                this.hora = now.toLocaleTimeString('es-ES', optionsTime);
            }
        }
    }

    const authOverlay = document.getElementById("authOverlay");
    const authClose = document.getElementById("authClose");
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const userInfo = document.getElementById("userInfo");
    const userName = document.getElementById("userName");
    const loginContainer = document.getElementById("loginContainer");
    const registerContainer = document.getElementById("registerContainer");
    const showRegister = document.getElementById("showRegister");
    const showLogin = document.getElementById("showLogin");
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    const profileOverlay = document.getElementById("profileOverlay");
    const profileClose = document.getElementById("profileClose");
    const profileForm = document.getElementById("profileForm");
    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");
    const profilePhone = document.getElementById("profilePhone");
    const profilePassword = document.getElementById("profilePassword");
    const profileConfirmPassword = document.getElementById("profileConfirmPassword");

    let currentUser = null;

    async function initializeAdminUser() {
        console.log("ℹ️ Para crear el admin, usa el endpoint POST /api/users/register con email admin@cueva.com y luego cambia su tipo desde MongoDB Atlas o con el script seed.");
    }

    initializeAdminUser();

    const adminOverlay = document.getElementById("adminOverlay");
    const adminClose = document.getElementById("adminClose");
    const adminPanelBtn = document.getElementById("adminPanelBtn");
    const adminSection = document.getElementById("adminSection");

    const adminTabs = document.querySelectorAll(".admin-tab");
    const adminTabContents = document.querySelectorAll(".admin-tab-content");

    const usersTableBody = document.getElementById("usersTableBody");
    const searchUsers = document.getElementById("searchUsers");
    const totalUsersEl = document.getElementById("totalUsers");
    const totalAdminsEl = document.getElementById("totalAdmins");

    const editUserOverlay = document.getElementById("editUserOverlay");
    const editUserClose = document.getElementById("editUserClose");
    const editUserForm = document.getElementById("editUserForm");

    const addProductBtn = document.getElementById("addProductBtn");
    const productsTableBody = document.getElementById("productsTableBody");
    const searchProducts = document.getElementById("searchProducts");
    const productFormOverlay = document.getElementById("productFormOverlay");
    const productFormClose = document.getElementById("productFormClose");
    const productForm = document.getElementById("productForm");

    const totalProductsEl = document.getElementById("totalProducts");
    const categoryStatsEl = document.getElementById("categoryStats");
    const totalContactsEl = document.getElementById("totalContacts");
    const totalViewsEl = document.getElementById("totalViews");

    const cartSection = document.getElementById("cartSection");
    const cartBtn = document.getElementById("cartBtn");
    const cartCount = document.getElementById("cartCount");
    const cartOverlay = document.getElementById("cartOverlay");
    const cartClose = document.getElementById("cartClose");
    const cartItemsContainer = document.getElementById("cartItemsContainer");
    const emptyCartMessage = document.getElementById("emptyCartMessage");
    const cartSummary = document.getElementById("cartSummary");
    const cartSubtotal = document.getElementById("cartSubtotal");
    const cartGrandTotal = document.getElementById("cartGrandTotal");
    const checkoutBtn = document.getElementById("checkoutBtn");

    const checkoutOverlay = document.getElementById("checkoutOverlay");
    const checkoutClose = document.getElementById("checkoutClose");
    const checkoutForm = document.getElementById("checkoutForm");
    const checkoutItems = document.getElementById("checkoutItems");
    const checkoutTotal = document.getElementById("checkoutTotal");

    let appliedDiscount = null;

    const confirmationOverlay = document.getElementById("confirmationOverlay");
    const confirmationClose = document.getElementById("confirmationClose");
    const closeConfirmationBtn = document.getElementById("closeConfirmationBtn");
    const downloadInvoiceBtn = document.getElementById("downloadInvoiceBtn");

    let cart = [];
    let lastOrder = null;
    let wishlist = [];
    let currentReviewProductId = null;
    let selectedStars = 0;

    const notificationSection = document.getElementById("notificationSection");
    const notificationBtn = document.getElementById("notificationBtn");
    const notificationCount = document.getElementById("notificationCount");
    const notificationOverlay = document.getElementById("notificationOverlay");
    const notificationClose = document.getElementById("notificationClose");
    const notificationsContainer = document.getElementById("notificationsContainer");
    const emptyNotifications = document.getElementById("emptyNotifications");
    const markAllReadBtn = document.getElementById("markAllReadBtn");
    const clearNotificationsBtn = document.getElementById("clearNotificationsBtn");

    let notifications = [];

    async function checkUserSession() {
        const userData = await verifyToken();

        if (userData) {
            try {
                const res = await fetch(`${API_BASE}/users/profile`, {
                    headers: getAuthHeaders()
                });
                
                if (res.ok) {
                    currentUser = await res.json();
                } else {
                    removeAuthToken();
                    currentUser = null;
                }
            } catch (e) {
                console.warn("⚠️ No se pudo restaurar sesión:", e.message);
                removeAuthToken();
                currentUser = null;
            }
        }

        if (currentUser) {
            loginBtn.classList.add("hidden");
            userInfo.classList.remove("hidden");
            userName.textContent = `👤 ${currentUser.name}`;
        
            await loadCart();
            await loadWishlist();
        
            cartSection.classList.remove("hidden");
            updateCartCount();

            try {
                const resDisc = await fetch(`${API_BASE}/users/new-user-discount`, {
                    headers: getAuthHeaders()
                });
                if (resDisc.ok) {
                    const discData = await resDisc.json();
                    if (discData.disponible) {
                        const hint = document.getElementById("newUserDiscountHint");
                        if (hint) hint.classList.remove("hidden");
                    } else {
                        const hint = document.getElementById("newUserDiscountHint");
                        if (hint) hint.classList.add("hidden");
                    }
                }
            } catch (e) { /* silencioso */ }
        
            if (currentUser.type === "admin") {
                adminSection.classList.remove("hidden");
                notificationSection.classList.remove("hidden");
                await loadNotifications();
                updateNotificationCount();
            } else {
                adminSection.classList.add("hidden");
                notificationSection.classList.add("hidden");
            }
        } else {
            loginBtn.classList.remove("hidden");
            userInfo.classList.add("hidden");
        
            adminSection.classList.add("hidden");
            notificationSection.classList.add("hidden");
        
            cart = [];
            cartSection.classList.add("hidden");
        }
    }

    async function loadCart() {
        if (!currentUser) return;
        try {
            const res = await fetch(`${API_BASE}/cart`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                cart = data.map(item => ({
                    ...item,
                    productId: item.productId || item.productoId || null,
                    stock: item.stock !== undefined ? item.stock : undefined
                }));
            }
        } catch (err) {
            console.warn("⚠️ No se pudo cargar el carrito:", err.message);
            cart = [];
        }
    }

    async function saveCart() {
        if (!currentUser) return;
        try {
            const res = await fetch(`${API_BASE}/cart`, {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify(cart)
            });
            if (res.ok) {
                const data = await res.json();
                cart = data.map(item => ({
                    ...item,
                    productId: item.productId || item.productoId || null,
                    stock: item.stock !== undefined ? item.stock : undefined
                }));
            }
        } catch (err) {
            console.warn("⚠️ No se pudo guardar el carrito:", err.message);
        }
    }

    async function loadNotifications() {
        try {
            const res = await fetch(`${API_BASE}/notifications`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                notifications = await res.json();
            }
        } catch (err) {
            console.warn("⚠️ No se pudieron cargar notificaciones:", err.message);
            notifications = [];
        }
    }

    loginBtn.addEventListener("click", () => {
        authOverlay.classList.add("show");
        loginContainer.classList.remove("hidden");
        registerContainer.classList.add("hidden");
    });

    authClose.addEventListener("click", () => {
        authOverlay.classList.remove("show");
    });

    authOverlay.addEventListener("click", (e) => {
        if (e.target === authOverlay) {
            authOverlay.classList.remove("show");
        }
    });

    showRegister.addEventListener("click", () => {
        loginContainer.classList.add("hidden");
        registerContainer.classList.remove("hidden");
    });

    showLogin.addEventListener("click", () => {
        registerContainer.classList.add("hidden");
        loginContainer.classList.remove("hidden");
    });

    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("registerName").value.trim();
        const email = document.getElementById("registerEmail").value.trim();
        const phone = document.getElementById("registerPhone").value.trim();
        const password = document.getElementById("registerPassword").value;
        const confirmPassword = document.getElementById("registerConfirmPassword").value;

        if (password !== confirmPassword) {
            alert("❌ Las contraseñas no coinciden");
            return;
        }

        let registrationDate = "";
        let registrationTime = "";
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1000000);
            
            const response = await fetch(
                'https://timeapi.bio/timeapi/time/components',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        region: 'Europe/Madrid',
                        fields: 'year,month,day,hour,minute,second'
                    }),
                    signal: controller.signal
                }
            );
            clearTimeout(timeoutId);
            const data = await response.json();
            
            registrationDate = `${data.day}/${data.month}/${data.year}`;
            registrationTime = `${String(data.hour).padStart(2, '0')}:${String(data.minute).padStart(2, '0')}:${String(data.second).padStart(2, '0')}`;
        } catch (error) {
            console.warn("⚠️ API timeout o error, usando hora local:", error.message);
            
            const now = new Date();
            registrationDate = now.toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' });
            registrationTime = now.toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid', hour12: false });
        }

        try {
            const res = await fetch(`${API_BASE}/users/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, phone, password, registrationDate, registrationTime })
            });

            if (!res.ok) {
                const err = await res.json();
                alert(`❌ ${err.error}`);
                return;
            }

            const data = await res.json();
            
            if (data.token) {
                setAuthToken(data.token);
            }

            await sendRegistrationEmail({
                name, 
                email, 
                phone, 
                registrationDate, 
                registrationTime
            });
            
            alert("✅ Cuenta creada exitosamente. Ahora puedes iniciar sesión.");
            registerForm.reset();
            registerContainer.classList.add("hidden");
            loginContainer.classList.remove("hidden");
        } catch (err) {
            alert("❌ Error al conectar con el servidor");
            console.error(err);
        }
    });

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        try {
            const res = await fetch(`${API_BASE}/users/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            if (!res.ok) {
                alert("❌ Correo o contraseña incorrectos");
                return;
            }

            const data = await res.json();
            currentUser = data.user;

            if (data.token) {
                setAuthToken(data.token);
            }

            await sendLoginEmail(currentUser);
            
            alert(`✅ Bienvenido, ${currentUser.name}!`);
            authOverlay.classList.remove("show");
            loginForm.reset();
            checkUserSession();
        } catch (err) {
            alert("❌ Error al conectar con el servidor");
            console.error(err);
        }
    });

    logoutBtn.addEventListener("click", () => {
        cart = [];
        currentUser = null;
        removeAuthToken();
        alert("👋 Sesión cerrada exitosamente");
        checkUserSession();
    });

    userName.addEventListener("click", () => {
        if (currentUser) {
            profileName.value = currentUser.name;
            profileEmail.value = currentUser.email;
            profilePhone.value = currentUser.phone || "";
            profilePassword.value = "";
            profileConfirmPassword.value = "";
            profileOverlay.classList.add("show");
        }
    });

    profileClose.addEventListener("click", () => {
        profileOverlay.classList.remove("show");
    });

    profileOverlay.addEventListener("click", (e) => {
        if (e.target === profileOverlay) {
            profileOverlay.classList.remove("show");
        }
    });

    profileForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const newName = profileName.value.trim();
        const newPhone = profilePhone.value.trim();
        const newPassword = profilePassword.value;
        const confirmNewPassword = profileConfirmPassword.value;

        if (newPassword && newPassword !== confirmNewPassword) {
            alert("❌ Las contraseñas no coinciden");
            return;
        }

        try {
            const payload = { name: newName, phone: newPhone };
            if (newPassword) payload.password = newPassword;

            const res = await fetch(`${API_BASE}/users/profile`, {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                alert(`❌ ${err.error}`);
                return;
            }

            const data = await res.json();
            currentUser = data.user;

            alert("✅ Perfil actualizado exitosamente");
            profileOverlay.classList.remove("show");
            checkUserSession();
        } catch (err) {
            alert("❌ Error al conectar con el servidor");
            console.error(err);
        }
    });

    userName.style.cursor = "pointer";

    handleGoogleAuthCallback();
    checkUserSession();

    function updateCartCount() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
        if (totalItems > 0) {
            cartCount.textContent = totalItems;
            cartCount.classList.remove("hidden");
        } else {
            cartCount.classList.add("hidden");
        }
    }

    async function addToCart(product) {
        if (!currentUser) {
            alert("⚠️ Debes iniciar sesión para agregar productos al carrito");
            authOverlay.classList.add("show");
            loginContainer.classList.remove("hidden");
            registerContainer.classList.add("hidden");
            return;
        }

        const stockDisponible = product.stock !== undefined ? parseInt(product.stock) : 50;
        const existingItem = cart.find(item => item.title === product.title);
        const cantidadEnCarrito = existingItem ? existingItem.quantity : 0;

        if (stockDisponible <= 0) {
            alert(`❌ Lo sentimos, "${product.title}" está agotado.`);
            return;
        }

        if (cantidadEnCarrito >= stockDisponible) {
            alert(`⚠️ No puedes agregar más unidades de "${product.title}". Solo hay ${stockDisponible} en stock.`);
            return;
        }
    
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                title:      product.title,
                description: product.description,
                price:      product.price,
                image:      product.image,
                seller:     product.seller,
                quantity:   1,
                productId:  product.productId || product._id || null
            });
        }
    
        await saveCart();
        updateCartCount();
        alert(`✅ ${product.title} agregado al carrito`);
    }

    function renderCart() {
        cartItemsContainer.innerHTML = "";
    
        if (cart.length === 0) {
            emptyCartMessage.classList.remove("hidden");
            cartSummary.classList.add("hidden");
            return;
        }
    
        emptyCartMessage.classList.add("hidden");
        cartSummary.classList.remove("hidden");
    
        let subtotal = 0;
    
        cart.forEach((item, index) => {
            const priceNum = parseInt(item.price.replace(/[^0-9]/g, ''));
            const itemTotal = priceNum * item.quantity;
            subtotal += itemTotal;
        
            const cartItem = document.createElement("div");
            cartItem.className = "cart-item";
            const stockDisponible = item.stock !== undefined ? parseInt(item.stock) : null;
            const stockInfo = stockDisponible !== null
                ? `<p class="cart-item-stock" style="font-size:0.78rem; color:${stockDisponible <= 3 ? '#ff6400' : stockDisponible <= 5 ? '#cc8800' : stockDisponible <= 10 ? '#a07800' : '#888'}; margin:2px 0 0;">📦 Stock: ${stockDisponible} unidades</p>`
                : "";
            cartItem.innerHTML = `
                <img src="${item.image}" alt="${item.title}" class="cart-item-image">
                <div class="cart-item-details">
                    <h4>${item.title}</h4>
                    <p>${item.description}</p>
                    <p class="cart-item-price">${item.price} x ${item.quantity} = $${itemTotal.toLocaleString()} MXN</p>
                    ${stockInfo}
                </div>
                <div class="cart-item-actions">
                    <button onclick="updateQuantity(${index}, -1)" class="quantity-btn">-</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button onclick="updateQuantity(${index}, 1)" class="quantity-btn">+</button>
                    <button onclick="removeFromCart(${index})" class="remove-item-btn">🗑️</button>
                </div>
            `;
        
            cartItemsContainer.appendChild(cartItem);
        });
    
        const shipping = 150;
        let discountAmount = 0;

        if (appliedDiscount) {
            discountAmount = Math.round(subtotal * appliedDiscount.porcentaje / 100);
            const discountRow    = document.getElementById("discountRow");
            const discountLabel  = document.getElementById("discountRowLabel");
            const discountAmtEl  = document.getElementById("discountRowAmount");
            if (discountRow) {
                discountRow.classList.remove("hidden");
                discountLabel.textContent  = `Descuento (${appliedDiscount.porcentaje}%):`;
                discountAmtEl.textContent  = `-$${discountAmount.toLocaleString()} MXN`;
            }
        } else {
            const discountRow = document.getElementById("discountRow");
            if (discountRow) discountRow.classList.add("hidden");
        }

        const total = subtotal - discountAmount + shipping;

        cartSubtotal.textContent   = `$${subtotal.toLocaleString()} MXN`;
        cartGrandTotal.textContent = `$${total.toLocaleString()} MXN`;
    }

    window.updateQuantity = async function(index, change) {
        if (cart[index]) {
            const newQuantity = cart[index].quantity + change;

            if (change > 0) {
                const stockDisponible = cart[index].stock !== undefined ? parseInt(cart[index].stock) : 999;
                if (newQuantity > stockDisponible) {
                    alert(`⚠️ Solo hay ${stockDisponible} unidades disponibles de "${cart[index].title}".`);
                    return;
                }
            }

            cart[index].quantity = newQuantity;
        
            if (cart[index].quantity <= 0) {
                cart.splice(index, 1);
            }

            await saveCart();
            updateCartCount();
            renderCart();
        }
    };

    window.removeFromCart = async function(index) {
        if (confirm("¿Eliminar este producto del carrito?")) {
            cart.splice(index, 1);
            await saveCart();
            updateCartCount();
            renderCart();
        }
    };

    if (cartBtn) {
        cartBtn.addEventListener("click", async () => {
            cartOverlay.classList.add("show");
            try {
                const actualizados = await Promise.all(cart.map(async (item) => {
                    const pid = item.productId || item.productoId;
                    if (pid) {
                        const r = await fetch(`${API_BASE}/products/${pid}`);
                        if (r.ok) {
                            const p = await r.json();
                            return { ...item, stock: p.stock !== undefined ? p.stock : item.stock };
                        }
                    }
                    return item;
                }));
                cart = actualizados;
            } catch(e) { /* silencioso */ }
            renderCart();
        });
    }

    if (cartClose) {
        cartClose.addEventListener("click", () => {
            cartOverlay.classList.remove("show");
        });
    }

    cartOverlay.addEventListener("click", (e) => {
        if (e.target === cartOverlay) {
            cartOverlay.classList.remove("show");
        }
    });

    const applyDiscountBtn = document.getElementById("applyDiscountBtn");
    const cartDiscountInput = document.getElementById("cartDiscountInput");
    const discountMessage   = document.getElementById("discountMessage");

    if (applyDiscountBtn) {
        applyDiscountBtn.addEventListener("click", async () => {
            const codigo = (cartDiscountInput.value || "").trim().toUpperCase();

            if (!codigo) {
                showDiscountMessage("⚠️ Ingresa un código de descuento", "warning");
                return;
            }

            if (!currentUser) {
                showDiscountMessage("❌ Debes iniciar sesión para canjear un código", "error");
                return;
            }

            if (appliedDiscount && appliedDiscount.codigo === codigo) {
                showDiscountMessage("ℹ️ Este código ya está aplicado", "info");
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/discounts/validate`, {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ codigo })
                });

                const data = await res.json();

                if (!res.ok) {
                    showDiscountMessage(`❌ ${data.error}`, "error");
                    appliedDiscount = null;
                    renderCart();
                    return;
                }

                appliedDiscount = data;
                cartDiscountInput.value = data.codigo;
                showDiscountMessage(
                    `✅ Código aplicado: ${data.porcentaje}% de descuento — ${data.descripcion}`,
                    "success"
                );
                renderCart();

            } catch (err) {
                showDiscountMessage("❌ Error al validar el código", "error");
                console.error(err);
            }
        });
    }

    function showDiscountMessage(text, type) {
        if (!discountMessage) return;
        discountMessage.textContent = text;
        discountMessage.className = `discount-message discount-message--${type}`;
        discountMessage.classList.remove("hidden");
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", () => {
            if (cart.length === 0) {
                alert("⚠️ El carrito está vacío");
                return;
            }

            checkoutItems.innerHTML = "";
            let subtotal = 0;
        
            cart.forEach(item => {
                const priceNum = parseInt(item.price.replace(/[^0-9]/g, ''));
                const itemTotal = priceNum * item.quantity;
                subtotal += itemTotal;
            
                const itemElement = document.createElement("div");
                itemElement.className = "checkout-item";
                itemElement.innerHTML = `
                    <span>${item.title} x${item.quantity}</span>
                    <span>$${itemTotal.toLocaleString()} MXN</span>
                `;
                checkoutItems.appendChild(itemElement);
            });
        
            const shipping = 150;
            let discountAmount = 0;

            const checkoutDiscountRow  = document.getElementById("checkoutDiscountRow");
            const checkoutDiscountLabel = document.getElementById("checkoutDiscountLabel");
            const checkoutDiscountAmtEl = document.getElementById("checkoutDiscountAmount");

            if (appliedDiscount) {
                discountAmount = Math.round(subtotal * appliedDiscount.porcentaje / 100);
                if (checkoutDiscountRow) {
                    checkoutDiscountRow.classList.remove("hidden");
                    checkoutDiscountLabel.textContent = `Descuento (${appliedDiscount.porcentaje}%):`;
                    checkoutDiscountAmtEl.textContent = `-$${discountAmount.toLocaleString()} MXN`;
                }
            } else {
                if (checkoutDiscountRow) checkoutDiscountRow.classList.add("hidden");
            }

            const total = subtotal - discountAmount + shipping;
            checkoutTotal.textContent = `$${total.toLocaleString()} MXN`;
        
            if (currentUser) {
                document.getElementById("cardEmail").value = currentUser.email;
            }
        
            cartOverlay.classList.remove("show");
            checkoutOverlay.classList.add("show");
        });
    }

    if (checkoutClose) {
        checkoutClose.addEventListener("click", () => {
            checkoutOverlay.classList.remove("show");
        });
    }

    checkoutOverlay.addEventListener("click", (e) => {
        if (e.target === checkoutOverlay) {
            checkoutOverlay.classList.remove("show");
        }
    });

    const cardNumberInput = document.getElementById("cardNumber");
    if (cardNumberInput) {
        cardNumberInput.addEventListener("input", (e) => {
            let value = e.target.value.replace(/\s/g, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
        });
    }

    const cardExpiryInput = document.getElementById("cardExpiry");
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener("input", (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.slice(0, 2) + '/' + value.slice(2, 4);
            }
            e.target.value = value;
        });
    }

    function validateCardNumber(cardNumber) {
        const cleanNumber = cardNumber.replace(/\s/g, '');
    
        if (cleanNumber.length < 13 || cleanNumber.length > 19) {
            return false;
        }

        if (!/^\d+$/.test(cleanNumber)) {
            return false;
        }
    
        return true;
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    if (checkoutForm) {
        checkoutForm.addEventListener("submit", async (e) => {
            e.preventDefault();
        
            const cardNumber = document.getElementById("cardNumber").value;
            const cardEmail = document.getElementById("cardEmail").value;
            const cardName = document.getElementById("cardName").value;
            const cardExpiry = document.getElementById("cardExpiry").value;
            const cardCVV = document.getElementById("cardCVV").value;
            const shippingAddress = document.getElementById("shippingAddress").value;
            const shippingCity = document.getElementById("shippingCity").value;
            const shippingZip = document.getElementById("shippingZip").value;
        
            if (!validateCardNumber(cardNumber)) {
                alert("❌ Número de tarjeta inválido");
                return;
            }

            if (!validateEmail(cardEmail)) {
                alert("❌ Correo electrónico inválido");
                return;
            }
        
            if (cardCVV.length !== 3 || !/^\d{3}$/.test(cardCVV)) {
                alert("❌ CVV inválido (debe ser 3 dígitos)");
                return;
            }
        
            const expiryParts = cardExpiry.split('/');
            if (expiryParts.length !== 2) {
                alert("❌ Fecha de expiración inválida");
                return;
            }
        
            const month = parseInt(expiryParts[0]);
            const year = parseInt('20' + expiryParts[1]);
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth() + 1;
        
            if (month < 1 || month > 12 || year < currentYear || (year === currentYear && month < currentMonth)) {
                alert("❌ Fecha de expiración inválida o vencida");
                return;
            }
        
            let subtotal = 0;
            cart.forEach(item => {
                const priceNum = parseInt(item.price.replace(/[^0-9]/g, ''));
                subtotal += priceNum * item.quantity;
            });
            const shipping = 150;
            let discountAmount = 0;
            if (appliedDiscount) {
                discountAmount = Math.round(subtotal * appliedDiscount.porcentaje / 100);
            }
            const total = subtotal - discountAmount + shipping;
        
            const orderNumber = 'ORD-' + Date.now();
        
            let orderDate = "";
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                
                const response = await fetch(
                    'https://timeapi.bio/timeapi/time/components',
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            region: 'Europe/Madrid',
                            fields: 'year,month,day,hour,minute,second'
                        }),
                        signal: controller.signal
                    }
                );
                
                clearTimeout(timeoutId);
                const data = await response.json();
                
                orderDate = `${data.day}/${data.month}/${data.year} ${String(data.hour).padStart(2, '0')}:${String(data.minute).padStart(2, '0')}`;
            
            } catch (error) {
                console.warn("⚠️ API timeout o error, usando hora local:", error.message);
                
                const now = new Date();
                orderDate = now.toLocaleString('es-ES', {
                    timeZone: 'Europe/Madrid',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
            }
        
            const order = {
                orderNumber: orderNumber,
                date: orderDate,
                total: total,
                subtotalOriginal: subtotal,
                discountCode:    appliedDiscount ? appliedDiscount.codigo    : "",
                discountPercent: appliedDiscount ? appliedDiscount.porcentaje : 0,
                discountAmount:  appliedDiscount ? discountAmount            : 0,
                discountType:    appliedDiscount ? appliedDiscount.tipo      : "",
                email: cardEmail,
                items: [...cart],
                customer: {
                    name: cardName,
                    email: cardEmail,
                    address: shippingAddress,
                    city: shippingCity,
                    zip: shippingZip
                }
            };
        
            try {
                await fetch(`${API_BASE}/orders`, {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify(order)
                });
            } catch (err) {
                console.warn("⚠️ No se pudo guardar la orden:", err.message);
            }

            lastOrder = order;

            await createPurchaseNotification(order);
        
            cart = [];
            await saveCart();
            updateCartCount();
        
            document.getElementById("orderNumber").textContent = orderNumber;
            document.getElementById("orderDate").textContent = orderDate;
            document.getElementById("orderTotal").textContent = `$${total.toLocaleString()} MXN`;
            document.getElementById("orderEmail").textContent = cardEmail;

            const confirmDiscountEl = document.getElementById("confirmDiscountInfo");
            if (confirmDiscountEl) {
                if (appliedDiscount && discountAmount > 0) {
                    confirmDiscountEl.textContent =
                        `🏷️ Descuento aplicado (${appliedDiscount.codigo}): -$${discountAmount.toLocaleString()} MXN (${appliedDiscount.porcentaje}%)`;
                    confirmDiscountEl.classList.remove("hidden");
                } else {
                    confirmDiscountEl.classList.add("hidden");
                }
            }

            appliedDiscount = null;
            if (cartDiscountInput)  cartDiscountInput.value = "";
            if (discountMessage)    discountMessage.classList.add("hidden");
            const discountRow = document.getElementById("discountRow");
            if (discountRow) discountRow.classList.add("hidden");
        
            checkoutOverlay.classList.remove("show");
            confirmationOverlay.classList.add("show");

            checkoutForm.reset();

            try { await syncProductsToDOM(); } catch(e) { /* silencioso */ }

            try {
                const cartItems = document.querySelectorAll(".cart-item-stock");
                cartItems.forEach(el => el.remove());
            } catch(e) { /* silencioso */ }
        });
    }

    if (confirmationClose) {
        confirmationClose.addEventListener("click", () => {
            confirmationOverlay.classList.remove("show");
        });
    }

    if (closeConfirmationBtn) {
        closeConfirmationBtn.addEventListener("click", () => {
            confirmationOverlay.classList.remove("show");
        });
    }

    confirmationOverlay.addEventListener("click", (e) => {
        if (e.target === confirmationOverlay) {
            confirmationOverlay.classList.remove("show");
        }
    });

    if (downloadInvoiceBtn) {
        downloadInvoiceBtn.addEventListener("click", async () => {
            if (!lastOrder && currentUser) {
                try {
                    const res = await fetch(`${API_BASE}/orders/last`, { headers: getAuthHeaders() });
                    if (res.ok) {
                        lastOrder = await res.json();
                    }
                } catch (err) {
                    console.warn("⚠️ No se pudo obtener la última orden:", err.message);
                }
            }
        
            if (!lastOrder) {
                alert("❌ No se encontró información de la orden");
                return;
            }
        
            let invoiceContent = `
    ═══════════════════════════════════════════════════════════
    🕳️ LA CUEVA DEL MULTIVERSO
    FACTURA DE COMPRA - TICKET DE VENTA
    ═══════════════════════════════════════════════════════════

    Número de Orden: ${lastOrder.orderNumber}
    Fecha: ${lastOrder.date}

    ─────────────────────────────────────────────────────────────
    DATOS DEL CLIENTE
    ─────────────────────────────────────────────────────────────
    Nombre: ${lastOrder.customer.name}
    Email: ${lastOrder.customer.email}
    Dirección: ${lastOrder.customer.address}
    Ciudad: ${lastOrder.customer.city}
    C.P.: ${lastOrder.customer.zip}

    ─────────────────────────────────────────────────────────────
    PRODUCTOS ADQUIRIDOS
    ─────────────────────────────────────────────────────────────
    `;

            lastOrder.items.forEach((item, index) => {
                const priceNum = parseInt(item.price.replace(/[^0-9]/g, ''));
                const itemTotal = priceNum * item.quantity;
            
                invoiceContent += `
    ${index + 1}. ${item.title}
    Cantidad: ${item.quantity}
    Precio unitario: ${item.price}
    Subtotal: $${itemTotal.toLocaleString()} MXN
    Vendedor: ${item.seller}
    `;
            });

            const subtotal = lastOrder.subtotalOriginal || (lastOrder.total - 150);
            const discountAmountInv = lastOrder.discountAmount || 0;
            const discountSection = lastOrder.discountCode ? `
    ─────────────────────────────────────────────────────────────
    DESCUENTO APLICADO
    ─────────────────────────────────────────────────────────────
    Código:                             ${lastOrder.discountCode}
    Porcentaje:                         ${lastOrder.discountPercent}%
    Ahorro:                             -$${discountAmountInv.toLocaleString()} MXN
    ` : "";

            invoiceContent += `
    ─────────────────────────────────────────────────────────────
    RESUMEN DE PAGO
    ─────────────────────────────────────────────────────────────
    Subtotal:                           $${subtotal.toLocaleString()} MXN${discountSection}
    Envío:                              $150 MXN
    ─────────────────────────────────────────────────────────────
    TOTAL PAGADO:                       $${lastOrder.total.toLocaleString()} MXN
    ─────────────────────────────────────────────────────────────

    Método de pago: Tarjeta de Crédito/Débito
    Estado del pago: APROBADO ✅

    ═══════════════════════════════════════════════════════════
            ¡Gracias por tu compra!
        Tu pedido será enviado en 3-5 días hábiles
    ═══════════════════════════════════════════════════════════

    📧 Contacto: info@cuevadelmultiverso.com
    📱 WhatsApp: +52 1 562 972 7628
    🌐 www.cuevadelmultiverso.com

    ═══════════════════════════════════════════════════════════
            `;

            const blob = new Blob([invoiceContent], { type: 'text/plain;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Factura_${lastOrder.orderNumber}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        
            alert("✅ Factura descargada exitosamente");
        });
    }

    async function createPurchaseNotification(order) {
        const notification = {
            type: 'purchase',
            orderNumber:     order.orderNumber,
            customerName:    order.customer.name,
            customerEmail:   order.customer.email,
            total:           order.total,
            discountCode:    order.discountCode    || "",
            discountPercent: order.discountPercent || 0,
            discountAmount:  order.discountAmount  || 0,
            discountType:    order.discountType    || "",
            items:           order.items,
            date:            order.date,
            read:            false,
            timestamp:       Date.now()
        };
    
        try {
            const res = await fetch(`${API_BASE}/notifications`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(notification)
            });
            if (res.ok) {
                const created = await res.json();
                notifications.unshift(created);
                updateNotificationCount();
            }
        } catch (err) {
            console.warn("⚠️ No se pudo crear la notificación:", err.message);
        }
    }

    function updateNotificationCount() {
        const unreadCount = notifications.filter(n => !n.read).length;
    
        if (unreadCount > 0) {
            notificationCount.textContent = unreadCount;
            notificationCount.classList.remove("hidden");
        } else {
            notificationCount.classList.add("hidden");
        }
    }

    function renderNotifications() {
        notificationsContainer.innerHTML = "";
    
        if (notifications.length === 0) {
            emptyNotifications.classList.remove("hidden");
            return;
        }
    
        emptyNotifications.classList.add("hidden");
    
        notifications.forEach((notification, index) => {
            const notifElement = document.createElement("div");
            notifElement.className = `notification-item ${notification.read ? 'read' : 'unread'}`;

            const isLowStock = notification.type === "low_stock";

            if (isLowStock) {
                const stockActual = notification.total;
                const nivelAlerta = parseInt(notification.discountCode) || 10;
                const productoNombre = notification.customerName || "Producto";

                let alertIcon = "⚠️";
                let alertColor = "#facc15";
                let alertTitle = "Stock bajo";
                let alertMsg = "";

                if (nivelAlerta === 1 || stockActual === 1) {
                    alertIcon = "🚨";
                    alertColor = "#ff2d2d";
                    alertTitle = "¡ÚLTIMA UNIDAD!";
                    alertMsg = `Solo queda <strong>1 unidad</strong> de <strong>${productoNombre}</strong>. ¡Repone de inmediato!`;
                } else if (nivelAlerta <= 3 || stockActual <= 3) {
                    alertIcon = "🔴";
                    alertColor = "#f97316";
                    alertTitle = "Stock Crítico";
                    alertMsg = `Solo quedan <strong>${stockActual} unidades</strong> de <strong>${productoNombre}</strong>. Nivel crítico.`;
                } else if (nivelAlerta <= 5 || stockActual <= 5) {
                    alertIcon = "🟠";
                    alertColor = "#eab308";
                    alertTitle = "Stock Muy Bajo";
                    alertMsg = `Quedan <strong>${stockActual} unidades</strong> de <strong>${productoNombre}</strong>. Se recomienda reponer.`;
                } else {
                    alertIcon = "🟡";
                    alertColor = "#facc15";
                    alertTitle = "Stock Bajo";
                    alertMsg = `Quedan <strong>${stockActual} unidades</strong> de <strong>${productoNombre}</strong>. Considera reponer pronto.`;
                }

                notifElement.innerHTML = `
                    <div class="notification-header">
                        <span class="notification-icon">${alertIcon}</span>
                        <div class="notification-info">
                            <h4 style="color:${alertColor};">${alertTitle}: ${productoNombre}</h4>
                            <p class="notification-time">${formatNotificationTime(notification.timestamp)}</p>
                        </div>
                        ${!notification.read ? '<span class="unread-badge">•</span>' : ''}
                    </div>
                    <div class="notification-body">
                        <p>${alertMsg}</p>
                        <p><strong>Fecha:</strong> ${notification.date}</p>
                        <p style="font-size:0.82rem; color:#888;">Ve al panel de productos para reponer el stock de este artículo.</p>
                    </div>
                    <div class="notification-actions">
                        ${!notification.read ? `<button onclick="markAsRead(${index})" class="mark-read-single">✓ Marcar como leída</button>` : ''}
                        <button onclick="deleteNotification(${index})" class="delete-notification">🗑️ Eliminar</button>
                    </div>
                `;
            } else {
                const itemsList = notification.items.map(item => 
                    `<li>${item.title} x${item.quantity} - ${item.price}</li>`
                ).join('');

                notifElement.innerHTML = `
                    <div class="notification-header">
                        <span class="notification-icon">🛒</span>
                        <div class="notification-info">
                            <h4>Nueva Compra Realizada</h4>
                            <p class="notification-time">${formatNotificationTime(notification.timestamp)}</p>
                        </div>
                        ${!notification.read ? '<span class="unread-badge">•</span>' : ''}
                    </div>
                    <div class="notification-body">
                        <p><strong>Cliente:</strong> ${notification.customerName}</p>
                        <p><strong>Email:</strong> ${notification.customerEmail}</p>
                        <p><strong>Número de Orden:</strong> ${notification.orderNumber}</p>
                        <p><strong>Fecha:</strong> ${notification.date}</p>
                        ${notification.discountCode ? `
                        <p style="color:var(--apple-green);"><strong>🏷️ Descuento aplicado:</strong>
                            ${notification.discountCode} — ${notification.discountPercent}%
                            (-$${(notification.discountAmount || 0).toLocaleString()} MXN)
                        </p>` : ''}
                        <p><strong>Total:</strong> $${notification.total.toLocaleString()} MXN</p>
                        <details>
                            <summary>Ver productos (${notification.items.length})</summary>
                            <ul class="notification-items-list">
                                ${itemsList}
                            </ul>
                        </details>
                    </div>
                    <div class="notification-actions">
                        ${!notification.read ? `<button onclick="markAsRead(${index})" class="mark-read-single">✓ Marcar como leída</button>` : ''}
                        <button onclick="deleteNotification(${index})" class="delete-notification">🗑️ Eliminar</button>
                    </div>
                `;
            }
        
            notificationsContainer.appendChild(notifElement);
        });
    }

    function formatNotificationTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
    
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
    
        if (minutes < 1) return 'Justo ahora';
        if (minutes < 60) return `Hace ${minutes} min`;
        if (hours < 24) return `Hace ${hours} h`;
        return `Hace ${days} d`;
    }

    window.markAsRead = async function(index) {
        const notif = notifications[index];
        if (!notif) return;

        try {
            await fetch(`${API_BASE}/notifications/${notif._id}`, {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify({ read: true })
            });
        } catch (err) {
            console.warn("⚠️ Error al marcar notificación:", err.message);
        }

        notifications[index].read = true;
        updateNotificationCount();
        renderNotifications();
    };

    if (markAllReadBtn) {
        markAllReadBtn.addEventListener("click", async () => {
            try {
                await fetch(`${API_BASE}/notifications/markAllRead`, {
                    method: "PUT",
                    headers: getAuthHeaders()
                });
            } catch (err) {
                console.warn("⚠️ Error al marcar todas como leídas:", err.message);
            }

            notifications.forEach(n => n.read = true);
            updateNotificationCount();
            renderNotifications();
        });
    }

    window.deleteNotification = async function(index) {
        if (confirm("¿Eliminar esta notificación?")) {
            const notif = notifications[index];
            try {
                await fetch(`${API_BASE}/notifications/${notif._id}`, {
                    method: "DELETE",
                    headers: getAuthHeaders()
                });
            } catch (err) {
                console.warn("⚠️ Error al eliminar notificación:", err.message);
            }

            notifications.splice(index, 1);
            updateNotificationCount();
            renderNotifications();
        }
    };

    if (clearNotificationsBtn) {
        clearNotificationsBtn.addEventListener("click", async () => {
            if (confirm("¿Eliminar todas las notificaciones?")) {
                try {
                    await fetch(`${API_BASE}/notifications`, { 
                        method: "DELETE",
                        headers: getAuthHeaders()
                    });
                } catch (err) {
                    console.warn("⚠️ Error al eliminar notificaciones:", err.message);
                }

                notifications = [];
                updateNotificationCount();
                renderNotifications();
            }
        });
    }

    if (notificationBtn) {
        notificationBtn.addEventListener("click", async () => {
            await loadNotifications();
            notificationOverlay.classList.add("show");
            renderNotifications();
        });
    }

    if (notificationClose) {
        notificationClose.addEventListener("click", () => {
            notificationOverlay.classList.remove("show");
        });
    }

    notificationOverlay.addEventListener("click", (e) => {
        if (e.target === notificationOverlay) {
            notificationOverlay.classList.remove("show");
        }
    });

    if (adminPanelBtn) {
        adminPanelBtn.addEventListener("click", async () => {
            if (currentUser && currentUser.type === "admin") {
                adminOverlay.classList.add("show");
                await renderAdminUsers();
                await renderAdminProducts();
                await updateAdminStats();
            }
        });
    }

    if (adminClose) {
        adminClose.addEventListener("click", () => {
            adminOverlay.classList.remove("show");
        });
    }

    adminOverlay.addEventListener("click", (e) => {
        if (e.target === adminOverlay) {
            adminOverlay.classList.remove("show");
        }
    });

    adminTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const targetTab = tab.dataset.tab;
        
            adminTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
        
            adminTabContents.forEach(content => {
                content.classList.remove("active");
            });
        
            document.getElementById(`${targetTab}Tab`).classList.add("active");

            if (targetTab === "discounts") {
                loadDiscounts();
            }
        });
    });

    async function renderAdminUsers() {
        usersTableBody.innerHTML = "";
    
        let allUsers = [];
        try {
            const res = await fetch(`${API_BASE}/users`, {
                headers: getAuthHeaders()
            });
            if (res.ok) allUsers = await res.json();
        } catch (err) {
            console.warn("⚠️ No se pudieron cargar usuarios:", err.message);
        }
    
        allUsers.forEach((user) => {
            const row = document.createElement("tr");
        
            const userTypeText = user.type === "admin" ? "👑 Admin" : "👤 Usuario";
            const userTypeClass = user.type === "admin" ? "admin-badge" : "user-badge";
        
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.phone || "N/A"}</td>
                <td>${user.password}</td>
                <td><span class="${userTypeClass}">${userTypeText}</span></td>
                <td>${user.registrationDate || "N/A"}</td>
                <td>${user.registrationTime || "N/A"}</td>
                <td class="action-buttons">
                    <button class="edit-btn" onclick="editUser('${user.email}')">✏️</button>
                    <button class="delete-btn" onclick="deleteUser('${user.email}')">🗑️</button>
                </td>
            `;
        
            usersTableBody.appendChild(row);
        });
    
        updateUserStats(allUsers);
    }

    function updateUserStats(allUsers) {
        const admins = allUsers.filter(u => u.type === "admin");
        totalUsersEl.textContent = allUsers.length;
        totalAdminsEl.textContent = admins.length;
    }

    if (searchUsers) {
        searchUsers.addEventListener("input", (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const rows = usersTableBody.querySelectorAll("tr");
        
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? "" : "none";
            });
        });
    }

    window.editUser = async function(email) {
        let allUsers = [];
        try {
            const res = await fetch(`${API_BASE}/users`, {
                headers: getAuthHeaders()
            });
            if (res.ok) allUsers = await res.json();
        } catch (err) {
            console.warn("⚠️ Error al cargar usuarios:", err.message);
        }

        const user = allUsers.find(u => u.email === email);
        if (!user) return;
    
        document.getElementById("editUserEmail").value = email;
        document.getElementById("editUserName").value = user.name;
        document.getElementById("editUserNewEmail").value = user.email;
        document.getElementById("editUserPhone").value = user.phone || "";
        document.getElementById("editUserPassword").value = "";
        document.getElementById("editUserType").value = user.type || "user";
    
        editUserOverlay.classList.add("show");
    };

    if (editUserClose) {
        editUserClose.addEventListener("click", () => {
            editUserOverlay.classList.remove("show");
        });
    }

    editUserOverlay.addEventListener("click", (e) => {
        if (e.target === editUserOverlay) {
            editUserOverlay.classList.remove("show");
        }
    });

    if (editUserForm) {
        editUserForm.addEventListener("submit", async (e) => {
            e.preventDefault();
        
            const oldEmail = document.getElementById("editUserEmail").value;
            const newName = document.getElementById("editUserName").value.trim();
            const newEmail = document.getElementById("editUserNewEmail").value.trim();
            const newPhone = document.getElementById("editUserPhone").value.trim();
            const newPassword = document.getElementById("editUserPassword").value;
            const newType = document.getElementById("editUserType").value;
        
            const payload = { name: newName, email: newEmail, phone: newPhone, type: newType };
            if (newPassword) payload.password = newPassword;

            try {
                const res = await fetch(`${API_BASE}/users/${oldEmail}`, {
                    method: "PUT",
                    headers: getAuthHeaders(),
                    body: JSON.stringify(payload)
                });

                if (!res.ok) {
                    const err = await res.json();
                    alert(`❌ ${err.error}`);
                    return;
                }

                if (currentUser && currentUser.email === oldEmail) {
                    const data = await res.json();
                    currentUser = data.user;
                    checkUserSession();
                }
            
                alert("✅ Usuario actualizado exitosamente");
                editUserOverlay.classList.remove("show");
                await renderAdminUsers();
            } catch (err) {
                alert("❌ Error al conectar con el servidor");
                console.error(err);
            }
        });
    }

    window.deleteUser = async function(email) {
        if (currentUser && currentUser.email === email) {
            alert("❌ No puedes eliminar tu propia cuenta mientras estás conectado");
            return;
        }
    
        if (!confirm(`¿Estás seguro de eliminar al usuario con email: ${email}?`)) {
            return;
        }
    
        try {
            const res = await fetch(`${API_BASE}/users/${email}`, { 
                method: "DELETE",
                headers: getAuthHeaders()
            });
            if (!res.ok) {
                alert("❌ No se pudo eliminar el usuario");
                return;
            }
            alert("✅ Usuario eliminado exitosamente");
            await renderAdminUsers();
        } catch (err) {
            alert("❌ Error al conectar con el servidor");
            console.error(err);
        }
    };

    async function renderAdminProducts() {
        productsTableBody.innerHTML = "";
    
        let products = [];
        try {
            const res = await fetch(`${API_BASE}/products`);
            if (res.ok) products = await res.json();
        } catch (err) {
            console.warn("⚠️ No se pudieron cargar productos:", err.message);
        }
    
        products.forEach((product) => {
            const row = document.createElement("tr");
        
            const categoryEmoji = {
                peliculas: "🎬",
                series: "📺",
                anime: "🍥",
                videojuegos: "🎮"
            };

            const stockActual = product.stock !== undefined ? product.stock : 50;
            let stockColor = "#22c55e";
            if (stockActual === 0) stockColor = "#ef4444";
            else if (stockActual <= 3) stockColor = "#f97316";
            else if (stockActual <= 5) stockColor = "#eab308";
            else if (stockActual <= 10) stockColor = "#facc15";
        
            row.innerHTML = `
                <td><img src="${product.image}" alt="${product.title}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;"></td>
                <td>${product.title}</td>
                <td>${categoryEmoji[product.category] || ""} ${product.category}</td>
                <td>${product.price}</td>
                <td>${product.seller}</td>
                <td style="font-weight:700; color:${stockColor};">${stockActual}</td>
                <td style="white-space:nowrap;">
                    <input type="number" min="1" max="999" placeholder="Cant." data-product-id="${product._id}" class="restock-input" style="width:60px; padding:4px 6px; border-radius:6px; border:1px solid #444; background:#1a1a2e; color:#fff; font-size:0.8rem; margin-right:4px;">
                    <button class="restock-btn" data-product-id="${product._id}" style="padding:4px 10px; background:#0071e3; color:#fff; border:none; border-radius:6px; font-size:0.8rem; cursor:pointer;">➕ Reponer</button>
                </td>
                <td class="action-buttons">
                    <button class="edit-btn" onclick="editProduct('${product._id}')">✏️</button>
                    <button class="delete-btn" onclick="deleteProduct('${product._id}')">🗑️</button>
                </td>
            `;
        
            productsTableBody.appendChild(row);
        });

        productsTableBody.querySelectorAll(".restock-btn").forEach(btn => {
            btn.addEventListener("click", async () => {
                const productId = btn.dataset.productId;
                const input = productsTableBody.querySelector(`.restock-input[data-product-id="${productId}"]`);
                const cantidad = parseInt(input ? input.value : 0);
                if (!cantidad || cantidad <= 0) {
                    alert("⚠️ Ingresa una cantidad válida para reponer.");
                    return;
                }
                try {
                    const res = await fetch(`${API_BASE}/products/${productId}/stock`, {
                        method: "PATCH",
                        headers: getAuthHeaders(),
                        body: JSON.stringify({ cantidad })
                    });
                    if (res.ok) {
                        const updated = await res.json();
                        alert(`✅ Stock de "${updated.title}" actualizado a ${updated.stock} unidades.`);
                        if (input) input.value = "";
                        await renderAdminProducts();
                        await syncProductsToDOM();
                    } else {
                        const err = await res.json();
                        alert("❌ Error al reponer: " + (err.error || "Error desconocido"));
                    }
                } catch (err) {
                    alert("❌ Error de conexión al reponer stock.");
                }
            });
        });
    }

    if (searchProducts) {
        searchProducts.addEventListener("input", (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const rows = productsTableBody.querySelectorAll("tr");
        
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? "" : "none";
            });
        });
    }

    if (addProductBtn) {
        addProductBtn.addEventListener("click", () => {
            document.getElementById("productFormTitle").textContent = "➕ Añadir Producto";
            document.getElementById("productFormSubmit").textContent = "Guardar Producto";
            document.getElementById("productEditId").value = "";
            productForm.reset();
            productFormOverlay.classList.add("show");
        });
    }

    if (productFormClose) {
        productFormClose.addEventListener("click", () => {
            productFormOverlay.classList.remove("show");
        });
    }

    productFormOverlay.addEventListener("click", (e) => {
        if (e.target === productFormOverlay) {
            productFormOverlay.classList.remove("show");
        }
    });

    if (productForm) {
        productForm.addEventListener("submit", async (e) => {
            e.preventDefault();
        
            const editId = document.getElementById("productEditId").value;
            const title = document.getElementById("productTitle").value.trim();
            const description = document.getElementById("productDescription").value.trim();
            const fullDescription = document.getElementById("productFullDescription").value.trim();
            const franchiseInput = document.getElementById("productFranchise");
            const franchise = franchiseInput ? franchiseInput.value.trim().toLowerCase() : "";
            const category = document.getElementById("productCategory").value;
            const price = document.getElementById("productPrice").value;
            const seller = document.getElementById("productSeller").value.trim();
            const image = document.getElementById("productImage").value.trim();
        
            const productData = {
                title, description, fullDescription, franchise, category,
                price: `$${price} MXN`,
                seller, image
            };
        
            try {
                if (editId) {
                    await fetch(`${API_BASE}/products/${editId}`, {
                        method: "PUT",
                        headers: getAuthHeaders(),
                        body: JSON.stringify(productData)
                    });
                    alert("✅ Producto actualizado exitosamente");
                } else {
                    await fetch(`${API_BASE}/products`, {
                        method: "POST",
                        headers: getAuthHeaders(),
                        body: JSON.stringify(productData)
                    });
                    alert("✅ Producto añadido exitosamente");
                }
            
                productFormOverlay.classList.remove("show");
                await renderAdminProducts();
                await syncProductsToDOM();
                await updateAdminStats();
            } catch (err) {
                alert("❌ Error al conectar con el servidor");
                console.error(err);
            }
        });
    }

    window.editProduct = async function(id) {
        let products = [];
        try {
            const res = await fetch(`${API_BASE}/products`);
            if (res.ok) products = await res.json();
        } catch (err) {
            console.warn("⚠️ Error al cargar productos:", err.message);
        }

        const product = products.find(p => p._id === id);
        if (!product) return;
    
        document.getElementById("productFormTitle").textContent = "✏️ Editar Producto";
        document.getElementById("productFormSubmit").textContent = "Actualizar Producto";
        document.getElementById("productEditId").value = product._id;
        document.getElementById("productTitle").value = product.title;
        document.getElementById("productDescription").value = product.description;
        document.getElementById("productFullDescription").value = product.fullDescription || product.description;
        const franchiseEl = document.getElementById("productFranchise");
        if (franchiseEl) franchiseEl.value = product.franchise || "";
        document.getElementById("productCategory").value = product.category;
        document.getElementById("productPrice").value = product.price.replace(/[^0-9]/g, '');
        document.getElementById("productSeller").value = product.seller;
        document.getElementById("productImage").value = product.image;
    
        productFormOverlay.classList.add("show");
    };

    window.deleteProduct = async function(id) {
        if (!confirm("¿Estás seguro de eliminar este producto?")) {
            return;
        }
    
        try {
            await fetch(`${API_BASE}/products/${id}`, { 
                method: "DELETE",
                headers: getAuthHeaders()
            });
            alert("✅ Producto eliminado exitosamente");
            await renderAdminProducts();
            await syncProductsToDOM();
            await updateAdminStats();
        } catch (err) {
            alert("❌ Error al conectar con el servidor");
            console.error(err);
        }
    };

    async function syncProductsToDOM() {
        let products = [];
        try {
            const res = await fetch(`${API_BASE}/products`);
            if (res.ok) products = await res.json();
        } catch (err) {
            console.warn("⚠️ No se pudieron sincronizar productos:", err.message);
        }
    
        allCards.length = 0;
    
        products.forEach(product => {
            const card = document.createElement("div");
            card.className = "mission-card";
            card.dataset.category = product.category;
            card.dataset.title = product.title;
            card.dataset.description = product.fullDescription || product.description;
            card.dataset.price = product.price;
            card.dataset.seller = product.seller;
            card.dataset.image = product.image;
            card.dataset.stock = product.stock !== undefined ? product.stock : 50;
            card.dataset.productId = product._id;
            card.dataset.franchise = product.franchise || inferFranchise(product.title, product.fullDescription || product.description, product.image);
        
            card.innerHTML = `
                <img src="${product.image}" alt="${product.title}">
                <h3>${product.title}</h3>
                <p>${product.description}</p>
                <span>${product.price}</span>
            `;
        
            allCards.push(card);
        });
    
        countProductsByCategory();
        renderProducts();
        renderFeatured();
    }

    async function updateAdminStats() {
        let products = [];
        try {
            const res = await fetch(`${API_BASE}/products`);
            if (res.ok) products = await res.json();
        } catch (err) {
            console.warn("⚠️ Error al cargar productos para stats:", err.message);
        }

        totalProductsEl.textContent = products.length;
    
        const categoryCounts = {
            peliculas: 0,
            series: 0,
            anime: 0,
            videojuegos: 0
        };
    
        products.forEach(p => {
            if (categoryCounts[p.category] !== undefined) {
                categoryCounts[p.category]++;
            }
        });
    
        const categoryEmoji = {
            peliculas: "🎬",
            series: "📺",
            anime: "🍥",
            videojuegos: "🎮"
        };
    
        categoryStatsEl.innerHTML = "";
        Object.keys(categoryCounts).forEach(cat => {
            const li = document.createElement("li");
            li.textContent = `${categoryEmoji[cat]} ${cat.charAt(0).toUpperCase() + cat.slice(1)}: ${categoryCounts[cat]}`;
            categoryStatsEl.appendChild(li);
        });
    
        let contacts = [];
        try {
            const res = await fetch(`${API_BASE}/contacts`);
            if (res.ok) contacts = await res.json();
        } catch (err) {
            console.warn("⚠️ Error al cargar contactos para stats:", err.message);
        }
        totalContactsEl.textContent = contacts.length;
    
        let history = {};
        try {
            const res = await fetch(`${API_BASE}/lastviewed`);
            if (res.ok) history = await res.json();
        } catch (err) {
            console.warn("⚠️ Error al cargar historial para stats:", err.message);
        }
        let totalViews = 0;
        Object.keys(history).forEach(cat => {
            if (Array.isArray(history[cat])) {
                totalViews += history[cat].length;
            }
        });
        totalViewsEl.textContent = totalViews;
    }

    let allDiscounts = [];

    async function loadDiscounts() {
        try {
            const res = await fetch(`${API_BASE}/discounts`, { headers: getAuthHeaders() });
            if (res.ok) {
                allDiscounts = await res.json();
                renderDiscountsTable(allDiscounts);
                const activeCount = allDiscounts.filter(d => d.activo).length;
                const el = document.getElementById("totalDiscountCodes");
                if (el) el.textContent = activeCount;
            }
        } catch (err) {
            console.warn("⚠️ Error al cargar descuentos:", err.message);
        }
    }

    function renderDiscountsTable(discounts) {
        const tbody = document.getElementById("discountsTableBody");
        if (!tbody) return;
        tbody.innerHTML = "";

        if (discounts.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--apple-text-gray);">No hay códigos de descuento registrados</td></tr>`;
            return;
        }

        discounts.forEach(d => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong style="font-family:monospace;letter-spacing:1px;">${d.codigo}</strong></td>
                <td><span style="color:var(--apple-green);font-weight:600;">${d.porcentaje}%</span></td>
                <td>${d.descripcion || "—"}</td>
                <td>${d.usosActuales}</td>
                <td>${d.usoMaximo > 0 ? d.usoMaximo : "∞"}</td>
                <td>${d.fechaExpira || "Sin vencimiento"}</td>
                <td>
                    <span class="discount-status ${d.activo ? 'discount-status--active' : 'discount-status--inactive'}">
                        ${d.activo ? "✅ Activo" : "❌ Inactivo"}
                    </span>
                </td>
                <td>
                    <button onclick="editDiscount('${d._id}')" class="edit-btn">✏️</button>
                    <button onclick="deleteDiscount('${d._id}')" class="delete-btn">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    const searchDiscountsInput = document.getElementById("searchDiscounts");
    if (searchDiscountsInput) {
        searchDiscountsInput.addEventListener("input", () => {
            const q = searchDiscountsInput.value.toLowerCase();
            const filtered = allDiscounts.filter(d =>
                d.codigo.toLowerCase().includes(q) ||
                (d.descripcion || "").toLowerCase().includes(q)
            );
            renderDiscountsTable(filtered);
        });
    }

    const discountFormOverlay = document.getElementById("discountFormOverlay");
    const discountFormClose   = document.getElementById("discountFormClose");
    const discountForm        = document.getElementById("discountForm");
    const addDiscountBtn      = document.getElementById("addDiscountBtn");

    if (addDiscountBtn) {
        addDiscountBtn.addEventListener("click", () => {
            document.getElementById("discountFormTitle").textContent = "➕ Crear Código de Descuento";
            document.getElementById("discountEditId").value = "";
            document.getElementById("discountCodigo").disabled = false;
            discountForm.reset();
            document.getElementById("discountActivo").value = "true";
            discountFormOverlay.classList.add("show");
        });
    }

    if (discountFormClose) {
        discountFormClose.addEventListener("click", () => {
            document.getElementById("discountCodigo").disabled = false;
            discountFormOverlay.classList.remove("show");
        });
    }

    if (discountFormOverlay) {
        discountFormOverlay.addEventListener("click", e => {
            if (e.target === discountFormOverlay) {
                document.getElementById("discountCodigo").disabled = false;
                discountFormOverlay.classList.remove("show");
            }
        });
    }

    if (discountForm) {
        discountForm.addEventListener("submit", async e => {
            e.preventDefault();
            const id          = document.getElementById("discountEditId").value;
            const codigo      = document.getElementById("discountCodigo").value.trim().toUpperCase();
            const porcentaje  = document.getElementById("discountPorcentaje").value;
            const descripcion = document.getElementById("discountDescripcion").value.trim();
            const usoMaximo   = document.getElementById("discountUsoMaximo").value || 0;
            const fechaExpira = document.getElementById("discountFechaExpira").value;
            const activo      = document.getElementById("discountActivo").value === "true";

            try {
                let res;
                if (id) {
                    res = await fetch(`${API_BASE}/discounts/${id}`, {
                        method: "PUT",
                        headers: getAuthHeaders(),
                        body: JSON.stringify({ porcentaje, descripcion, usoMaximo, fechaExpira, activo })
                    });
                } else {
                    res = await fetch(`${API_BASE}/discounts`, {
                        method: "POST",
                        headers: getAuthHeaders(),
                        body: JSON.stringify({ codigo, porcentaje, descripcion, usoMaximo, fechaExpira })
                    });
                }

                const data = await res.json();
                if (!res.ok) {
                    alert(`❌ ${data.error}`);
                    return;
                }

                alert(`✅ Código ${id ? "actualizado" : "creado"} exitosamente`);
                discountFormOverlay.classList.remove("show");
                discountForm.reset();
                await loadDiscounts();
            } catch (err) {
                alert("❌ Error al guardar el código");
                console.error(err);
            }
        });
    }

    window.editDiscount = async function(id) {
        const d = allDiscounts.find(x => x._id === id);
        if (!d) return;
        document.getElementById("discountFormTitle").textContent = "✏️ Editar Código de Descuento";
        document.getElementById("discountEditId").value        = d._id;
        document.getElementById("discountCodigo").value        = d.codigo;
        document.getElementById("discountPorcentaje").value    = d.porcentaje;
        document.getElementById("discountDescripcion").value   = d.descripcion || "";
        document.getElementById("discountUsoMaximo").value     = d.usoMaximo;
        document.getElementById("discountFechaExpira").value   = d.fechaExpira || "";
        document.getElementById("discountActivo").value        = String(d.activo);
        document.getElementById("discountCodigo").disabled     = true;
        discountFormOverlay.classList.add("show");
    };

    window.deleteDiscount = async function(id) {
        if (!confirm("¿Seguro que deseas eliminar este código?")) return;
        try {
            const res = await fetch(`${API_BASE}/discounts/${id}`, {
                method: "DELETE",
                headers: getAuthHeaders()
            });
            if (res.ok) {
                alert("✅ Código eliminado");
                await loadDiscounts();
            } else {
                const data = await res.json();
                alert(`❌ ${data.error}`);
            }
        } catch (err) {
            alert("❌ Error al eliminar el código");
        }
    };

    const allCards = Array.from(document.querySelectorAll(".missions-board .mission-card"));
    const featuredBoard = document.getElementById("featuredBoard");
    const allProductsBoard = document.getElementById("allProductsBoard");

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { root: null, rootMargin: '0px', threshold: 0.12 });

    function observeCards() {
        const els = document.querySelectorAll('.mission-card:not(.apple-observed), .apple-hero:not(.apple-observed), .apple-split-card:not(.apple-observed)');
        els.forEach((el, index) => {
            el.classList.add('apple-observed', 'apple-reveal');
            const delay = Math.min((index % 4) * 0.1, 0.3);
            el.style.transitionDelay = `${delay}s, ${delay}s`;
            scrollObserver.observe(el);
        });
    }
    const modal = document.getElementById("productModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalDescription = document.getElementById("modalDescription");
    const modalPrice = document.getElementById("modalPrice");
    const modalSeller = document.getElementById("modalSeller");
    const modalImage = document.getElementById("modalImage");
    const filterButtons = document.querySelectorAll(".filters button");
    const allTitle = document.getElementById("allProductsTitle");
    const scrollTopBtn = document.getElementById("scrollTopBtn");
    const lastViewedBoard = document.getElementById("lastViewedBoard");
    const clearHistoryBtn = document.getElementById("clearHistoryBtn");

    const form = document.getElementById("contactForm");
    const tableBody = document.getElementById("contactTableBody");
    const deleteBtn = document.getElementById("deleteBtn");

    let usuarios = [];
    let filaSeleccionada = null;

    async function loadContacts() {
        try {
            const res = await fetch(`${API_BASE}/contacts`);
            if (res.ok) {
                const contactosGuardados = await res.json();
                contactosGuardados.forEach(data => {
                    const usuario = new Usuario(data.nombre, data.correo, data.mensaje);
                    usuario.fecha = data.fecha;
                    usuario.hora = data.hora;
                    usuario._id = data._id;
                    usuarios.push(usuario);
                    agregarFila(usuario);
                });
            }
        } catch (err) {
            console.warn("⚠️ No se pudieron cargar contactos:", err.message);
        }
    }

    loadContacts();

    const PRODUCTS_PER_PAGE = 12;
    let currentPage = 1;
    let currentFilter = "all";

    const titlesMap = {
        all: "🌌 Todas las Reliquias",
        series: "📺 Reliquias de Series",
        peliculas: "🎬 Reliquias de Películas",
        anime: "🍥 Reliquias de Anime",
        videojuegos: "🎮 Reliquias de Videojuegos"
    };

    const categoryEmoji = {
        series: "📺",
        peliculas: "🎬",
        anime: "🍥",
        videojuegos: "🎮"
    };

    function attachModalEvents(cards) {
        cards.forEach(card => {
            card.addEventListener("click", async (e) => {
                if (e.target.classList.contains('add-to-cart-btn')) {
                    return;
                }
            
                modalTitle.textContent = card.dataset.title;
                modalDescription.textContent = card.dataset.description;
                modalPrice.textContent = card.dataset.price;
                modalSeller.textContent = card.dataset.seller;
                modalImage.src = card.dataset.image;

                const viewedProduct = {
                    title:       card.dataset.title,
                    description: card.dataset.description,
                    price:       card.dataset.price,
                    seller:      card.dataset.seller,
                    image:       card.dataset.image,
                    category:    card.dataset.category,
                    stock:       card.dataset.stock,
                    productId:   card.dataset.productId || null
                };

                const category = card.dataset.category || "otros";
                let history = {};
                try {
                    const res = await fetch(`${API_BASE}/lastviewed`);
                    if (res.ok) history = await res.json();
                } catch (err) {
                    console.warn("⚠️ No se pudo cargar historial:", err.message);
                }

                if (!history[category] || !Array.isArray(history[category])) history[category] = [];

                history[category] = history[category].filter(item => item.title !== viewedProduct.title);
                history[category].unshift(viewedProduct);
                if (history[category].length > 5) history[category].pop();

                try {
                    await fetch(`${API_BASE}/lastviewed`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(history)
                    });
                } catch (err) {
                    console.warn("⚠️ No se pudo guardar historial:", err.message);
                }

                renderLastViewed(history);

                const oldLink = modal.querySelector(".whatsapp-link");
                const oldCartBtn = modal.querySelector(".modal-cart-btn");
                if (oldLink) oldLink.remove();
                if (oldCartBtn) oldCartBtn.remove();

                const whatsappLink = document.createElement("a");
                whatsappLink.href = `https://wa.me/5215629727628?text=${encodeURIComponent(`¡Hola! Estoy interesado en este producto: ${card.dataset.title} - ${card.dataset.description}`)}`;
                whatsappLink.target = "_blank";
                whatsappLink.textContent = "💬 Contactar por WhatsApp";
                whatsappLink.style.display = "inline-block";
                whatsappLink.style.marginTop = "15px";
                whatsappLink.style.padding = "10px 20px";
                whatsappLink.style.background = "#25D366";
                whatsappLink.style.color = "#fff";
                whatsappLink.style.borderRadius = "980px";
                whatsappLink.style.textDecoration = "none";
                whatsappLink.style.fontWeight = "bold";
                whatsappLink.classList.add("whatsapp-link");
                modal.querySelector(".modal-content").appendChild(whatsappLink);

                const addToCartModalBtn = document.createElement("button");
                addToCartModalBtn.textContent = "🛒 Añadir al Carrito";
                addToCartModalBtn.className = "modal-cart-btn";
                addToCartModalBtn.style.display = "inline-block";
                addToCartModalBtn.style.marginTop = "15px";
                addToCartModalBtn.style.marginLeft = "10px";
                addToCartModalBtn.style.padding = "10px 20px";
                addToCartModalBtn.style.background = "#0071e3";
                addToCartModalBtn.style.color = "#fff";
                addToCartModalBtn.style.border = "none";
                addToCartModalBtn.style.borderRadius = "980px";
                addToCartModalBtn.style.fontWeight = "bold";
                addToCartModalBtn.style.cursor = "pointer";
            
                addToCartModalBtn.addEventListener("click", () => {
                    addToCart(viewedProduct);
                    modal.classList.remove("show");
                });
            
                modal.querySelector(".modal-content").appendChild(addToCartModalBtn);

                const oldStockInfo = modal.querySelector(".modal-stock-info");
                if (oldStockInfo) oldStockInfo.remove();

                const stockWrapper = document.createElement("div");
                stockWrapper.className = "modal-stock-info";
                stockWrapper.style.cssText = "margin-top:18px; text-align:center;";

                let stockNum = parseInt(card.dataset.stock) || 0;
                try {
                    const productId = card.dataset.productId;
                    if (productId) {
                        const stockRes = await fetch(`${API_BASE}/products/${productId}`);
                        if (stockRes.ok) {
                            const freshProduct = await stockRes.json();
                            if (freshProduct.stock !== undefined) {
                                stockNum = parseInt(freshProduct.stock);
                                card.dataset.stock = stockNum;
                                viewedProduct.stock = stockNum;
                            }
                        }
                    }
                } catch (err) {
                    console.warn("⚠️ No se pudo obtener stock actualizado:", err.message);
                }

                const stockLabel = document.createElement("p");
                stockLabel.style.cssText = "font-size:0.85rem; color:#888; margin:0 0 6px;";
                stockLabel.textContent = `📦 Stock disponible: ${stockNum} unidades`;
                stockWrapper.appendChild(stockLabel);

                const lowStockMessages = {
                    10: {
                        "Mjolnir": "⚡ ¡Solo quedan unas pocas réplicas del martillo de Thor! Los dignos no escasean.",
                        "Batarang": "🦇 El arsenal de Batman se está agotando. Gotham no puede esperar.",
                        "Lightsaber Sith": "🔴 El lado oscuro también tiene límites de stock. Pocos sables rojos quedan.",
                        "Lightsaber Jedi": "🔵 La Fuerza te avisa: quedan pocos sables azules en el universo.",
                        "Escudo del Capitán América": "🛡️ Los escudos vibranium se agotan. Steve Rogers no aprobaría el desabasto.",
                        "Espada Maestra": "🗡️ Link casi no tiene más espadas sagradas para salvar Hyrule.",
                        "Pokébola": "⚪ ¡Poco stock de Pokébolas! Los entrenadores están en pánico.",
                        "Esferas del Dragón": "✨ Las Esferas del Dragón escasean. Shenlong está preocupado.",
                        "Marca de Dohaeris": "🐉 El Trono de Hierro tiene pocos asientos... y pocas marcas.",
                        "Medallón del Brujo": "🐺 Geralt tiene pocas palabras y menos medallones disponibles.",
                        "Zanpakuto Shikai": "⚔️ La Sociedad de Almas reporta escasez de zanpakuto.",
                        "Sombrero de Heisenberg": "🎩 El negocio de Heisenberg se está quedando sin inventario, Jesse.",
                        "Pip-Boy 3000": "☢️ Los refugios de la Hermandad del Acero casi no tienen Pip-Boys.",
                        "Espadas del Caos": "🔴 Kratos está furioso: pocas Espadas del Caos disponibles en el Olimpo.",
                        "Hoja Oculta": "🗡️ La Cofradía de Asesinos reporta escasez de hojas ocultas.",
                        "Llave-Espada": "🔑 Sora necesita más Kingdom Keys. El multiverso las está reclamando.",
                        "Tridente de Aquaman": "🔱 Atlantis tiene poco stock. Aquaman está buscando proveedores.",
                        "Sable de Luz Rojo": "🔴 El Imperio Galáctico casi se queda sin sables Sith.",
                        "Sable de Luz Azul": "🔵 La Orden Jedi necesita más cristales kyber.",
                        "Compuesto Venenoso": "🕷️ El Duende Verde tiene poca reserva del compuesto.",
                        "Máscara de Ghostface": "🔪 ¡Cuidado! Quedan pocas máscaras en Woodsboro.",
                        "Máscara de Majora": "👹 La luna cae en 3 días... y el stock también.",
                        "Death Note": "📓 Ryuk advierte: quedan pocas libretas de la muerte.",
                        "Lentes E.D.I.T.H.": "🕶️ Stark Industries casi agota las EDITH. Nick Fury está alerta.",
                        "Capa de Invisibilidad": "🧙 El misterioso stock de capas mágicas se desvanece.",
                        "Varita de Voldemort": "🪄 El Señor Tenebroso tiene poca varita... pero mucho poder.",
                        "Cofre de Beskar": "🪖 Los forjadores mandalorianos escasean. Din Djarin está buscando más.",
                        "Banda de Aragorn": "👑 Las forjas de Gondor producen poco. Aragorn lo siente.",
                        "Arco de Legolas": "🏹 El bosque de los elfos casi no tiene más arcos de Legolas.",
                        "Anillo de Sauron": "💍 Un anillo para gobernarlos... pero quedan pocos en stock.",
                        "DeLorean": "🚗 Doc Brown advierte: ¡Pocas unidades a 88 mph disponibles!",
                        "Rick Sánchez": "🧪 Wubba lubba dub dub... y poco stock también.",
                        "Traje Mark 85": "🦾 Los laboratorios Stark casi no tienen trajes Mark 85.",
                        "Traje de Deadpool": "💥 Wade Wilson rompió la cuarta pared y el stock.",
                        "Chaqueta de Daryl": "🏍️ Los supervivientes en Alexandria empiezan a escasear chaquetas.",
                        "Traje de Goku": "🥋 Las Artes Marciales del Templo están casi sin trajes de Goku.",
                        "Traje de Masterchief": "🪖 La UNSC reporta bajas en el inventario de armaduras Spartan.",
                        "Traje de Top Gun": "✈️ La Academia Naval casi sin trajes de piloto de combate.",
                        "Traje de Indiana Jones": "🎩 El Museo tiene poca ropa de arqueólogo aventurero.",
                        "Traje Shelby": "🐴 La familia Shelby avisa: pocas chaquetas para los negocios.",
                        "Traje de Tanjiro": "🌊 El Cuerpo Cazademonios tiene pocos uniformes disponibles.",
                        "Haori de Zoro": "🗡️ La tripulación del Sombrero de Paja tiene poca haori.",
                        "Traje Doom": "👾 La UAC reporta escasez de armaduras del Doom Slayer.",
                        "Capa de Geralt": "🐺 Las temporadas del brujo son largas y el stock corto.",
                        "Traje de Harry Potter": "⚡ Hogwarts casi no tiene trajes de mago disponibles.",
                        "Varita de Harry Potter": "🪄 Ollivanders advierte: quedan pocas varitas de acebo con pluma de fénix.",
                        "Espada de Link": "🗡️ Las fraguas de Hyrule casi no producen espadas del héroe.",
                        "Escudo de Link": "🛡️ Los talleres de Hyrule escasean en escudos del héroe del tiempo.",
                        "Katana de Zoro": "⚔️ El Dojo de los Tres Estilos tiene poco filo disponible.",
                        "Traje de Aragorn": "🧝 Las tierras de Gondor tienen poca ropa real disponible."
                    },
                    5: {
                        "Mjolnir": "⚡ ¡SOLO 5 MJOLNIR! Asgard está en alerta máxima.",
                        "Batarang": "🦇 Solo 5 batarangs. El Joker está celebrando.",
                        "Lightsaber Sith": "🔴 5 sables oscuros. El Consejo Sith está nervioso.",
                        "Lightsaber Jedi": "🔵 5 sables de la luz. La Orden Jedi convoca sesión de emergencia.",
                        "Escudo del Capitán América": "🛡️ ¡5 escudos! Los Vengadores han sido convocados.",
                        "Espada Maestra": "🗡️ Solo 5 espadas maestras. Hyrule tiembla.",
                        "Pokébola": "⚪ ¡SOLO 5 POKÉBOLAS! El Prof. Oak está desesperado.",
                        "Esferas del Dragón": "✨ ¡Solo 5 Esferas! Bulma y Yamcha pelean por ellas.",
                        "Marca de Dohaeris": "🐉 ¡Solo 5 marcas! Cersei manda quemar las demás.",
                        "Medallón del Brujo": "🐺 ¡5 medallones! Yennefer ya reclamó los mejores.",
                        "Zanpakuto Shikai": "⚔️ ¡5 zanpakutos! Rukia congeló el último lote.",
                        "Sombrero de Heisenberg": "🎩 ¡5 sombreros! Saul Goodman ya está tramitando el papeleo.",
                        "Pip-Boy 3000": "☢️ ¡5 Pip-Boys! El Refugio 111 los está acaparando.",
                        "Espadas del Caos": "🔴 ¡5 espadas! Ares fue destruido y no hay quien las forje.",
                        "Hoja Oculta": "🗡️ ¡5 hojas! Ezio Auditore reclama la culpa del desabasto.",
                        "Llave-Espada": "🔑 ¡5 llaves! Donald y Goofy están histéricos buscando más.",
                        "Tridente de Aquaman": "🔱 ¡5 tridentes! Mera los escondió en las profundidades.",
                        "Sable de Luz Rojo": "🔴 ¡5 sables! El Inquisidor los busca por toda la galaxia.",
                        "Sable de Luz Azul": "🔵 ¡5 sables azules! Obi-Wan entrena candidatos a la carrera.",
                        "Compuesto Venenoso": "🕷️ ¡5 frascos! El Duende Verde los guarda bajo llave en el puente.",
                        "Máscara de Ghostface": "🔪 ¡5 máscaras! Sidney Prescott ya escapó de las 45 anteriores.",
                        "Máscara de Majora": "👹 ¡5 máscaras! El Vendedor de Máscaras llora en la esquina.",
                        "Death Note": "📓 ¡5 libretas! Light Yagami tiene la vista clavada en ti.",
                        "Lentes E.D.I.T.H.": "🕶️ ¡5 lentes EDITH! Mysterio no puede hackearlos todos a tiempo.",
                        "Capa de Invisibilidad": "🧙 ¡5 capas! Dumbledore escondió las otras en Azkaban.",
                        "Varita de Voldemort": "🪄 ¡5 varitas! Bellatrix ya guarda tres en su corpiño.",
                        "Cofre de Beskar": "🪖 ¡5 cofres! El Armero funde el último lingote esta semana.",
                        "Banda de Aragorn": "👑 ¡5 bandas! Gandalf dice que el tiempo apremia, Hobbit.",
                        "Arco de Legolas": "🏹 ¡5 arcos! Thranduil subió los impuestos del bosque de Mirkwood.",
                        "Anillo de Sauron": "💍 ¡5 anillos! El Ojo de Sauron ya te está mirando a ti.",
                        "DeLorean": "🚗 ¡5 DeLoreans! El flujo temporal está en riesgo.",
                        "Rick Sánchez": "🧪 ¡5 figuras de Rick! Morty está en crisis existencial.",
                        "Traje Mark 85": "🦾 ¡Solo 5 trajes! Tony Stark activa el protocolo de emergencia.",
                        "Traje de Deadpool": "💥 ¡5 trajes! Deadpool ya firmó los otros 45 en el mercado negro.",
                        "Chaqueta de Daryl": "🏍️ ¡5 chaquetas! Negan ya quemó el resto como advertencia.",
                        "Traje de Goku": "🥋 Solo 5 trajes. Gohan no puede creerlo.",
                        "Traje de Masterchief": "🪖 ¡5 armaduras! El programa Spartan no acepta más bajas.",
                        "Traje de Top Gun": "✈️ ¡5 trajes! Maverick voló a 10G y los demás se deshicieron.",
                        "Traje de Indiana Jones": "🎩 ¡5 trajes! Los nazis robaron los otros en el Arca.",
                        "Traje Shelby": "🐴 ¡5 chaquetas! Tommy Shelby ya negoció las restantes con los Lee.",
                        "Traje de Tanjiro": "🌊 ¡5 uniformes! Nezuko los rompió practicando en forma demonio.",
                        "Haori de Zoro": "🗡️ ¡5 haoris! Sanji las usó para limpiar la cocina del Sunny.",
                        "Traje Doom": "👾 ¡5 armaduras! Los demonios del Infierno las fundieron para reírse.",
                        "Capa de Geralt": "🐺 ¡5 capas! Una bruja de las Montañas de las Brujas tiene el resto.",
                        "Traje de Harry Potter": "⚡ ¡5 trajes! Peeves los escondió en el Pasillo Prohibido.",
                        "Varita de Harry Potter": "🪄 ¡5 varitas! Ollivanders dice que la madera de acebo escasea.",
                        "Espada de Link": "🗡️ ¡5 espadas! Ganondorf robó las demás del templo de tiempo.",
                        "Escudo de Link": "🛡️ ¡5 escudos! Los Bokoblin los usan de sartén en sus campamentos.",
                        "Katana de Zoro": "⚔️ ¡5 katanas! Mihawk las tasó y ninguna vale tres millones de Berry.",
                        "Traje de Aragorn": "🧝 ¡5 trajes! Los Nazgûl se los llevaron cabalgando en la oscuridad.",
                        "default": "🚨 ¡SOLO QUEDAN 5! El multiverso está al borde del caos."
                    },
                    3: {
                        "Mjolnir": "⚡ ¡3 MARTILLOS DE THOR! ¿Eres digno de conseguir el último?",
                        "Batarang": "🦇 ¡3 BATARANGS! Gotham necesita un héroe ahora mismo.",
                        "Lightsaber Sith": "🔴 ¡3 SABLES SITH! El Lado Oscuro nunca fue tan escaso.",
                        "Lightsaber Jedi": "🔵 ¡3 SABLES JEDI! La Orden tiene fecha de extinción si no actúas.",
                        "Escudo del Capitán América": "🛡️ ¡3 ESCUDOS! El vibranium de Wakanda no es infinito.",
                        "Espada Maestra": "🗡️ ¡3 ESPADAS MAESTRAS! Hyrule manda señal de socorro.",
                        "Pokébola": "⚪ ¡3 POKÉBOLAS! Es tu última oportunidad de atrapar al legendario.",
                        "Esferas del Dragón": "✨ ¡3 ESFERAS! Recoge las 7 antes de que otro lo haga.",
                        "Marca de Dohaeris": "🐉 ¡3 MARCAS! El Trono de Hierro tiene nuevo pretendiente cada semana.",
                        "Medallón del Brujo": "🐺 ¡3 MEDALLONES! El destino de Rivian depende de que actúes ya.",
                        "Zanpakuto Shikai": "⚔️ ¡3 ZANPAKUTOS! La Gran Batalla del Alma depende de este filo.",
                        "Sombrero de Heisenberg": "🎩 ¡3 SOMBREROS! Say my name... y compra antes de que se acaben.",
                        "Pip-Boy 3000": "☢️ ¡3 PIP-BOYS! El Yermo necesita más sobrevivientes equipados.",
                        "Espadas del Caos": "🔴 ¡3 ESPADAS! La ira de Kratos no tiene límites ni stock.",
                        "Hoja Oculta": "🗡️ ¡3 HOJAS OCULTAS! Nada es verdad, todo está permitido... excepto el restock.",
                        "Llave-Espada": "🔑 ¡3 LLAVES! Los corazones del mundo dependen de esta compra.",
                        "Tridente de Aquaman": "🔱 ¡3 TRIDENTES! El océano reclama lo que le pertenece.",
                        "Sable de Luz Rojo": "🔴 ¡3 SABLES! El Lado Oscuro rara vez ofrece segunda oportunidad.",
                        "Sable de Luz Azul": "🔵 ¡3 SABLES AZULES! La galaxia no puede esperar más tiempo.",
                        "Compuesto Venenoso": "🕷️ ¡3 FRASCOS! El Duende Verde ya está volando hacia aquí.",
                        "Máscara de Ghostface": "🔪 ¡3 MÁSCARAS! El asesino siempre llama dos veces... y esta es la tercera.",
                        "Máscara de Majora": "👹 ¡3 MÁSCARAS! La luna aterrizará en menos de lo que crees.",
                        "Death Note": "📓 ¡3 DEATH NOTES! Ryuk personalmente recomienda que actúes ya.",
                        "Lentes E.D.I.T.H.": "🕶️ ¡3 LENTES EDITH! Con gran tecnología viene gran escasez.",
                        "Capa de Invisibilidad": "🧙 ¡3 CAPAS! Quedan tan pocas que casi son invisibles en el inventario.",
                        "Varita de Voldemort": "🪄 ¡3 VARITAS! Avada Kedavra... el stock.",
                        "Cofre de Beskar": "🪖 ¡3 COFRES! Esto es el Camino... al agotamiento.",
                        "Banda de Aragorn": "👑 ¡3 BANDAS! El rey de Gondor no espera coronación eterna.",
                        "Arco de Legolas": "🏹 ¡3 ARCOS! Un elfo no falla dos veces el mismo objetivo.",
                        "Anillo de Sauron": "💍 ¡3 ANILLOS! Uno para dominarlos a todos... apresúrate.",
                        "DeLorean": "🚗 ¡3 DeLoreans! El tiempo se agota, literalmente.",
                        "Rick Sánchez": "🧪 ¡3 RICKS! La teoría del multiverso dice que hay infinitos... pero en stock solo 3.",
                        "Traje Mark 85": "🦾 ¡3 TRAJES MARK 85! I am Iron Man... pero por poco tiempo.",
                        "Traje de Deadpool": "💥 ¡3 TRAJES! Deadpool rompe la cuarta pared y el almacén.",
                        "Chaqueta de Daryl": "🏍️ ¡3 CHAQUETAS! Sobrevivir al apocalipsis es más fácil que conseguir esta chaqueta.",
                        "Traje de Goku": "🥋 ¡3 TRAJES DE GOKU! El torneo del poder tiene pocas plazas.",
                        "Traje de Masterchief": "🪖 ¡3 ARMADURAS! La Humanidad necesita más Spartans ya.",
                        "Traje de Top Gun": "✈️ ¡3 TRAJES! Velocidad y adrenalina... y muy poco stock.",
                        "Traje de Indiana Jones": "🎩 ¡3 TRAJES! El último cruzado tiene un reto más difícil: el inventario.",
                        "Traje Shelby": "🐴 ¡3 CHAQUETAS SHELBY! Por orden de los Peaky Blinders, compra ahora.",
                        "Traje de Tanjiro": "🌊 ¡3 UNIFORMES! El Pilar del Agua no puede proteger a todos sin traje.",
                        "Haori de Zoro": "🗡️ ¡3 HAORIS! Cuando Zoro se pierda buscándola, ya no habrá.",
                        "Traje Doom": "👾 ¡3 ARMADURAS DOOM! Los demonios también quieren una.",
                        "Capa de Geralt": "🐺 ¡3 CAPAS! El destino de Geralt es torcer el cuello al stock también.",
                        "Traje de Harry Potter": "⚡ ¡3 TRAJES! Hogwarts ha sido destruido más veces que el restock.",
                        "Varita de Harry Potter": "🪄 ¡3 VARITAS! Expelliarmus al stock, quedan tres.",
                        "Espada de Link": "🗡️ ¡3 ESPADAS! El héroe del tiempo no puede esperar más.",
                        "Escudo de Link": "🛡️ ¡3 ESCUDOS! Las Hadas Grandes ya no pueden reparar más.",
                        "Katana de Zoro": "⚔️ ¡3 KATANAS! Tres espadas, tres unidades, cero dudas.",
                        "Traje de Aragorn": "🧝 ¡3 TRAJES! El heredero de Isildur no puede gobernar en ropa de batalla.",
                        "default": "🔥 ¡QUEDAN SOLO 3! Una reliquia así no espera por nadie."
                    },
                    1: {
                        "Mjolnir": "⚡ ¡EL ÚLTIMO MJOLNIR DEL MULTIVERSO! Solo el digno puede reclamarlo. ¿Eres tú?",
                        "Batarang": "🦇 ¡EL ÚLTIMO BATARANG! Batman en persona lo guardó para alguien especial.",
                        "Lightsaber Sith": "🔴 ¡EL ÚLTIMO SABLE SITH! El Lado Oscuro te llama con todo su poder.",
                        "Lightsaber Jedi": "🔵 ¡EL ÚLTIMO SABLE JEDI! Que la Fuerza —y tú— decidan rápido.",
                        "Escudo del Capitán América": "🛡️ ¡EL ÚLTIMO ESCUDO VIBRANIUM! Solo un verdadero Avenger lo merece.",
                        "Espada Maestra": "🗡️ ¡LA ÚLTIMA ESPADA MAESTRA! Hyrule te necesita. No hay tiempo.",
                        "Pokébola": "⚪ ¡LA ÚLTIMA POKÉBOLA! El Pokémon legendario te espera dentro.",
                        "Esferas del Dragón": "✨ ¡LA ÚLTIMA ESFERA! Con esta completas las 7. Shenlong te espera.",
                        "Marca de Dohaeris": "🐉 ¡LA ÚLTIMA MARCA DE DOHAERIS! El trono tiene un solo heredero posible: tú.",
                        "Medallón del Brujo": "🐺 ¡EL ÚLTIMO MEDALLÓN! Sin él, Geralt es solo un hombre con cicatrices.",
                        "Zanpakuto Shikai": "⚔️ ¡EL ÚLTIMO ZANPAKUTO! Tu alma shinigami no puede seguir dormida.",
                        "Sombrero de Heisenberg": "🎩 ¡EL ÚLTIMO SOMBRERO DE HEISENBERG! Yo soy el peligro... y el último comprador.",
                        "Pip-Boy 3000": "☢️ ¡EL ÚLTIMO PIP-BOY! La supervivencia del Yermo depende de tu muñeca.",
                        "Espadas del Caos": "🔴 ¡LAS ÚLTIMAS ESPADAS DEL CAOS! Kratos ya mató a todos los que podían forjarlas.",
                        "Hoja Oculta": "🗡️ ¡LA ÚLTIMA HOJA OCULTA! Nada es verdad, todo es urgente. Cómprala ahora.",
                        "Llave-Espada": "🔑 ¡LA ÚLTIMA LLAVE-ESPADA! El destino de todos los mundos en tus manos.",
                        "Tridente de Aquaman": "🔱 ¡EL ÚLTIMO TRIDENTE! El océano entero espera que lo reclames.",
                        "Sable de Luz Rojo": "🔴 ¡EL ÚLTIMO SABLE SITH! Solo un Señor Oscuro puede empuñarlo.",
                        "Sable de Luz Azul": "🔵 ¡EL ÚLTIMO SABLE JEDI AZUL! La paz de la galaxia descansa aquí.",
                        "Compuesto Venenoso": "🕷️ ¡EL ÚLTIMO FRASCO! El Duende Verde ya viene volando en su glider.",
                        "Máscara de Ghostface": "🔪 ¡LA ÚLTIMA MÁSCARA DE GHOSTFACE! ¿Has visto alguna película de terror?",
                        "Máscara de Majora": "👹 ¡LA ÚLTIMA MÁSCARA DE MAJORA! La luna cae hoy. Tú decides.",
                        "Death Note": "📓 ¡LA ÚLTIMA DEATH NOTE! Ryuk te está mirando. Actúa ahora.",
                        "Lentes E.D.I.T.H.": "🕶️ ¡LOS ÚLTIMOS LENTES EDITH! Con estos, hasta tú puedes ser un Vengador.",
                        "Capa de Invisibilidad": "🧙 ¡LA ÚLTIMA CAPA DE INVISIBILIDAD! Desaparece antes de que se acabe.",
                        "Varita de Voldemort": "🪄 ¡LA ÚLTIMA VARITA DE VOLDEMORT! El poder absoluto espera tu decisión.",
                        "Cofre de Beskar": "🪖 ¡EL ÚLTIMO COFRE BESKAR! Este es el Camino. Y este es el final del stock.",
                        "Banda de Aragorn": "👑 ¡LA ÚLTIMA BANDA DE ARAGORN! El rey tiene prisa, y tú deberías también.",
                        "Arco de Legolas": "🏹 ¡EL ÚLTIMO ARCO DE LEGOLAS! Doce mil años de élfico artesanía, solo para ti.",
                        "Anillo de Sauron": "💍 ¡EL ÚLTIMO ANILLO ÚNICO! Sauron lo sabe. Todos lo saben. Actúa.",
                        "DeLorean": "🚗 ¡EL ÚLTIMO DELOREAN! Doc Brown dice: si no lo compras tú, ¿quién?",
                        "Rick Sánchez": "🧪 ¡LA ÚLTIMA FIGURA DE RICK! Morty llora en C-137 por el desabasto.",
                        "Traje Mark 85": "🦾 ¡EL ÚLTIMO MARK 85! Tony Stark lo dejó para el héroe correcto.",
                        "Traje de Deadpool": "💥 ¡EL ÚLTIMO TRAJE DE DEADPOOL! Cuarta pared rota, stock también.",
                        "Chaqueta de Daryl": "🏍️ ¡LA ÚLTIMA CHAQUETA DE DARYL! Los caminantes no usan tallas.",
                        "Traje de Goku": "🥋 ¡EL ÚLTIMO TRAJE DE GOKU! El poder del Super Saiyan es tuyo.",
                        "Traje de Masterchief": "🪖 ¡LA ÚLTIMA ARMADURA SPARTAN! La UNSC autoriza un solo Jefe Maestro.",
                        "Traje de Top Gun": "✈️ ¡EL ÚLTIMO TRAJE DE TOP GUN! El mejor piloto del mundo espera dueño.",
                        "Traje de Indiana Jones": "🎩 ¡EL ÚLTIMO TRAJE DE INDY! El sombrero elige a su aventurero.",
                        "Traje Shelby": "🐴 ¡LA ÚLTIMA CHAQUETA SHELBY! Por orden de los Peaky Blinders: es tuya.",
                        "Traje de Tanjiro": "🌊 ¡EL ÚLTIMO UNIFORME DE TANJIRO! El Pilar del Agua solo puede ser uno.",
                        "Haori de Zoro": "🗡️ ¡LA ÚLTIMA HAORI DE ZORO! Nada detiene al hombre que quiere ser el más grande.",
                        "Traje Doom": "👾 ¡LA ÚLTIMA ARMADURA DEL DOOM SLAYER! El Infierno te teme. Equípate.",
                        "Capa de Geralt": "🐺 ¡LA ÚLTIMA CAPA DE GERALT! El destino te la pone en el carrito.",
                        "Traje de Harry Potter": "⚡ ¡EL ÚLTIMO TRAJE DE HARRY POTTER! El elegido solo puede ser uno.",
                        "Varita de Harry Potter": "🪄 ¡LA ÚLTIMA VARITA DE HARRY! La varita elige al mago... y te eligió a ti.",
                        "Espada de Link": "🗡️ ¡LA ÚLTIMA ESPADA DE LINK! El héroe del tiempo necesita que actúes ya.",
                        "Escudo de Link": "🛡️ ¡EL ÚLTIMO ESCUDO DE LINK! Sin él, el triforce queda desprotegido.",
                        "Katana de Zoro": "⚔️ ¡LA ÚLTIMA KATANA DE ZORO! El hombre más fuerte del mundo no espera.",
                        "Traje de Aragorn": "🧝 ¡EL ÚLTIMO TRAJE DE ARAGORN! El rey regresa... y necesita ropas dignas.",
                        "default": "🌟 ¡LA ÚLTIMA UNIDAD EN EL MULTIVERSO! Esta reliquia es única. No la dejes escapar."
                    }
                };

                if (stockNum <= 10) {
                    const alertDiv = document.createElement("div");
                    alertDiv.style.cssText = "margin-top:10px; padding:10px 16px; border-radius:12px; font-size:0.9rem; font-weight:600; text-align:center;";

                    let mensaje = "";
                    let bgColor = "";

                    const titleKey = card.dataset.title;

                    if (stockNum === 0) {
                        bgColor = "rgba(120,0,0,0.18); border:1.5px solid #800; color:#ff6060;";
                        mensaje = "💀 PRODUCTO AGOTADO — Esta reliquia ha abandonado el multiverso. ¡Avisa al admin!";
                    } else if (stockNum === 1) {
                        bgColor = "rgba(255,45,45,0.15); border:1.5px solid #ff2d2d; color:#ff2d2d;";
                        mensaje = lowStockMessages[1][titleKey] || lowStockMessages[1]["default"];
                    } else if (stockNum <= 3) {
                        bgColor = "rgba(255,100,0,0.13); border:1.5px solid #ff6400; color:#ff6400;";
                        mensaje = lowStockMessages[3][titleKey] || lowStockMessages[3]["default"];
                        mensaje = mensaje.replace(/¡3(?=\s)/g, `¡${stockNum}`);
                        mensaje = mensaje.replace(/¡3(?=[A-ZÁÉÍÓÚÑ])/g, `¡${stockNum} `);
                    } else if (stockNum <= 5) {
                        bgColor = "rgba(255,180,0,0.13); border:1.5px solid #ffb400; color:#cc8800;";
                        mensaje = lowStockMessages[5][titleKey] || lowStockMessages[5]["default"];
                        mensaje = mensaje.replace(/¡SOLO 5(?=\s)/g, `¡SOLO ${stockNum}`);
                        mensaje = mensaje.replace(/¡5(?=\s)/g, `¡${stockNum}`);
                        mensaje = mensaje.replace(/¡5(?=[A-ZÁÉÍÓÚÑ])/g, `¡${stockNum} `);
                    } else {
                        bgColor = "rgba(255,200,0,0.10); border:1.5px solid #e0c000; color:#a07800;";
                        if (lowStockMessages[10][titleKey]) {
                            mensaje = lowStockMessages[10][titleKey];
                        } else {
                            mensaje = `⚠️ ¡Solo quedan ${stockNum} unidades disponibles! No dejes escapar esta reliquia.`;
                        }
                    }

                    alertDiv.style.cssText += `background:${bgColor}`;
                    alertDiv.textContent = mensaje;
                    stockWrapper.appendChild(alertDiv);
                }

                modal.querySelector(".modal-content").appendChild(stockWrapper);

                const oldWishlistBtn = modal.querySelector(".modal-wishlist-btn");
                if (oldWishlistBtn) oldWishlistBtn.remove();

                const wBtn = document.createElement("button");
                wBtn.className = "modal-wishlist-btn";
                const isInWishlist = wishlist.some(w => w.productoId?.toString() === card.dataset.productId?.toString());
                wBtn.textContent = isInWishlist ? "❤️ En tu Wishlist" : "♡ Guardar en Wishlist";
                if (isInWishlist) wBtn.classList.add("in-wishlist");
                wBtn.addEventListener("click", async () => {
                    const added = await toggleWishlist({
                        productId:   card.dataset.productId,
                        title:       card.dataset.title,
                        description: card.dataset.description,
                        price:       card.dataset.price,
                        seller:      card.dataset.seller,
                        image:       card.dataset.image,
                        category:    card.dataset.category
                    });
                    wBtn.textContent = added ? "❤️ En tu Wishlist" : "♡ Guardar en Wishlist";
                    if (added) wBtn.classList.add("in-wishlist");
                    else wBtn.classList.remove("in-wishlist");
                });
                modal.querySelector(".modal-content").appendChild(wBtn);

                currentReviewProductId = card.dataset.productId;
                selectedStars = 0;
                const starBtnsModal = document.querySelectorAll(".star-btn");
                starBtnsModal.forEach(s => { s.classList.remove("active"); s.style.color = ""; });
                const revMsg = document.getElementById("reviewMsg");
                if (revMsg) revMsg.classList.add("hidden");
                const revComment = document.getElementById("reviewComment");
                if (revComment) revComment.value = "";
                if (card.dataset.productId) loadAndRenderReviews(card.dataset.productId);

                modal.classList.add("show");
            });
        
            if (!card.querySelector('.add-to-cart-btn')) {
                const addToCartBtn = document.createElement("button");
                addToCartBtn.textContent = "🛒";
                addToCartBtn.className = "add-to-cart-btn";
                addToCartBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    addToCart({
                        title:       card.dataset.title,
                        description: card.dataset.description,
                        price:       card.dataset.price,
                        seller:      card.dataset.seller,
                        image:       card.dataset.image,
                        category:    card.dataset.category,
                        stock:       card.dataset.stock,
                        productId:   card.dataset.productId || null
                    });
                });
                card.appendChild(addToCartBtn);
            }
        });
    }

    async function renderLastViewed(history) {
        if (!lastViewedBoard) return;

        if (!history) {
            try {
                const res = await fetch(`${API_BASE}/lastviewed`);
                if (res.ok) history = await res.json();
                else history = {};
            } catch (err) {
                history = {};
            }
        }

        lastViewedBoard.innerHTML = "";

        Object.keys(history).forEach(category => {
            if (!Array.isArray(history[category]) || history[category].length === 0) return;

            const container = document.createElement("div");
            container.className = "last-viewed-category";
            container.style.width = "100%";
            container.style.marginBottom = "40px";

            const title = document.createElement("h4");
            title.textContent = `${categoryEmoji[category] || "📂"} ${category.toUpperCase()}`;
            title.style.cssText = "text-align:left; padding-left:0; margin-bottom:16px; font-weight:600;";
            container.appendChild(title);

            const grid = document.createElement("div");
            grid.className = "missions-board";

            history[category].forEach(item => {
                const card = document.createElement("div");
                card.className = "mission-card";
                card.dataset.category = item.category || category;
                card.innerHTML = `
                    <img src="${item.image}" alt="${item.title}">
                    <h3>${item.title}</h3>
                    <p>Visto recientemente</p>
                    <span>${item.price}</span>
                `;
                card.addEventListener("click", () => {
                    modalTitle.textContent = item.title;
                    modalDescription.textContent = item.description;
                    modalPrice.textContent = item.price;
                    modalSeller.textContent = item.seller;
                    modalImage.src = item.image;

                    const oldLink = modal.querySelector(".whatsapp-link");
                    if (oldLink) oldLink.remove();

                    const oldStockInfoLv = modal.querySelector(".modal-stock-info");
                    if (oldStockInfoLv) oldStockInfoLv.remove();

                    const whatsappLink = document.createElement("a");
                    whatsappLink.href = `https://wa.me/5215629727628?text=${encodeURIComponent(`¡Hola! Estoy interesado en este producto: ${item.title} - ${item.description}`)}`;
                    whatsappLink.target = "_blank";
                    whatsappLink.textContent = "💬 Contactar por WhatsApp";
                    whatsappLink.style.cssText = "display:inline-block; margin-top:15px; padding:10px 20px; background:#25D366; color:#fff; border-radius:980px; text-decoration:none; font-weight:bold;";
                    whatsappLink.classList.add("whatsapp-link");
                    modal.querySelector(".modal-content").appendChild(whatsappLink);

                    modal.classList.add("show");
                });
                grid.appendChild(card);
            });

            container.appendChild(grid);
            lastViewedBoard.appendChild(container);
        });

        setTimeout(observeCards, 100);
    }

    function countProductsByCategory() {
        const counts = { all: allCards.length, series: 0, peliculas: 0, anime: 0, videojuegos: 0 };
        allCards.forEach(card => {
            if (counts[card.dataset.category] !== undefined) counts[card.dataset.category]++;
        });

        filterButtons.forEach(btn => {
            const filter = btn.dataset.filter;
            if (counts[filter] !== undefined) {
                btn.innerHTML = `${categoryEmoji[filter] || ""} ${filter.charAt(0).toUpperCase() + filter.slice(1)} (${counts[filter]})`;
            }
        });
    }

    function renderFeatured() {
        if (!featuredBoard) return;
        featuredBoard.innerHTML = "";
        featuredBoard.className = "apple-showcase";

        const featTitle = document.getElementById("featuredTitle");
        if (featTitle) featTitle.style.display = "none";
        const parentSection = featuredBoard.closest('.missions');
        if (parentSection) { parentSection.style.padding = "0"; parentSection.style.maxWidth = "100%"; }

        let appleProducts = [];
        if (allCards.length > 0) {
            const shuffled = [...allCards].sort(() => 0.5 - Math.random());
            appleProducts = shuffled.slice(0, 4).map(card => ({
                title:       card.dataset.title,
                description: card.dataset.description,
                price:       card.dataset.price,
                category:    card.dataset.category,
                image:       card.dataset.image,
                seller:      card.dataset.seller,
                stock:       card.dataset.stock !== undefined ? parseInt(card.dataset.stock) : 50,
                _id:         card.dataset.productId
            }));
        }
        while (appleProducts.length < 4) {
            appleProducts.push({ title: "Reliquia del Multiverso", description: "Un objeto de poder incalculable.", price: "$999 MXN", category: "varios", image: "harry.png", seller: "La Cueva" });
        }

        const esc = p => JSON.stringify(p).replace(/'/g, "&#39;");

        featuredBoard.innerHTML = `
            <div class="apple-hero dark-hero">
                <div class="apple-hero-text">
                    <h2>${appleProducts[0].title}</h2>
                    <p>${appleProducts[0].description.substring(0, 60)}…</p>
                    <div class="apple-links">
                        <button class="btn-blue" onclick='window.openFeaturedModal(${esc(appleProducts[0])})'>Ver detalles</button>
                        <button class="btn-hollow" onclick='window.addToCartApple(${esc(appleProducts[0])})'>Comprar</button>
                    </div>
                </div>
                <img src="${appleProducts[0].image}" alt="${appleProducts[0].title}">
            </div>
            <div class="apple-hero light-hero">
                <div class="apple-hero-text">
                    <h2><span style="color:#0071e3">Nuevo.</span> ${appleProducts[1].title}</h2>
                    <p>${appleProducts[1].description.substring(0, 60)}…</p>
                    <div class="apple-links">
                        <button class="btn-blue" onclick='window.openFeaturedModal(${esc(appleProducts[1])})'>Ver detalles</button>
                        <button class="btn-hollow" onclick='window.addToCartApple(${esc(appleProducts[1])})'>Comprar</button>
                    </div>
                </div>
                <img src="${appleProducts[1].image}" alt="${appleProducts[1].title}">
            </div>
            <div class="apple-split">
                <div class="apple-split-card light-hero" style="background:#fbfbfd">
                    <div class="apple-hero-text">
                        <h2 style="font-size:38px">${appleProducts[2].title}</h2>
                        <p style="font-size:18px">${appleProducts[2].description.substring(0, 50)}…</p>
                        <div class="apple-links">
                            <button class="btn-blue" onclick='window.openFeaturedModal(${esc(appleProducts[2])})'>Ver detalles</button>
                            <button class="btn-hollow" onclick='window.addToCartApple(${esc(appleProducts[2])})'>Comprar</button>
                        </div>
                    </div>
                    <img src="${appleProducts[2].image}" alt="${appleProducts[2].title}">
                </div>
                <div class="apple-split-card dark-hero" style="background:#000">
                    <div class="apple-hero-text">
                        <h2 style="font-size:38px">${appleProducts[3].title}</h2>
                        <p style="font-size:18px">${appleProducts[3].description.substring(0, 50)}…</p>
                        <div class="apple-links">
                            <button class="btn-blue" onclick='window.openFeaturedModal(${esc(appleProducts[3])})'>Ver detalles</button>
                            <button class="btn-hollow dark-hero" onclick='window.addToCartApple(${esc(appleProducts[3])})'>Comprar</button>
                        </div>
                    </div>
                    <img src="${appleProducts[3].image}" alt="${appleProducts[3].title}">
                </div>
            </div>
        `;

        window.addToCartApple = function(product) { addToCart(product); };

        window.openFeaturedModal = function(product) {
            modalTitle.textContent = product.title;
            modalDescription.textContent = product.description;
            modalPrice.textContent = product.price;
            modalSeller.textContent = product.seller;
            modalImage.src = product.image;

            const oldLink = modal.querySelector(".whatsapp-link");
            const oldCartBtn = modal.querySelector(".modal-cart-btn");
            const oldStockInfoF = modal.querySelector(".modal-stock-info");
            if (oldLink) oldLink.remove();
            if (oldCartBtn) oldCartBtn.remove();
            if (oldStockInfoF) oldStockInfoF.remove();

            const whatsappLink = document.createElement("a");
            whatsappLink.href = `https://wa.me/5215629727628?text=${encodeURIComponent(`¡Hola! Estoy interesado en este producto: ${product.title} - ${product.description}`)}`;
            whatsappLink.target = "_blank";
            whatsappLink.textContent = "💬 Contactar por WhatsApp";
            whatsappLink.style.display = "inline-block";
            whatsappLink.style.marginTop = "15px";
            whatsappLink.style.padding = "10px 20px";
            whatsappLink.style.background = "#25D366";
            whatsappLink.style.color = "#fff";
            whatsappLink.style.borderRadius = "980px";
            whatsappLink.style.textDecoration = "none";
            whatsappLink.style.fontWeight = "bold";
            whatsappLink.classList.add("whatsapp-link");
            modal.querySelector(".modal-content").appendChild(whatsappLink);

            const addToCartModalBtn = document.createElement("button");
            addToCartModalBtn.textContent = "🛒 Añadir al Carrito";
            addToCartModalBtn.className = "modal-cart-btn";
            addToCartModalBtn.style.display = "inline-block";
            addToCartModalBtn.style.marginTop = "15px";
            addToCartModalBtn.style.marginLeft = "10px";
            addToCartModalBtn.style.padding = "10px 20px";
            addToCartModalBtn.style.background = "#0071e3";
            addToCartModalBtn.style.color = "#fff";
            addToCartModalBtn.style.border = "none";
            addToCartModalBtn.style.borderRadius = "980px";
            addToCartModalBtn.style.fontWeight = "bold";
            addToCartModalBtn.style.cursor = "pointer";
            addToCartModalBtn.addEventListener("click", () => {
                addToCart(product);
                modal.classList.remove("show");
            });
            modal.querySelector(".modal-content").appendChild(addToCartModalBtn);

            const stockWrapperF = document.createElement("div");
            stockWrapperF.className = "modal-stock-info";
            stockWrapperF.style.cssText = "margin-top:18px; text-align:center;";

            const stockNumF = product.stock !== undefined ? parseInt(product.stock) : 50;
            const stockLabelF = document.createElement("p");
            stockLabelF.style.cssText = "font-size:0.85rem; color:#888; margin:0 0 6px;";
            stockLabelF.textContent = `📦 Stock disponible: ${stockNumF} unidades`;
            stockWrapperF.appendChild(stockLabelF);

            if (stockNumF <= 10) {
                const alertDivF = document.createElement("div");
                alertDivF.style.cssText = "margin-top:10px; padding:10px 16px; border-radius:12px; font-size:0.9rem; font-weight:600; text-align:center;";
                let bgF = "", msgF = "";
                const titleKeyF = product.title;
                if (stockNumF === 0) {
                    bgF = "rgba(120,0,0,0.18); border:1.5px solid #800; color:#ff6060;";
                    msgF = "💀 PRODUCTO AGOTADO — Esta reliquia ha abandonado el multiverso. ¡Avisa al admin!";
                } else if (stockNumF === 1) {
                    bgF = "rgba(255,45,45,0.15); border:1.5px solid #ff2d2d; color:#ff2d2d;";
                    const m1 = {"Mjolnir":"⚡ ¡EL ÚLTIMO MJOLNIR DEL MULTIVERSO! Solo el digno puede reclamarlo. ¿Eres tú?","Batarang":"🦇 ¡EL ÚLTIMO BATARANG! Batman en persona lo guardó para alguien especial.","Death Note":"📓 ¡LA ÚLTIMA DEATH NOTE! Ryuk te está mirando. Actúa ahora.","Lightsaber Sith":"🔴 ¡EL ÚLTIMO SABLE SITH! El Lado Oscuro te llama con todo su poder.","Lightsaber Jedi":"🔵 ¡EL ÚLTIMO SABLE JEDI! Que la Fuerza —y tú— decidan rápido.","Escudo del Capitán América":"🛡️ ¡EL ÚLTIMO ESCUDO VIBRANIUM! Solo un verdadero Avenger lo merece.","Espada Maestra":"🗡️ ¡LA ÚLTIMA ESPADA MAESTRA! Hyrule te necesita. No hay tiempo.","Pokébola":"⚪ ¡LA ÚLTIMA POKÉBOLA! El Pokémon legendario te espera dentro.","Esferas del Dragón":"✨ ¡LA ÚLTIMA ESFERA! Con esta completas las 7. Shenlong te espera.","DeLorean":"🚗 ¡EL ÚLTIMO DELOREAN! Doc Brown dice: si no lo compras tú, ¿quién?","Anillo de Sauron":"💍 ¡EL ÚLTIMO ANILLO ÚNICO! Sauron lo sabe. Todos lo saben. Actúa.","Cofre de Beskar":"🪖 ¡EL ÚLTIMO COFRE BESKAR! Este es el Camino. Y este es el final del stock.","Traje Mark 85":"🦾 ¡EL ÚLTIMO MARK 85! Tony Stark lo dejó para el héroe correcto.","Traje de Goku":"🥋 ¡EL ÚLTIMO TRAJE DE GOKU! El poder del Super Saiyan es tuyo.","Máscara de Majora":"👹 ¡LA ÚLTIMA MÁSCARA DE MAJORA! La luna cae hoy. Tú decides."};
                    msgF = m1[titleKeyF] || "🌟 ¡LA ÚLTIMA UNIDAD EN EL MULTIVERSO! Esta reliquia es única. No la dejes escapar.";
                } else if (stockNumF <= 3) {
                    bgF = "rgba(255,100,0,0.13); border:1.5px solid #ff6400; color:#ff6400;";
                    const m3 = {"Mjolnir":"⚡ ¡3 MARTILLOS DE THOR! ¿Eres digno de conseguir el último?","Batarang":"🦇 ¡3 BATARANGS! Gotham necesita un héroe ahora mismo.","Death Note":"📓 ¡3 DEATH NOTES! Ryuk personalmente recomienda que actúes ya.","Esferas del Dragón":"✨ ¡3 ESFERAS! Recoge las 7 antes de que otro lo haga.","DeLorean":"🚗 ¡3 DeLoreans! El tiempo se agota, literalmente.","Traje Mark 85":"🦾 ¡3 TRAJES MARK 85! I am Iron Man... pero por poco tiempo.","Pokébola":"⚪ ¡3 POKÉBOLAS! Es tu última oportunidad de atrapar al legendario.","Anillo de Sauron":"💍 ¡3 ANILLOS! Uno para dominarlos a todos... apresúrate.","Cofre de Beskar":"🪖 ¡3 COFRES! Esto es el Camino... al agotamiento.","Máscara de Majora":"👹 ¡3 MÁSCARAS! La luna aterrizará en menos de lo que crees."};
                    msgF = m3[titleKeyF] || "🔥 ¡QUEDAN SOLO " + stockNumF + "! Una reliquia así no espera por nadie.";
                } else if (stockNumF <= 5) {
                    bgF = "rgba(255,180,0,0.13); border:1.5px solid #ffb400; color:#cc8800;";
                    const m5 = {"Mjolnir":"⚡ ¡SOLO 5 MJOLNIR! Asgard está en alerta máxima.","Batarang":"🦇 Solo 5 batarangs. El Joker está celebrando.","Lightsaber Sith":"🔴 5 sables oscuros. El Consejo Sith está nervioso.","Lightsaber Jedi":"🔵 5 sables de la luz. La Orden Jedi convoca sesión de emergencia.","Escudo del Capitán América":"🛡️ ¡5 escudos! Los Vengadores han sido convocados.","Espada Maestra":"🗡️ Solo 5 espadas maestras. Hyrule tiembla.","Pokébola":"⚪ ¡SOLO 5 POKÉBOLAS! El Prof. Oak está desesperado.","Esferas del Dragón":"✨ ¡Solo 5 Esferas! Bulma y Yamcha pelean por ellas.","Death Note":"📓 Solo 5 libretas. Kira está en modo pánico.","DeLorean":"🚗 ¡5 DeLoreans! El flujo temporal está en riesgo.","Cofre de Beskar":"🪖 Solo 5 cofres. El Mandaloriano protege el último.","Anillo de Sauron":"💍 5 anillos... y Sauron vigila cada uno.","Traje Mark 85":"🦾 ¡Solo 5 trajes! Tony Stark activa el protocolo de emergencia.","Traje de Goku":"🥋 Solo 5 trajes. Gohan no puede creerlo.","Máscara de Majora":"👹 ¡5 máscaras! La luna está a punto de caer."};
                    msgF = m5[titleKeyF] || "🚨 ¡SOLO QUEDAN " + stockNumF + "! El multiverso está al borde del caos.";
                } else {
                    bgF = "rgba(255,200,0,0.10); border:1.5px solid #e0c000; color:#a07800;";
                    msgF = "⚠️ ¡Pocas unidades disponibles! No dejes escapar esta reliquia.";
                }
                alertDivF.style.cssText += `background:${bgF}`;
                alertDivF.textContent = msgF;
                stockWrapperF.appendChild(alertDivF);
            }

            modal.querySelector(".modal-content").appendChild(stockWrapperF);

            const oldWishlistBtnF = modal.querySelector(".modal-wishlist-btn");
            if (oldWishlistBtnF) oldWishlistBtnF.remove();

            const wBtnF = document.createElement("button");
            wBtnF.className = "modal-wishlist-btn";
            const isInWishlistF = wishlist.some(w => w.productoId?.toString() === product._id?.toString());
            wBtnF.textContent = isInWishlistF ? "❤️ En tu Wishlist" : "♡ Guardar en Wishlist";
            if (isInWishlistF) wBtnF.classList.add("in-wishlist");
            wBtnF.addEventListener("click", async () => {
                const added = await toggleWishlist({
                    productId:   product._id,
                    title:       product.title,
                    description: product.description,
                    price:       product.price,
                    seller:      product.seller,
                    image:       product.image,
                    category:    product.category
                });
                wBtnF.textContent = added ? "❤️ En tu Wishlist" : "♡ Guardar en Wishlist";
                if (added) wBtnF.classList.add("in-wishlist");
                else wBtnF.classList.remove("in-wishlist");
            });
            modal.querySelector(".modal-content").appendChild(wBtnF);

            currentReviewProductId = product._id;
            selectedStars = 0;
            document.querySelectorAll(".star-btn").forEach(s => { s.classList.remove("active"); s.style.color = ""; });
            const revMsgF = document.getElementById("reviewMsg");
            if (revMsgF) revMsgF.classList.add("hidden");
            const revCommentF = document.getElementById("reviewComment");
            if (revCommentF) revCommentF.value = "";
            if (product._id) loadAndRenderReviews(product._id);

            modal.classList.add("show");
        };

        setTimeout(observeCards, 80);
    }

    function getFilteredCards(filter) {
        return allCards.filter(card => filter === "all" || card.dataset.category === filter);
    }

    function renderProducts(filter = currentFilter, page = currentPage) {
        const filtered = getFilteredCards(filter);
        const start = 0;
        const end = PRODUCTS_PER_PAGE * page;

        const productsToRender = filtered.slice(0, end);
        allProductsBoard.innerHTML = "";

        productsToRender.forEach(card => {
            const clone = card.cloneNode(true);
            allProductsBoard.appendChild(clone);
        });

        attachModalEvents(allProductsBoard.querySelectorAll(".mission-card"));

        let loadMoreBtnExisting = document.getElementById("dynamicLoadMore");
        if (loadMoreBtnExisting) loadMoreBtnExisting.remove();

        if (filtered.length > end) {
            const dynamicBtn = document.createElement("button");
            dynamicBtn.id = "dynamicLoadMore";
            dynamicBtn.textContent = "Ver más productos";
            dynamicBtn.classList.add("load-more-btn");
            dynamicBtn.style.display = "block";
            dynamicBtn.style.margin = "20px auto";

            dynamicBtn.addEventListener("click", () => {
                currentPage++;
                renderProducts(currentFilter, currentPage);
            });

            allProductsBoard.appendChild(dynamicBtn);
        }

        setTimeout(observeCards, 50);
    }

    function agregarFila(usuario) {
        const fila = document.createElement("tr");

        fila.innerHTML = `
            <td>${usuario.nombre}</td>
            <td>${usuario.correo}</td>
            <td>${usuario.mensaje}</td>
            <td>${usuario.hora}</td>
            <td>${usuario.fecha}</td>
        `;

        fila.addEventListener("click", () => {
            document.querySelectorAll("tr").forEach(tr => tr.classList.remove("selected"));
            fila.classList.add("selected");
            filaSeleccionada = fila;
        });

        tableBody.appendChild(fila);
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nombre = document.getElementById("nombre").value;
        const correo = document.getElementById("correo").value;
        const mensaje = document.getElementById("mensaje").value;

        const usuario = new Usuario(nombre, correo, mensaje);
        await usuario.horaRegistro();

        try {
            const res = await fetch(`${API_BASE}/contacts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nombre: usuario.nombre,
                    correo: usuario.correo,
                    mensaje: usuario.mensaje,
                    fecha: usuario.fecha,
                    hora: usuario.hora
                })
            });
            if (res.ok) {
                const created = await res.json();
                usuario._id = created._id;
            }
        } catch (err) {
            console.warn("⚠️ No se pudo guardar el contacto:", err.message);
        }

        usuarios.push(usuario);
        agregarFila(usuario);
        form.reset();
    });

    deleteBtn.addEventListener("click", async () => {
        if (!filaSeleccionada) {
            alert("⚠️ Selecciona un contacto para eliminar.");
            return;
        }

        const index = Array.from(tableBody.children).indexOf(filaSeleccionada);
        const usuario = usuarios[index];

        if (usuario && usuario._id) {
            try {
                await fetch(`${API_BASE}/contacts/${usuario._id}`, { method: "DELETE" });
            } catch (err) {
                console.warn("⚠️ No se pudo eliminar el contacto:", err.message);
            }
        }

        usuarios.splice(index, 1);
        filaSeleccionada.remove();
        filaSeleccionada = null;

        alert("✅ Contacto eliminado correctamente.");
    });

    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            currentFilter = btn.dataset.filter;
            currentPage = 1;
            allTitle.textContent = titlesMap[currentFilter] || titlesMap.all;
            renderProducts(currentFilter, currentPage);
        });
    });

    modal.addEventListener("click", e => {
        if (e.target === modal || e.target.classList.contains("close")) {
            modal.classList.remove("show");
        }
    });

    allCards.forEach(card => {
        if (Math.random() < 0.15) card.classList.add("legendary");
    });

    window.addEventListener("scroll", () => {
        if (window.scrollY > 400) scrollTopBtn.classList.add("show");
        else scrollTopBtn.classList.remove("show");
    });

    scrollTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener("click", async () => {
            try {
                await fetch(`${API_BASE}/lastviewed`, { method: "DELETE" });
            } catch (err) {
                console.warn("⚠️ Error al limpiar historial:", err.message);
            }
            renderLastViewed({});
        });
    }

    async function initializeProducts() {
        let products = [];
        try {
            const res = await fetch(`${API_BASE}/products`);
            if (res.ok) products = await res.json();
        } catch (err) {
            console.warn("⚠️ No se pudieron cargar productos del servidor:", err.message);
        }

        if (!products || products.length === 0) {
            const productsToSave = [];
            allCards.forEach(card => {
                productsToSave.push({
                    title: card.dataset.title,
                    description: card.querySelector("p").textContent,
                    fullDescription: card.dataset.description,
                    category: card.dataset.category,
                    price: card.dataset.price,
                    seller: card.dataset.seller,
                    image: card.dataset.image
                });
            });

            for (const product of productsToSave) {
                try {
                    await fetch(`${API_BASE}/products`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(product)
                    });
                } catch (err) {
                    console.warn("⚠️ Error al migrar producto:", err.message);
                }
            }
            console.log(`✅ ${productsToSave.length} productos migrados al servidor`);
        } else {
            await syncProductsToDOM();
        }
    }

    document.querySelectorAll('.mission-card').forEach(card => {
        if (!card.querySelector('img') && card.dataset.image) {
            const img = document.createElement('img');
            img.src = card.dataset.image;
            img.alt = card.dataset.title || '';
            card.insertBefore(img, card.firstChild);
        }
    });

    initializeProducts().then(() => {
        attachModalEvents(allCards);
        renderFeatured();
        renderLastViewed();
        countProductsByCategory();
        renderProducts();
    });
    setInterval(renderFeatured, 180000);
    updateCartCount();
    setTimeout(observeCards, 200);

    const backgroundMusic = document.getElementById("backgroundMusic");
    
    if (backgroundMusic) {
        backgroundMusic.volume = 0.3;

        const playMusic = () => {
            backgroundMusic.play().catch(error => {
                console.log("⚠️ Reproducción automática bloqueada. Se reproducirá con la primera interacción.");
            });
        };
        
        document.addEventListener("click", playMusic, { once: true });
        document.addEventListener("keydown", playMusic, { once: true });
    }

    let screenReaderActive = false;
    let speechSynthesis = window.speechSynthesis;
    let currentUtterance = null;
    let speechRate = 1;
    
    const accessibilityBtn = document.getElementById("accessibilityBtn");
    const accessibilityMenu = document.getElementById("accessibilityMenu");
    const screenReaderToggle = document.getElementById("screenReaderToggle");
    const screenReaderStatus = document.getElementById("screenReaderStatus");
    const screenReaderControls = document.getElementById("screenReaderControls");
    const speechRateInput = document.getElementById("speechRate");
    const rateValue = document.getElementById("rateValue");
    const colorBlindFilter = document.getElementById("colorBlindFilter");
    const readingIndicator = document.getElementById("readingIndicator");
    const readingText = document.getElementById("readingText");
    
    let savedAccessibility = { screenReader: false, speechRate: 1, colorFilter: "none" };

    async function loadAccessibility() {
        try {
            const res = await fetch(`${API_BASE}/accessibility`);
            if (res.ok) {
                savedAccessibility = await res.json();
            }
        } catch (err) {
            console.warn("⚠️ No se pudo cargar configuración de accesibilidad:", err.message);
        }

        if (savedAccessibility.screenReader) {
            activateScreenReader();
        }
        if (speechRateInput) {
            speechRateInput.value = savedAccessibility.speechRate;
            speechRate = savedAccessibility.speechRate;
            if (rateValue) rateValue.textContent = `${speechRate}x`;
        }
        if (colorBlindFilter) {
            colorBlindFilter.value = savedAccessibility.colorFilter;
            applyColorFilter(savedAccessibility.colorFilter);
        }
    }

    async function saveAccessibility() {
        try {
            await fetch(`${API_BASE}/accessibility`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(savedAccessibility)
            });
        } catch (err) {
            console.warn("⚠️ No se pudo guardar configuración de accesibilidad:", err.message);
        }
    }

    loadAccessibility();
    
    if (accessibilityBtn) {
        accessibilityBtn.addEventListener("click", () => {
            accessibilityMenu.classList.toggle("hidden");
        });
    }
    
    document.addEventListener("click", (e) => {
        if (accessibilityMenu && !accessibilityMenu.contains(e.target) && e.target !== accessibilityBtn) {
            accessibilityMenu.classList.add("hidden");
        }
    });
    
    function activateScreenReader() {
        screenReaderActive = true;
        if (screenReaderStatus) screenReaderStatus.textContent = "⏸️ Desactivar";
        if (screenReaderControls) screenReaderControls.classList.remove("hidden");
        
        savedAccessibility.screenReader = true;
        saveAccessibility();
        
        speak("Lector de pantalla activado");
        
        enableHoverReading();
    }
    
    function deactivateScreenReader() {
        screenReaderActive = false;
        if (screenReaderStatus) screenReaderStatus.textContent = "▶️ Activar";
        if (screenReaderControls) screenReaderControls.classList.add("hidden");
        
        savedAccessibility.screenReader = false;
        saveAccessibility();
        
        stopSpeaking();
        
        disableHoverReading();
    }
    
    if (screenReaderToggle) {
        screenReaderToggle.addEventListener("click", () => {
            if (screenReaderActive) {
                deactivateScreenReader();
            } else {
                activateScreenReader();
            }
        });
    }
    
    if (speechRateInput) {
        speechRateInput.addEventListener("input", (e) => {
            speechRate = parseFloat(e.target.value);
            if (rateValue) rateValue.textContent = `${speechRate}x`;
            
            savedAccessibility.speechRate = speechRate;
            saveAccessibility();
        });
    }
    
    function speak(text) {
        if (!screenReaderActive) return;
        
        stopSpeaking();
        
        currentUtterance = new SpeechSynthesisUtterance(text);
        currentUtterance.rate = speechRate;
        currentUtterance.lang = 'es-ES';
        
        if (readingIndicator) {
            readingIndicator.classList.remove("hidden");
            if (readingText) readingText.textContent = `Leyendo: ${text.substring(0, 30)}...`;
        }
        
        currentUtterance.onend = () => {
            if (readingIndicator) readingIndicator.classList.add("hidden");
        };
        
        currentUtterance.onerror = () => {
            if (readingIndicator) readingIndicator.classList.add("hidden");
        };
        
        speechSynthesis.speak(currentUtterance);
    }
    
    function stopSpeaking() {
        speechSynthesis.cancel();
        if (readingIndicator) readingIndicator.classList.add("hidden");
    }
    
    function enableHoverReading() {
        const buttons = document.querySelectorAll("button, .auth-btn, .logout-btn, .admin-btn, .cart-btn, .notification-btn");
        buttons.forEach(btn => {
            btn.addEventListener("mouseenter", handleButtonHover);
        });
        
        const cards = document.querySelectorAll(".mission-card");
        cards.forEach(card => {
            card.addEventListener("mouseenter", handleCardHover);
        });
        
        const links = document.querySelectorAll("a");
        links.forEach(link => {
            link.addEventListener("mouseenter", handleLinkHover);
        });
        
        const inputs = document.querySelectorAll("input, textarea, select");
        inputs.forEach(input => {
            input.addEventListener("focus", handleInputFocus);
        });
    }
    
    function disableHoverReading() {
        const buttons = document.querySelectorAll("button, .auth-btn, .logout-btn, .admin-btn, .cart-btn, .notification-btn");
        buttons.forEach(btn => {
            btn.removeEventListener("mouseenter", handleButtonHover);
        });
        
        const cards = document.querySelectorAll(".mission-card");
        cards.forEach(card => {
            card.removeEventListener("mouseenter", handleCardHover);
        });
        
        const links = document.querySelectorAll("a");
        links.forEach(link => {
            link.removeEventListener("mouseenter", handleLinkHover);
        });
        
        const inputs = document.querySelectorAll("input, textarea, select");
        inputs.forEach(input => {
            input.removeEventListener("focus", handleInputFocus);
        });
    }
    
    function handleButtonHover(e) {
        const text = e.target.textContent.trim() || e.target.getAttribute("aria-label") || "Botón";
        speak(`Botón: ${text}`);
    }
    
    function handleCardHover(e) {
        const title = e.currentTarget.dataset.title || e.currentTarget.querySelector("h3")?.textContent || "Producto";
        const price = e.currentTarget.dataset.price || e.currentTarget.querySelector("span")?.textContent || "";
        speak(`Producto: ${title}. Precio: ${price}`);
    }
    
    function handleLinkHover(e) {
        const text = e.target.textContent.trim();
        speak(`Enlace: ${text}`);
    }
    
    function handleInputFocus(e) {
        const label = e.target.placeholder || e.target.getAttribute("aria-label") || "Campo de texto";
        speak(`Campo: ${label}`);
    }
    
    function announceAction(message) {
        if (screenReaderActive) {
            setTimeout(() => speak(message), 300);
        }
    }
    
    const originalAddToCart = window.addToCart || addToCart;
    window.addToCart = function(product) {
        const result = originalAddToCart ? originalAddToCart(product) : addToCart(product);
        announceAction(`${product.title} agregado al carrito`);
        return result;
    };
    
    function applyColorFilter(filterType) {
        const target = document.getElementById("pageWrapper") || document.body;

        target.classList.remove(
            "filter-protanopia",
            "filter-deuteranopia",
            "filter-tritanopia",
            "filter-achromatopsia",
            "filter-high-contrast"
        );

        if (filterType !== "none") {
            target.classList.add(`filter-${filterType}`);
        }

        savedAccessibility.colorFilter = filterType;
        saveAccessibility();
        
        const filterNames = {
            "none": "Sin filtro",
            "protanopia": "Protanopia",
            "deuteranopia": "Deuteranopia",
            "tritanopia": "Tritanopia",
            "achromatopsia": "Acromatopsia",
            "high-contrast": "Alto Contraste"
        };
        announceAction(`Filtro aplicado: ${filterNames[filterType]}`);
    }
    
    if (colorBlindFilter) {
        colorBlindFilter.addEventListener("change", (e) => {
            applyColorFilter(e.target.value);
        });
    }

    const FRANCHISE_ALIASES_GLOBAL = {
        "harry potter": "harry potter", "hogwarts": "harry potter", "voldemort": "harry potter",
        "varita": "harry potter", "sombrero seleccionador": "harry potter",
        "señor de los anillos": "el señor de los anillos", "lord of the rings": "el señor de los anillos",
        "lotr": "el señor de los anillos", "tolkien": "el señor de los anillos",
        "aragorn": "el señor de los anillos", "legolas": "el señor de los anillos",
        "mordor": "el señor de los anillos", "anillo unico": "el señor de los anillos",
        "anduril": "el señor de los anillos", "marvel": "marvel", "avengers": "marvel",
        "iron man": "marvel", "ironman": "marvel", "spiderman": "marvel",
        "spider-man": "marvel", "spider man": "marvel", "capitan america": "marvel",
        "thor": "marvel", "deadpool": "marvel", "vibranium": "marvel",
        "stark industries": "marvel", "mark 85": "marvel", "asgard": "marvel",
        "runas asgard": "marvel", "batman": "batman", "wayne": "batman",
        "batarang": "batman", "gotham": "batman", "dc": "dc comics",
        "aquaman": "dc comics", "tridente": "dc comics", "atlantis": "dc comics",
        "star wars": "star wars", "starwars": "star wars", "jedi": "star wars",
        "sith": "star wars", "darth": "star wars", "vader": "star wars",
        "mandalorian": "star wars", "mando": "star wars", "beskar": "star wars",
        "sable de luz": "star wars", "volver al futuro": "volver al futuro",
        "back to the future": "volver al futuro", "delorean": "volver al futuro",
        "doc brown": "volver al futuro", "hoverboard": "volver al futuro",
        "hill valley": "volver al futuro", "scream": "scream", "ghostface": "scream",
        "woodsboro": "scream", "indiana jones": "indiana jones", "indy": "indiana jones",
        "latigo": "indiana jones", "top gun": "top gun", "maverick": "top gun",
        "aviador": "top gun", "stranger things": "stranger things", "hawkins": "stranger things",
        "breaking bad": "breaking bad", "heisenberg": "breaking bad", "walter white": "breaking bad",
        "the boys": "the boys", "suero v": "the boys", "vought": "the boys",
        "compuesto": "the boys", "game of thrones": "game of thrones", "got": "game of thrones",
        "westeros": "game of thrones", "trono de hierro": "game of thrones",
        "trono": "game of thrones", "rick and morty": "rick and morty",
        "rick morty": "rick and morty", "portal": "rick and morty",
        "walking dead": "the walking dead", "daryl": "the walking dead",
        "zombie": "the walking dead", "ballesta": "the walking dead",
        "alexandria": "the walking dead", "peaky blinders": "peaky blinders",
        "shelby": "peaky blinders", "thomas shelby": "peaky blinders",
        "dragon ball": "dragon ball", "dragonball": "dragon ball", "goku": "dragon ball",
        "vegeta": "dragon ball", "esfera": "dragon ball", "saiyajin": "dragon ball",
        "capsule corp": "dragon ball", "naruto": "naruto", "konoha": "naruto",
        "akatsuki": "naruto", "ninja": "naruto", "aldea de la hoja": "naruto",
        "one piece": "one piece", "onepiece": "one piece", "zoro": "one piece",
        "luffy": "one piece", "grand line": "one piece", "espadachin": "one piece",
        "attack on titan": "attack on titan", "aot": "attack on titan",
        "shingeki": "attack on titan", "titan": "attack on titan",
        "exploracion": "attack on titan", "paradis": "attack on titan",
        "legion": "attack on titan", "bleach": "bleach", "ichigo": "bleach",
        "zanpakuto": "bleach", "soul society": "bleach", "shikai": "bleach",
        "pokemon": "pokemon", "pokémon": "pokemon", "pikachu": "pokemon",
        "pokebola": "pokemon", "pokemart": "pokemon", "demon slayer": "demon slayer",
        "kimetsu": "demon slayer", "tanjiro": "demon slayer", "nichirin": "demon slayer",
        "cazador de demonios": "demon slayer", "death note": "death note",
        "kira": "death note", "ryuk": "death note", "shinigami": "death note",
        "zelda": "zelda", "link": "zelda", "hyrule": "zelda",
        "espada maestra": "zelda", "escudo hyliano": "zelda", "majora": "zelda",
        "god of war": "god of war", "kratos": "god of war", "leviatan": "god of war",
        "midgard": "god of war", "halo": "halo", "master chief": "halo",
        "spartan": "halo", "unsc": "halo", "witcher": "the witcher",
        "geralt": "the witcher", "brujo": "the witcher", "kaer morhen": "the witcher",
        "kingdom hearts": "kingdom hearts", "sora": "kingdom hearts",
        "llave espada": "kingdom hearts", "corazones": "kingdom hearts",
        "fallout": "fallout", "pip-boy": "fallout", "pipboy": "fallout",
        "vault-tec": "fallout", "yermo": "fallout", "assassins creed": "assassins creed",
        "assassin": "assassins creed", "hoja oculta": "assassins creed",
        "hermandad de asesinos": "assassins creed", "doom": "doom",
        "doom slayer": "doom", "uac": "doom"
    };

    function _normStrGlobal(s) {
        return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    }

    const IMAGE_FRANCHISE_MAP = {
        "harry.png":             "harry potter",
        "voldemort.png":         "harry potter",
        "sombrero.png":          "harry potter",
        "aragorn.png":           "el señor de los anillos",
        "legolas.png":           "el señor de los anillos",
        "mordor.png":            "el señor de los anillos",
        "back.png":              "volver al futuro",
        "mjolnir.png":           "marvel",
        "deadpool.png":          "marvel",
        "mark85.png":            "marvel",
        "edith.png":             "marvel",
        "escudo.png":            "marvel",
        "capa.png":              "naruto",
        "batarang.png":          "batman",
        "tridente.png":          "dc comics",
        "sable.png":             "star wars",
        "sable-rojo.png":        "star wars",
        "beskar.png":            "star wars",
        "delorean.png":          "volver al futuro",
        "ghostface.png":         "scream",
        "indieana.png":          "indiana jones",
        "topgun.png":            "top gun",
        "chaqueta.png":          "stranger things",
        "banda.png":             "stranger things",
        "heisenbergh.png":       "breaking bad",
        "compuestov.png":        "the boys",
        "trono.png":             "game of thrones",
        "rick.png":              "rick and morty",
        "daryl.png":             "the walking dead",
        "shelby.png":            "peaky blinders",
        "goku.png":              "dragon ball",
        "esferasdeldragon.png":  "dragon ball",
        "attack.png":            "attack on titan",
        "zanpakuto-shikai.png":  "bleach",
        "pokebola.png":          "pokemon",
        "tanjiro.png":           "demon slayer",
        "deathnote.png":         "death note",
        "espada-sagrada-hyrule.png": "zelda",
        "escudolink.png":        "zelda",
        "mascaramajora.png":     "zelda",
        "espadasdelcaos.png":    "god of war",
        "leviatan.png":          "god of war",
        "masterchief.png":       "halo",
        "geralt.png":            "the witcher",
        "medallon-del-brujo.png": "the witcher",
        "llave-espada.png":      "kingdom hearts",
        "pipboy.png":            "fallout",
        "hoja-oculta.png":       "assassins creed",
        "mascara.png":           "batman",
        "doom.png":              "doom",
        "zoro.png":              "one piece",
    };

    function inferFranchise(title, description, image) {
        const imgKey = (image || "").split("/").pop().toLowerCase();
        if (IMAGE_FRANCHISE_MAP[imgKey]) return IMAGE_FRANCHISE_MAP[imgKey];

        const combined = _normStrGlobal(title + " " + description);
        const aliases = Object.keys(FRANCHISE_ALIASES_GLOBAL).sort((a, b) => b.length - a.length);
        for (const alias of aliases) {
            if (combined.includes(_normStrGlobal(alias))) {
                return FRANCHISE_ALIASES_GLOBAL[alias];
            }
        }
        return "";
    }

    (function initChatbot(sourceCards) {
        const widget      = document.getElementById("chatbotWidget");
        const bubble      = document.getElementById("chatbotBubble");
        const chatWindow  = document.getElementById("chatbotWindow");
        const messagesEl  = document.getElementById("chatbotMessages");
        const optionsEl   = document.getElementById("chatbotOptions");
        const inputEl     = document.getElementById("chatbotInput");
        const sendBtn     = document.getElementById("chatbotSend");
        const minimizeBtn = document.getElementById("chatbotMinimize");
        const closeBtn    = document.getElementById("chatbotClose");
        const unreadBadge = document.getElementById("chatbotUnread");

        if (!widget) return;

        function getChatbotProducts() {
            const seenTitles = new Set();
            return allCards
                .filter(c => {
                    if (!c.dataset || !c.dataset.title || !c.dataset.category) return false;
                    if (seenTitles.has(c.dataset.title)) return false;
                    seenTitles.add(c.dataset.title);
                    return true;
                })
                .map(c => ({
                    title:       c.dataset.title       || "",
                    category:    c.dataset.category    || "",
                    description: c.dataset.description || "",
                    price:       c.dataset.price       || "",
                    seller:      c.dataset.seller      || "",
                    image:       c.dataset.image       || "",
                    franchise:   c.dataset.franchise   || ""
                }));
        }

        const CATEGORY_MAP = {
            peliculas:   "🎬 Películas",
            series:      "📺 Series",
            anime:       "🍥 Anime",
            videojuegos: "🎮 Videojuegos"
        };

        function normStr(s) {
            return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        }

        function parsePrice(priceStr) {
            const digits = (priceStr || "").replace(/[^0-9]/g, "");
            return digits ? parseInt(digits, 10) : 0;
        }

        function isPriceQuery(query) {
            const q = normStr(query);
            const hasDigits = /\d{3,}/.test(q);
            const hasPriceWord = ["precio","cuesta","vale","cuanto","barato","economico",
                "rango","pesos","mxn","menos de","hasta ","a "].some(w => q.includes(w));
            const isRange = /\d+\s*(a|-|hasta)\s*\d+/.test(q);
            return hasDigits && (hasPriceWord || isRange);
        }

        function searchByPrice(query) {
            const q = normStr(query);
            const nums = (q.match(/\d+/g) || []).map(Number);
            if (!nums.length) return [];
            const products = getChatbotProducts();
            if (nums.length >= 2) {
                const lo = Math.min(nums[0], nums[1]);
                const hi = Math.max(nums[0], nums[1]);
                return products.filter(p => {
                    const pr = parsePrice(p.price);
                    return pr >= lo && pr <= hi;
                });
            }
            const target = nums[0];
            if (["menos","hasta","maximo","no mas"].some(w => q.includes(w))) {
                return products.filter(p => parsePrice(p.price) <= target);
            }
            const margin = Math.round(target * 0.25);
            return products.filter(p => {
                const pr = parsePrice(p.price);
                return pr >= target - margin && pr <= target + margin;
            });
        }

        const FRANCHISE_ALIASES = {
            "harry potter":            "harry potter",
            "hogwarts":                "harry potter",
            "voldemort":               "harry potter",
            "varita":                  "harry potter",
            "sombrero seleccionador":  "harry potter",
            "señor de los anillos":    "el señor de los anillos",
            "lord of the rings":       "el señor de los anillos",
            "lotr":                    "el señor de los anillos",
            "tolkien":                 "el señor de los anillos",
            "aragorn":                 "el señor de los anillos",
            "legolas":                 "el señor de los anillos",
            "mordor":                  "el señor de los anillos",
            "anillo unico":            "el señor de los anillos",
            "anduril":                 "el señor de los anillos",
            "marvel":                  "marvel",
            "avengers":                "marvel",
            "iron man":                "marvel",
            "ironman":                 "marvel",
            "spiderman":               "marvel",
            "spider-man":              "marvel",
            "spider man":              "marvel",
            "capitan america":         "marvel",
            "thor":                    "marvel",
            "deadpool":                "marvel",
            "vibranium":               "marvel",
            "stark industries":        "marvel",
            "mark 85":                 "marvel",
            "asgard":                  "marvel",
            "runas asgard":            "marvel",
            "batman":                  "batman",
            "wayne":                   "batman",
            "batarang":                "batman",
            "gotham":                  "batman",
            "dc":                      "dc comics",
            "aquaman":                 "dc comics",
            "tridente":                "dc comics",
            "atlantis":                "dc comics",
            "star wars":               "star wars",
            "starwars":                "star wars",
            "jedi":                    "star wars",
            "sith":                    "star wars",
            "darth":                   "star wars",
            "vader":                   "star wars",
            "mandalorian":             "star wars",
            "mando":                   "star wars",
            "beskar":                  "star wars",
            "sable de luz":            "star wars",
            "volver al futuro":        "volver al futuro",
            "back to the future":      "volver al futuro",
            "delorean":                "volver al futuro",
            "doc brown":               "volver al futuro",
            "hoverboard":              "volver al futuro",
            "hill valley":             "volver al futuro",
            "scream":                  "scream",
            "ghostface":               "scream",
            "woodsboro":               "scream",
            "indiana jones":           "indiana jones",
            "indy":                    "indiana jones",
            "latigo":                  "indiana jones",
            "top gun":                 "top gun",
            "maverick":                "top gun",
            "aviador":                 "top gun",
            "stranger things":         "stranger things",
            "hawkins":                 "stranger things",
            "breaking bad":            "breaking bad",
            "heisenberg":              "breaking bad",
            "walter white":            "breaking bad",
            "the boys":                "the boys",
            "suero v":                 "the boys",
            "vought":                  "the boys",
            "compuesto":               "the boys",
            "game of thrones":         "game of thrones",
            "got":                     "game of thrones",
            "westeros":                "game of thrones",
            "trono de hierro":         "game of thrones",
            "trono":                   "game of thrones",
            "rick and morty":          "rick and morty",
            "rick morty":              "rick and morty",
            "portal":                  "rick and morty",
            "walking dead":            "the walking dead",
            "daryl":                   "the walking dead",
            "zombie":                  "the walking dead",
            "ballesta":                "the walking dead",
            "alexandria":              "the walking dead",
            "peaky blinders":          "peaky blinders",
            "shelby":                  "peaky blinders",
            "thomas shelby":           "peaky blinders",
            "dragon ball":             "dragon ball",
            "dragonball":              "dragon ball",
            "goku":                    "dragon ball",
            "vegeta":                  "dragon ball",
            "esfera":                  "dragon ball",
            "saiyajin":                "dragon ball",
            "capsule corp":            "dragon ball",
            "naruto":                  "naruto",
            "konoha":                  "naruto",
            "akatsuki":                "naruto",
            "ninja":                   "naruto",
            "aldea de la hoja":        "naruto",
            "one piece":               "one piece",
            "onepiece":                "one piece",
            "zoro":                    "one piece",
            "luffy":                   "one piece",
            "grand line":              "one piece",
            "espadachin":              "one piece",
            "attack on titan":         "attack on titan",
            "aot":                     "attack on titan",
            "shingeki":                "attack on titan",
            "titan":                   "attack on titan",
            "exploracion":             "attack on titan",
            "paradis":                 "attack on titan",
            "legion":                  "attack on titan",
            "bleach":                  "bleach",
            "ichigo":                  "bleach",
            "zanpakuto":               "bleach",
            "soul society":            "bleach",
            "shikai":                  "bleach",
            "pokemon":                 "pokemon",
            "pokémon":                 "pokemon",
            "pikachu":                 "pokemon",
            "pokebola":                "pokemon",
            "pokemart":                "pokemon",
            "demon slayer":            "demon slayer",
            "kimetsu":                 "demon slayer",
            "tanjiro":                 "demon slayer",
            "nichirin":                "demon slayer",
            "cazador de demonios":     "demon slayer",
            "death note":              "death note",
            "kira":                    "death note",
            "ryuk":                    "death note",
            "shinigami":               "death note",
            "zelda":                   "zelda",
            "link":                    "zelda",
            "hyrule":                  "zelda",
            "espada maestra":          "zelda",
            "escudo hyliano":          "zelda",
            "majora":                  "zelda",
            "god of war":              "god of war",
            "kratos":                  "god of war",
            "leviatan":                "god of war",
            "midgard":                 "god of war",
            "halo":                    "halo",
            "master chief":            "halo",
            "spartan":                 "halo",
            "unsc":                    "halo",
            "witcher":                 "the witcher",
            "geralt":                  "the witcher",
            "brujo":                   "the witcher",
            "kaer morhen":             "the witcher",
            "kingdom hearts":          "kingdom hearts",
            "sora":                    "kingdom hearts",
            "llave espada":            "kingdom hearts",
            "corazones":               "kingdom hearts",
            "fallout":                 "fallout",
            "pip-boy":                 "fallout",
            "pipboy":                  "fallout",
            "vault-tec":               "fallout",
            "yermo":                   "fallout",
            "assassins creed":         "assassins creed",
            "assassin":                "assassins creed",
            "hoja oculta":             "assassins creed",
            "hermandad de asesinos":   "assassins creed",
            "doom":                    "doom",
            "doom slayer":             "doom",
            "uac":                     "doom"
        };

        function inferFranchiseChatbot(title, description, image) {
            const imgKey = (image || "").split("/").pop().toLowerCase();
            const IMAGE_FRANCHISE_MAP_LOCAL = {
                "harry.png": "harry potter", "voldemort.png": "harry potter", "sombrero.png": "harry potter",
                "aragorn.png": "el señor de los anillos", "legolas.png": "el señor de los anillos", "mordor.png": "el señor de los anillos",
                "back.png": "volver al futuro", "mjolnir.png": "marvel", "deadpool.png": "marvel",
                "mark85.png": "marvel", "edith.png": "marvel", "escudo.png": "marvel",
                "capa.png": "naruto", "batarang.png": "batman", "tridente.png": "dc comics",
                "sable.png": "star wars", "sable-rojo.png": "star wars", "beskar.png": "star wars",
                "delorean.png": "volver al futuro", "ghostface.png": "scream", "indieana.png": "indiana jones",
                "topgun.png": "top gun", "chaqueta.png": "stranger things", "banda.png": "stranger things",
                "heisenbergh.png": "breaking bad", "compuestov.png": "the boys", "trono.png": "game of thrones",
                "rick.png": "rick and morty", "daryl.png": "the walking dead", "shelby.png": "peaky blinders",
                "goku.png": "dragon ball", "esferasdeldragon.png": "dragon ball", "attack.png": "attack on titan",
                "zanpakuto-shikai.png": "bleach", "pokebola.png": "pokemon", "tanjiro.png": "demon slayer",
                "deathnote.png": "death note", "espada-sagrada-hyrule.png": "zelda", "escudolink.png": "zelda",
                "mascaramajora.png": "zelda", "espadasdelcaos.png": "god of war", "leviatan.png": "god of war",
                "masterchief.png": "halo", "geralt.png": "the witcher", "medallon-del-brujo.png": "the witcher",
                "llave-espada.png": "kingdom hearts", "pipboy.png": "fallout", "hoja-oculta.png": "assassins creed",
                "mascara.png": "assassins creed", "doom.png": "doom", "zoro.png": "one piece"
            };
            if (IMAGE_FRANCHISE_MAP_LOCAL[imgKey]) return IMAGE_FRANCHISE_MAP_LOCAL[imgKey];
            const combined = normStr(title + " " + description);
            const aliases = Object.keys(FRANCHISE_ALIASES).sort((a, b) => b.length - a.length);
            for (const alias of aliases) {
                if (combined.includes(normStr(alias))) return FRANCHISE_ALIASES[alias];
            }
            return "";
        }

        function searchProducts(query) {
            const q = normStr(query);
            const matched = new Map();

            let targetFranchise = null;
            const sortedAliases = Object.entries(FRANCHISE_ALIASES)
                .sort((a, b) => b[0].length - a[0].length);
            for (const [alias, franchise] of sortedAliases) {
                const aliasN = normStr(alias);
                if (q === aliasN || q.includes(aliasN) || aliasN.includes(q)) {
                    targetFranchise = normStr(franchise);
                    break;
                }
            }

            getChatbotProducts().forEach(p => {
                const tn = normStr(p.title);
                const dn = normStr(p.description);

                // Usar el franchise del dataset; si está vacío, inferirlo en tiempo real
                const fn = normStr(p.franchise) || normStr(inferFranchiseChatbot(p.title, p.description, p.image));

                if (targetFranchise) {
                    // Coincidencia directa por campo franchise (normalizado)
                    const matchesFranchise = fn === targetFranchise || fn.includes(targetFranchise) || targetFranchise.includes(fn) && fn.length > 2;

                    // Coincidencia por keywords de la franquicia en título o descripción
                    const franchiseAliases = sortedAliases
                        .filter(([, f]) => normStr(f) === targetFranchise)
                        .map(([a]) => normStr(a));
                    const matchesText = franchiseAliases.some(kw => tn.includes(kw) || dn.includes(kw));

                    if (matchesFranchise || matchesText) {
                        if (!matched.has(p.title)) matched.set(p.title, p);
                    }
                } else {
                    if (tn.includes(q) || q.includes(tn) || dn.includes(q)) {
                        if (!matched.has(p.title)) matched.set(p.title, p);
                    }
                }
            });

            return Array.from(matched.values());
        }

        function detectCategory(query) {
            const q = normStr(query);
            if (["peliculas","pelicula","cine","film","movie"].some(w => q === w || q.includes(w))) return "peliculas";
            if (["series","serie","tv","television","show"].some(w => q === w || q.includes(w))) return "series";
            if (["anime","manga"].some(w => q === w || q.includes(w))) return "anime";
            if (["videojuegos","videojuego","game","gaming","juego","consola"].some(w => q === w || q.includes(w))) return "videojuegos";
            return null;
        }

        function msgTime() {
            return new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
        }

        function addMessage(text, sender, products) {
            const wrap = document.createElement("div");
            wrap.className = "chatbot-msg " + sender;
            const bbl = document.createElement("div");
            bbl.className = "chatbot-msg-bubble";
            bbl.innerHTML = text.replace(/\n/g, "<br>");
            wrap.appendChild(bbl);

            if (products && products.length) {
                products.forEach(p => {
                    const card = document.createElement("div");
                    card.className = "chatbot-product-card";
                    const imgSrc = p.image;
                    const fallback = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' fill='%23f5f5f7'/%3E%3C/svg%3E";
                    card.innerHTML = '<img src="' + imgSrc + '" alt="' + p.title + '" onerror="this.src=\'' + fallback + '\'">' +
                        '<div class="chatbot-product-card-info"><strong>' + p.title + '</strong><span>' + p.price + '</span></div>';
                    card.addEventListener("click", () => {
                        bubble.style.display = "flex";
                        chatWindow.classList.add("hidden");
                        const pageCards = document.querySelectorAll(".mission-card");
                        for (const c of pageCards) {
                            if (c.dataset.title === p.title) {
                                c.scrollIntoView({ behavior: "smooth", block: "center" });
                                c.style.boxShadow = "0 0 0 3px #0071e3";
                                setTimeout(() => { c.style.boxShadow = ""; }, 2500);
                                setTimeout(() => c.click(), 400);
                                break;
                            }
                        }
                    });
                    wrap.appendChild(card);
                });
            }

            const timeEl = document.createElement("div");
            timeEl.className = "chatbot-msg-time";
            timeEl.textContent = msgTime();
            wrap.appendChild(timeEl);
            messagesEl.appendChild(wrap);
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }

        function showTyping() {
            const t = document.createElement("div");
            t.className = "chatbot-msg bot";
            t.id = "chatbotTyping";
            t.innerHTML = '<div class="chatbot-typing"><span></span><span></span><span></span></div>';
            messagesEl.appendChild(t);
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }

        function removeTyping() {
            const t = document.getElementById("chatbotTyping");
            if (t) t.remove();
        }

        function setOptions(opts) {
            optionsEl.innerHTML = "";
            opts.forEach(o => {
                const btn = document.createElement("button");
                btn.className = "chatbot-option-btn";
                btn.textContent = o.label;
                btn.addEventListener("click", () => {
                    addMessage(o.label, "user");
                    setOptions([]);
                    setTimeout(() => processInput(o.value || o.label), 400);
                });
                optionsEl.appendChild(btn);
            });
        }

        function mainMenu() {
            return [
                { label: "🎬 Películas",           value: "__cat_peliculas" },
                { label: "📺 Series",              value: "__cat_series" },
                { label: "🍥 Anime",               value: "__cat_anime" },
                { label: "🎮 Videojuegos",         value: "__cat_videojuegos" },
                { label: "🔍 Buscar producto",     value: "__buscar" },
                { label: "⭐ Lo más popular",      value: "__popular" },
                { label: "💰 Ver descuentos",      value: "__descuentos" },
                { label: "ℹ️ Quiénes somos",       value: "__quienes" },
                { label: "🤖 ¿Quién eres tú?",    value: "__whoisbot" }
            ];
        }

        function afterReplyOptions() {
            setOptions([
                { label: "🎬 Películas",            value: "__cat_peliculas" },
                { label: "📺 Series",               value: "__cat_series" },
                { label: "🍥 Anime",                value: "__cat_anime" },
                { label: "🎮 Videojuegos",          value: "__cat_videojuegos" },
                { label: "🔍 Buscar otro producto", value: "__buscar" },
                { label: "⭐ Lo más popular",       value: "__popular" },
                { label: "💰 Ver descuentos",       value: "__descuentos" },
                { label: "🏠 Menú principal",       value: "__menu" }
            ]);
        }

        function showCategoryList(cat) {
            const products = getChatbotProducts().filter(p => p.category === cat);
            const label = CATEGORY_MAP[cat];
            if (!products.length) {
                addMessage("Aún no tenemos productos en " + label + ". ¡Próximamente!", "bot");
                afterReplyOptions();
                return;
            }
            addMessage("Tenemos <strong>" + products.length + " productos</strong> en " + label + ". ¡Aquí los tienes todos!", "bot", products);
            afterReplyOptions();
        }

        function botReply(userInput) {
            showTyping();
            const q = normStr(userInput);

            setTimeout(() => {
                removeTyping();

                if (q === "__cat_peliculas")   { showCategoryList("peliculas");   return; }
                if (q === "__cat_series")      { showCategoryList("series");      return; }
                if (q === "__cat_anime")       { showCategoryList("anime");       return; }
                if (q === "__cat_videojuegos") { showCategoryList("videojuegos"); return; }

                if (q === "__menu") {
                    addMessage("Aquí tienes el menú principal, ¿qué deseas explorar?", "bot");
                    setOptions(mainMenu());
                    return;
                }

                if (q === "__buscar") {
                    addMessage("Claro, ¿qué producto o franquicia estás buscando? 🔍\nEscribe el nombre, la franquicia, o un rango de precios como \"500 a 1500\".", "bot");
                    setOptions([]);
                    return;
                }

                if (q === "__descuentos" || q.includes("descuento") || q.includes("cupon") || q.includes("codigo") || q.includes("oferta") || q.includes("promo")) {
                    addMessage("¡Sí! Tenemos estos descuentos:\n\n🎉 <strong>NUEVOUSUARIO10</strong> — 10% en tu primera compra\n🏷️ <strong>MULTIVERSO15</strong> — 15% en cualquier producto\n🛒 <strong>RELIQUIAS20</strong> — 20% (máximo 50 usos)\n\nCanjéalos al abrir el carrito 🛒", "bot");
                    afterReplyOptions();
                    return;
                }

                if (q === "__popular" || q.includes("popular") || q.includes("recomendado") || q.includes("destacado") || q.includes("mejor")) {
                    const cats = ["peliculas", "series", "anime", "videojuegos"];
                    const popular = [];
                    const usedCats = new Set();
                    const shuffled = [...getChatbotProducts()].sort(() => 0.5 - Math.random());
                    shuffled.forEach(p => {
                        if (popular.length < 4 && !usedCats.has(p.category)) {
                            popular.push(p);
                            usedCats.add(p.category);
                        }
                    });
                    addMessage("⭐ Aquí están algunos productos destacados del momento:", "bot", popular);
                    afterReplyOptions();
                    return;
                }

                if (q === "__quienes" || q.includes("quienes son") || q.includes("quienes somos") || q.includes("sobre ustedes") || q.includes("acerca") || q.includes("informacion") || q.includes("cueva del multiverso")) {
                    const counts = {};
                    getChatbotProducts().forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
                    addMessage("🕳️ <strong>La Cueva del Multiverso</strong> somos una tienda de réplicas y merchandising de colección.\n\nNuestro catálogo:\n🎬 Películas — " + (counts.peliculas || 0) + " productos\n📺 Series — " + (counts.series || 0) + " productos\n🍥 Anime — " + (counts.anime || 0) + " productos\n🎮 Videojuegos — " + (counts.videojuegos || 0) + " productos\n\n📱 WhatsApp: +52 1 562 972 7628\n📧 info@cuevadelmultiverso.com", "bot");
                    afterReplyOptions();
                    return;
                }

                if (q === "__whoisbot" || q.includes("quien eres") || q.includes("como te llamas") || q.includes("eres un bot") || q.includes("r2-d2") || q === "r2") {
                    addMessage("¡Beep boop! 🤖 Soy <strong>R2-D2</strong>, el asistente de La Cueva del Multiverso.\n\nPuedo mostrarte el catálogo por categoría, buscar por nombre, franquicia o rango de precios.\n\n¡Pregúntame lo que quieras!", "bot");
                    afterReplyOptions();
                    return;
                }

                const greetings = ["hola","hi","buenas","hey","saludos","buenos dias","buenas tardes","buenas noches","ola","hello"];
                if (greetings.some(g => q === g || q.startsWith(g + " ") || q.endsWith(" " + g))) {
                    addMessage("¡Hola! Soy <strong>R2-D2</strong>, el asistente de La Cueva del Multiverso 🤖\n¿En qué puedo ayudarte hoy?", "bot");
                    setOptions(mainMenu());
                    return;
                }

                const thankyou = ["gracias","thank","genial","perfecto","excelente","ok","bien","listo","chevere"];
                if (thankyou.some(t => q === t || q.startsWith(t))) {
                    addMessage("¡De nada! ¿Hay algo más en lo que pueda ayudarte? 😊", "bot");
                    afterReplyOptions();
                    return;
                }

                const bye = ["adios","bye","hasta luego","nos vemos","chao","chau","hasta pronto"];
                if (bye.some(b => q === b || q.startsWith(b))) {
                    addMessage("¡Hasta luego! Que la Fuerza te acompañe 🚀", "bot");
                    setOptions([]);
                    return;
                }

                if (isPriceQuery(userInput)) {
                    const priceResults = searchByPrice(userInput);
                    if (priceResults.length) {
                        addMessage("Encontré <strong>" + priceResults.length + " producto(s)</strong> en ese rango de precio:", "bot", priceResults);
                    } else {
                        addMessage("No encontré productos en ese rango. Nuestros productos van de $400 a $3500 MXN.\n¿Quieres explorar por categoría?", "bot");
                    }
                    afterReplyOptions();
                    return;
                }

                const catFromQuery = detectCategory(q);
                if (catFromQuery) {
                    showCategoryList(catFromQuery);
                    return;
                }

                const found = searchProducts(userInput);
                if (found.length === 1) {
                    addMessage("¡Encontré exactamente lo que buscas! Tenemos el <strong>" + found[0].title + "</strong> — " + found[0].description + " a solo " + found[0].price + " 🎉\n\nHaz clic en la tarjeta para verlo en la tienda.", "bot", found);
                    afterReplyOptions();
                } else if (found.length > 1) {
                    addMessage("Encontré <strong>" + found.length + " producto(s)</strong> relacionados con tu búsqueda:", "bot", found);
                    afterReplyOptions();
                } else {
                    addMessage("Lo siento, no encontré productos relacionados a eso 😔\n¿Quieres explorar nuestras categorías?", "bot");
                    setOptions([
                        { label: "🎬 Películas",       value: "__cat_peliculas" },
                        { label: "📺 Series",          value: "__cat_series" },
                        { label: "🍥 Anime",           value: "__cat_anime" },
                        { label: "🎮 Videojuegos",     value: "__cat_videojuegos" },
                        { label: "⭐ Lo más popular",  value: "__popular" },
                        { label: "🏠 Menú principal",  value: "__menu" }
                    ]);
                }
            }, 800);
        }

        function processInput(text) {
            const trimmed = text.trim();
            if (!trimmed) return;
            botReply(trimmed);
        }

        function openChat() {
            chatWindow.classList.remove("hidden");
            chatWindow.classList.remove("minimized");
            unreadBadge.classList.add("hidden");
            bubble.style.display = "none";
            inputEl.focus();
        }

        function closeChat() {
            chatWindow.classList.add("hidden");
            bubble.style.display = "flex";
        }

        function minimizeChat() {
            chatWindow.classList.toggle("minimized");
        }

        bubble.addEventListener("click", openChat);
        closeBtn.addEventListener("click", closeChat);
        minimizeBtn.addEventListener("click", minimizeChat);

        sendBtn.addEventListener("click", () => {
            const val = inputEl.value.trim();
            if (!val) return;
            addMessage(val, "user");
            inputEl.value = "";
            setOptions([]);
            setTimeout(() => processInput(val), 300);
        });

        inputEl.addEventListener("keydown", e => {
            if (e.key === "Enter") {
                const val = inputEl.value.trim();
                if (!val) return;
                addMessage(val, "user");
                inputEl.value = "";
                setOptions([]);
                setTimeout(() => processInput(val), 300);
            }
        });

        setTimeout(() => {
            unreadBadge.classList.remove("hidden");
            addMessage("¡Hola! Soy <strong>R2-D2</strong>, el asistente de La Cueva del Multiverso 🤖\n¿En qué te puedo ayudar hoy?", "bot");
            setOptions(mainMenu());
        }, 1500);

    })(allCards);

    async function loadWishlist() {
        if (!currentUser) { wishlist = []; updateWishlistCount(); return; }
        try {
            const res = await fetch(`${API_BASE}/wishlist`, { headers: getAuthHeaders() });
            if (res.ok) wishlist = await res.json();
            else wishlist = [];
        } catch (err) {
            wishlist = [];
        }
        updateWishlistCount();
    }

    function updateWishlistCount() {
        const countEl = document.getElementById("wishlistCount");
        if (!countEl) return;
        if (wishlist.length > 0) {
            countEl.textContent = wishlist.length;
            countEl.classList.remove("hidden");
        } else {
            countEl.classList.add("hidden");
        }
    }

    async function toggleWishlist(product) {
        if (!currentUser) {
            alert("⚠️ Debes iniciar sesión para usar la wishlist");
            return false;
        }
        const inList = wishlist.find(w => w.productoId === product.productId || w.productoId?.toString() === product.productId?.toString());
        if (inList) {
            try {
                const res = await fetch(`${API_BASE}/wishlist/${product.productId}`, {
                    method: "DELETE",
                    headers: getAuthHeaders()
                });
                if (res.ok) {
                    wishlist = wishlist.filter(w => w.productoId?.toString() !== product.productId?.toString());
                    updateWishlistCount();
                    return false;
                }
            } catch (err) { console.warn(err); }
        } else {
            try {
                const res = await fetch(`${API_BASE}/wishlist`, {
                    method: "POST",
                    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
                    body: JSON.stringify({
                        productoId:  product.productId,
                        title:       product.title,
                        description: product.description,
                        price:       product.price,
                        seller:      product.seller,
                        image:       product.image,
                        category:    product.category
                    })
                });
                if (res.ok) {
                    const item = await res.json();
                    wishlist.push(item);
                    updateWishlistCount();
                    return true;
                } else {
                    const err = await res.json();
                    if (err.error && err.error.includes("ya está")) return true;
                }
            } catch (err) { console.warn(err); }
        }
        return !!inList;
    }

    function renderWishlist() {
        const container = document.getElementById("wishlistItemsContainer");
        const emptyMsg  = document.getElementById("emptyWishlistMessage");
        if (!container) return;

        const items = container.querySelectorAll(".wishlist-item");
        items.forEach(i => i.remove());

        if (wishlist.length === 0) {
            if (emptyMsg) emptyMsg.classList.remove("hidden");
            return;
        }
        if (emptyMsg) emptyMsg.classList.add("hidden");

        wishlist.forEach(item => {
            const div = document.createElement("div");
            div.className = "wishlist-item";
            div.innerHTML = `
                <img src="${item.image}" alt="${item.title}">
                <div class="wishlist-item-info">
                    <h4>${item.title}</h4>
                    <p>${item.description ? item.description.substring(0, 60) + "..." : ""}</p>
                    <p class="wishlist-price">${item.price}</p>
                </div>
                <div class="wishlist-item-actions">
                    <button class="wishlist-add-cart-btn">🛒 Al Carrito</button>
                    <button class="wishlist-remove-btn">🗑️ Eliminar</button>
                </div>
            `;

            div.querySelector(".wishlist-add-cart-btn").addEventListener("click", async () => {
                await addToCart({
                    title:       item.title,
                    description: item.description,
                    price:       item.price,
                    seller:      item.seller,
                    image:       item.image,
                    category:    item.category,
                    stock:       item.stock || 50,
                    productId:   item.productoId || null
                });
            });

            div.querySelector(".wishlist-remove-btn").addEventListener("click", async () => {
                try {
                    const res = await fetch(`${API_BASE}/wishlist/${item.productoId}`, {
                        method: "DELETE",
                        headers: getAuthHeaders()
                    });
                    if (res.ok) {
                        wishlist = wishlist.filter(w => w.productoId?.toString() !== item.productoId?.toString());
                        updateWishlistCount();
                        div.remove();
                        if (wishlist.length === 0 && emptyMsg) emptyMsg.classList.remove("hidden");
                        const wBtn = modal.querySelector(".modal-wishlist-btn");
                        if (wBtn) {
                            wBtn.textContent = "♡ Guardar en Wishlist";
                            wBtn.classList.remove("in-wishlist");
                        }
                    }
                } catch (err) { console.warn(err); }
            });

            container.appendChild(div);
        });
    }

    const wishlistBtn     = document.getElementById("wishlistBtn");
    const wishlistOverlay = document.getElementById("wishlistOverlay");
    const wishlistClose   = document.getElementById("wishlistClose");

    if (wishlistBtn) {
        wishlistBtn.addEventListener("click", async () => {
            await loadWishlist();
            renderWishlist();
            wishlistOverlay.classList.add("show");
        });
    }
    if (wishlistClose) {
        wishlistClose.addEventListener("click", () => wishlistOverlay.classList.remove("show"));
    }
    if (wishlistOverlay) {
        wishlistOverlay.addEventListener("click", e => {
            if (e.target === wishlistOverlay) wishlistOverlay.classList.remove("show");
        });
    }

    async function loadOrderHistory() {
        const container = document.getElementById("orderHistoryContainer");
        const emptyMsg  = document.getElementById("emptyOrderHistoryMessage");
        if (!container) return;

        container.querySelectorAll(".order-history-card").forEach(c => c.remove());

        if (!currentUser) return;

        let orders = [];
        try {
            const res = await fetch(`${API_BASE}/orders/history`, { headers: getAuthHeaders() });
            if (res.ok) orders = await res.json();
        } catch (err) { console.warn(err); }

        if (orders.length === 0) {
            if (emptyMsg) emptyMsg.classList.remove("hidden");
            return;
        }
        if (emptyMsg) emptyMsg.classList.add("hidden");

        orders.forEach(order => {
            const card = document.createElement("div");
            card.className = "order-history-card";

            const itemsHTML = order.items.map(i =>
                `<li>📦 ${i.title} × ${i.quantity} — ${i.price}</li>`
            ).join("");

            const discountHTML = order.discountCode
                ? `<span class="order-discount-badge">🏷️ ${order.discountCode} −${order.discountPercent}% (−$${(order.discountAmount || 0).toLocaleString()} MXN)</span>`
                : "";

            card.innerHTML = `
                <div class="order-history-card-header">
                    <h4>${order.orderNumber}</h4>
                    <span>${order.date}</span>
                </div>
                <p class="order-history-total">Total: $${order.total.toLocaleString()} MXN</p>
                ${discountHTML}
                <ul class="order-history-items">${itemsHTML}</ul>
                <p style="font-size:0.78rem; color:#666; margin:8px 0 0;">Enviado a: ${order.customer?.address || ""}, ${order.customer?.city || ""}</p>
            `;

            container.appendChild(card);
        });
    }

    const orderHistoryBtn     = document.getElementById("orderHistoryBtn");
    const orderHistoryOverlay = document.getElementById("orderHistoryOverlay");
    const orderHistoryClose   = document.getElementById("orderHistoryClose");

    if (orderHistoryBtn) {
        orderHistoryBtn.addEventListener("click", async () => {
            await loadOrderHistory();
            orderHistoryOverlay.classList.add("show");
        });
    }
    if (orderHistoryClose) {
        orderHistoryClose.addEventListener("click", () => orderHistoryOverlay.classList.remove("show"));
    }
    if (orderHistoryOverlay) {
        orderHistoryOverlay.addEventListener("click", e => {
            if (e.target === orderHistoryOverlay) orderHistoryOverlay.classList.remove("show");
        });
    }

    async function loadAndRenderReviews(productoId) {
        const list   = document.getElementById("reviewsList");
        const avgBar = document.getElementById("reviewsAvgBar");
        const formWrapper = document.getElementById("reviewFormWrapper");
        if (!list || !avgBar) return;

        list.innerHTML = "";
        avgBar.innerHTML = "";

        let reviews = [];
        try {
            const res = await fetch(`${API_BASE}/reviews/${productoId}`);
            if (res.ok) reviews = await res.json();
        } catch (err) { console.warn(err); }

        if (reviews.length === 0) {
            list.innerHTML = `<p class="no-reviews-msg">Sé el primero en dejar una reseña ✨</p>`;
        } else {
            const avg = reviews.reduce((sum, r) => sum + r.calificacion, 0) / reviews.length;
            const stars = "★".repeat(Math.round(avg)) + "☆".repeat(5 - Math.round(avg));
            avgBar.innerHTML = `
                <span class="reviews-avg-score">${avg.toFixed(1)}</span>
                <span class="reviews-avg-stars">${stars}</span>
                <span class="reviews-avg-count">(${reviews.length} reseña${reviews.length !== 1 ? "s" : ""})</span>
            `;

            reviews.forEach(r => {
                const card = document.createElement("div");
                card.className = "review-card";
                const rStars = "★".repeat(r.calificacion) + "☆".repeat(5 - r.calificacion);
                const canDelete = currentUser && (currentUser._id === r.usuarioId || currentUser.type === "admin");
                card.innerHTML = `
                    <div class="review-card-header">
                        <div>
                            <span class="review-card-author">👤 ${r.usuarioName}</span>
                            <div class="review-card-stars">${rStars}</div>
                            <div class="review-card-date">${r.fecha}</div>
                        </div>
                        ${canDelete ? `<button class="review-delete-btn" data-id="${r._id}">🗑️</button>` : ""}
                    </div>
                    ${r.comentario ? `<p class="review-card-comment">"${r.comentario}"</p>` : ""}
                `;
                if (canDelete) {
                    card.querySelector(".review-delete-btn").addEventListener("click", async () => {
                        if (!confirm("¿Eliminar esta reseña?")) return;
                        try {
                            const res = await fetch(`${API_BASE}/reviews/${r._id}`, {
                                method: "DELETE",
                                headers: getAuthHeaders()
                            });
                            if (res.ok) await loadAndRenderReviews(productoId);
                        } catch (err) { console.warn(err); }
                    });
                }
                list.appendChild(card);
            });
        }

        if (formWrapper) {
            formWrapper.style.display = currentUser ? "block" : "none";
            if (!currentUser) {
                const loginMsg = document.createElement("p");
                loginMsg.style.cssText = "font-size:0.83rem; color:#888; margin-top:8px;";
                loginMsg.textContent = "Inicia sesión para dejar una reseña.";
                formWrapper.before(loginMsg);
            }
        }
    }

    const starBtns = document.querySelectorAll(".star-btn");
    starBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            selectedStars = parseInt(btn.dataset.val);
            starBtns.forEach(s => {
                s.classList.toggle("active", parseInt(s.dataset.val) <= selectedStars);
            });
        });
        btn.addEventListener("mouseenter", () => {
            const hoverVal = parseInt(btn.dataset.val);
            starBtns.forEach(s => {
                s.style.color = parseInt(s.dataset.val) <= hoverVal ? "#ffd60a" : "";
            });
        });
        btn.addEventListener("mouseleave", () => {
            starBtns.forEach(s => {
                s.style.color = parseInt(s.dataset.val) <= selectedStars ? "#ffd60a" : "";
            });
        });
    });

    const submitReviewBtn = document.getElementById("submitReviewBtn");
    if (submitReviewBtn) {
        submitReviewBtn.addEventListener("click", async () => {
            const msg = document.getElementById("reviewMsg");
            const comment = document.getElementById("reviewComment");

            if (!currentUser) {
                showReviewMsg(msg, "⚠️ Debes iniciar sesión para publicar una reseña.", "error");
                return;
            }
            if (!currentReviewProductId) {
                showReviewMsg(msg, "⚠️ No se detectó el producto.", "error");
                return;
            }
            if (!selectedStars) {
                showReviewMsg(msg, "⭐ Selecciona una calificación.", "error");
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/reviews`, {
                    method: "POST",
                    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
                    body: JSON.stringify({
                        productoId:   currentReviewProductId,
                        calificacion: selectedStars,
                        comentario:   comment ? comment.value.trim() : ""
                    })
                });

                if (res.ok) {
                    showReviewMsg(msg, "✅ ¡Reseña publicada! Gracias por tu opinión.", "success");
                    if (comment) comment.value = "";
                    selectedStars = 0;
                    starBtns.forEach(s => { s.classList.remove("active"); s.style.color = ""; });
                    await loadAndRenderReviews(currentReviewProductId);
                } else {
                    const err = await res.json();
                    showReviewMsg(msg, "❌ " + (err.error || "Error al publicar"), "error");
                }
            } catch (err) {
                showReviewMsg(msg, "❌ Error de conexión.", "error");
            }
        });
    }

    function showReviewMsg(el, text, type) {
        if (!el) return;
        el.textContent = text;
        el.className = `review-msg ${type}`;
        el.classList.remove("hidden");
        setTimeout(() => el.classList.add("hidden"), 4000);
    }

});