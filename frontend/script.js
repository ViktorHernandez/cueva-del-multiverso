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

    // ✅ handleGoogleAuthCallback y loginWithGoogle correctamente
    //    definidas DENTRO del DOMContentLoaded principal
    //    Se llaman desde abajo, después de que checkUserSession existe
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
        // Con JWT las rutas de usuarios están protegidas, el admin debe
        // existir en la BD. Esta función solo hace un log informativo.
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

    const confirmationOverlay = document.getElementById("confirmationOverlay");
    const confirmationClose = document.getElementById("confirmationClose");
    const closeConfirmationBtn = document.getElementById("closeConfirmationBtn");
    const downloadInvoiceBtn = document.getElementById("downloadInvoiceBtn");

    let cart = [];
    let lastOrder = null;

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
        
            cartSection.classList.remove("hidden");
            updateCartCount();
        
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
                cart = await res.json();
            }
        } catch (err) {
            console.warn("⚠️ No se pudo cargar el carrito:", err.message);
            cart = [];
        }
    }

    async function saveCart() {
        if (!currentUser) return;
        try {
            await fetch(`${API_BASE}/cart`, {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify(cart)
            });
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

    handleGoogleAuthCallback(); // Procesa el token de Google si viene en la URL
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
    
        const existingItem = cart.find(item => item.title === product.title);
    
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                title: product.title,
                description: product.description,
                price: product.price,
                image: product.image,
                seller: product.seller,
                quantity: 1
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
            cartItem.innerHTML = `
                <img src="${item.image}" alt="${item.title}" class="cart-item-image">
                <div class="cart-item-details">
                    <h4>${item.title}</h4>
                    <p>${item.description}</p>
                    <p class="cart-item-price">${item.price} x ${item.quantity} = $${itemTotal.toLocaleString()} MXN</p>
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
        const total = subtotal + shipping;
    
        cartSubtotal.textContent = `$${subtotal.toLocaleString()} MXN`;
        cartGrandTotal.textContent = `$${total.toLocaleString()} MXN`;
    }

    window.updateQuantity = async function(index, change) {
        if (cart[index]) {
            cart[index].quantity += change;
        
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
        cartBtn.addEventListener("click", () => {
            cartOverlay.classList.add("show");
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
            const total = subtotal + shipping;
        
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
            const total = subtotal + shipping;
        
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
        
            checkoutOverlay.classList.remove("show");
            confirmationOverlay.classList.add("show");
        
            checkoutForm.reset();
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

            const subtotal = lastOrder.total - 150;
        
            invoiceContent += `
    ─────────────────────────────────────────────────────────────
    RESUMEN DE PAGO
    ─────────────────────────────────────────────────────────────
    Subtotal:                           $${subtotal.toLocaleString()} MXN
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
            orderNumber: order.orderNumber,
            customerName: order.customer.name,
            customerEmail: order.customer.email,
            total: order.total,
            items: order.items,
            date: order.date,
            read: false,
            timestamp: Date.now()
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
        
            row.innerHTML = `
                <td><img src="${product.image}" alt="${product.title}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;"></td>
                <td>${product.title}</td>
                <td>${categoryEmoji[product.category] || ""} ${product.category}</td>
                <td>${product.price}</td>
                <td>${product.seller}</td>
                <td class="action-buttons">
                    <button class="edit-btn" onclick="editProduct('${product._id}')">✏️</button>
                    <button class="delete-btn" onclick="deleteProduct('${product._id}')">🗑️</button>
                </td>
            `;
        
            productsTableBody.appendChild(row);
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
            const category = document.getElementById("productCategory").value;
            const price = document.getElementById("productPrice").value;
            const seller = document.getElementById("productSeller").value.trim();
            const image = document.getElementById("productImage").value.trim();
        
            const productData = {
                title, description, fullDescription, category,
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
        
            card.innerHTML = `
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

    const allCards = Array.from(document.querySelectorAll(".missions-board .mission-card"));
    const featuredBoard = document.getElementById("featuredBoard");
    const allProductsBoard = document.getElementById("allProductsBoard");
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
                    title: card.dataset.title,
                    description: card.dataset.description,
                    price: card.dataset.price,
                    seller: card.dataset.seller,
                    image: card.dataset.image,
                    category: card.dataset.category
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
                whatsappLink.style.borderRadius = "8px";
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
                addToCartModalBtn.style.background = "#00f7ff";
                addToCartModalBtn.style.color = "#000";
                addToCartModalBtn.style.border = "none";
                addToCartModalBtn.style.borderRadius = "8px";
                addToCartModalBtn.style.fontWeight = "bold";
                addToCartModalBtn.style.cursor = "pointer";
            
                addToCartModalBtn.addEventListener("click", () => {
                    addToCart(viewedProduct);
                    modal.classList.remove("show");
                });
            
                modal.querySelector(".modal-content").appendChild(addToCartModalBtn);

                modal.classList.add("show");
            });
        
            if (!card.querySelector('.add-to-cart-btn')) {
                const addToCartBtn = document.createElement("button");
                addToCartBtn.textContent = "🛒";
                addToCartBtn.className = "add-to-cart-btn";
                addToCartBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    addToCart({
                        title: card.dataset.title,
                        description: card.dataset.description,
                        price: card.dataset.price,
                        seller: card.dataset.seller,
                        image: card.dataset.image,
                        category: card.dataset.category
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
                console.warn("⚠️ No se pudo cargar historial:", err.message);
                history = {};
            }
        }

        lastViewedBoard.innerHTML = "";

        Object.keys(history).forEach(category => {
            if (!Array.isArray(history[category]) || history[category].length === 0) return;

            const container = document.createElement("div");
            container.className = "last-viewed-category";
            container.style.display = "flex";
            container.style.flexDirection = "column";
            container.style.alignItems = "center";
            container.style.gap = "15px";
            container.style.flexWrap = "wrap";

            const title = document.createElement("h4");
            title.textContent = category.toUpperCase();
            title.setAttribute("data-emoji", categoryEmoji[category] || "📂");
            container.appendChild(title);

            history[category].forEach(item => {
                const card = document.createElement("div");
                card.className = "mission-card";
                card.style.display = "flex";
                card.style.flexDirection = "column";
                card.style.alignItems = "center";
                card.innerHTML = `
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

                    const whatsappLink = document.createElement("a");
                    whatsappLink.href = `https://wa.me/5215629727628?text=${encodeURIComponent(`¡Hola! Estoy interesado en este producto: ${item.title} - ${item.description}`)}`;
                    whatsappLink.target = "_blank";
                    whatsappLink.textContent = "💬 Contactar por WhatsApp";
                    whatsappLink.style.display = "inline-block";
                    whatsappLink.style.marginTop = "15px";
                    whatsappLink.style.padding = "10px 20px";
                    whatsappLink.style.background = "#25D366";
                    whatsappLink.style.color = "#fff";
                    whatsappLink.style.borderRadius = "8px";
                    whatsappLink.style.textDecoration = "none";
                    whatsappLink.style.fontWeight = "bold";
                    whatsappLink.classList.add("whatsapp-link");
                    modal.querySelector(".modal-content").appendChild(whatsappLink);

                    modal.classList.add("show");
                });
                container.appendChild(card);
            });

            lastViewedBoard.appendChild(container);
        });
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

        const shuffled = [...allCards].sort(() => 0.5 - Math.random());
        const featuredCards = shuffled.slice(0, 3);

        featuredCards.forEach((card, index) => {
            const clone = card.cloneNode(true);
            clone.classList.add("featured");
            clone.style.opacity = "0";
            clone.style.transform = "translateY(30px)";
            clone.style.transition = "opacity 0.8s ease, transform 0.8s ease";
            featuredBoard.appendChild(clone);
            setTimeout(() => {
                clone.style.opacity = "1";
                clone.style.transform = "translateY(0)";
            }, index * 600);
        });

        attachModalEvents(featuredBoard.querySelectorAll(".mission-card"));
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

    initializeProducts();
    attachModalEvents(allCards);
    renderFeatured();
    renderLastViewed();
    countProductsByCategory();
    renderProducts();
    setInterval(renderFeatured, 180000);
    updateCartCount();

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
        const body = document.body;
        
        body.classList.remove(
            "filter-protanopia",
            "filter-deuteranopia",
            "filter-tritanopia",
            "filter-achromatopsia",
            "filter-high-contrast"
        );
        
        if (filterType !== "none") {
            body.classList.add(`filter-${filterType}`);
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
    
});