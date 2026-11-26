
"use strict";

// ======================================
// CONFIGURACIÓN
// ======================================

// Número del restaurante en formato internacional.
// Solo números: código de país + número, sin + ni espacios.
const WHATSAPP_NUMBER = "573218905330";

const STORAGE_KEY = "saborUrbanoCart";
const MAX_QUANTITY = 99;

// ======================================
// CATÁLOGO CENTRALIZADO
// ======================================

const products = [
    {
        id: "hamburguesa-clasica",
        name: "Hamburguesa Clásica",
        price: 18000
    },
    {
        id: "hamburguesa-doble",
        name: "Doble Sabor",
        price: 25000
    },
    {
        id: "pizza-pepperoni",
        name: "Pizza Pepperoni",
        price: 28000
    },
    {
        id: "pizza-especial",
        name: "Pizza Especial",
        price: 30000
    },
    {
        id: "limonada-natural",
        name: "Limonada Natural",
        price: 7000
    },
    {
        id: "gaseosa",
        name: "Gaseosa",
        price: 5000
    }
];

// ======================================
// ELEMENTOS HTML
// ======================================

const cartItemsContainer = document.getElementById("cart-items");
const cartCountElement = document.getElementById("cart-count");
const cartTotalElement = document.getElementById("cart-total");
const clearCartButton = document.getElementById("clear-cart");

const checkoutForm = document.getElementById("checkout-form");
const checkoutButton = document.getElementById("checkout-button");
const checkoutStatus = document.getElementById("checkout-status");

const customerNameInput = document.getElementById("customer-name");
const customerPhoneInput = document.getElementById("customer-phone");
const orderTypeInput = document.getElementById("order-type");

const addressGroup = document.getElementById("address-group");
const customerAddressInput = document.getElementById("customer-address");
const orderNotesInput = document.getElementById("order-notes");

// ======================================
// VALIDAR ELEMENTOS
// ======================================

const requiredElements = [
    cartItemsContainer,
    cartCountElement,
    cartTotalElement,
    clearCartButton,
    checkoutForm,
    checkoutButton,
    checkoutStatus,
    customerNameInput,
    customerPhoneInput,
    orderTypeInput,
    addressGroup,
    customerAddressInput,
    orderNotesInput
];

if (requiredElements.some(element => !element)) {
    throw new Error(
        "No se encontraron todos los elementos necesarios del HTML."
    );
}

// ======================================
// FORMATO DE PRECIOS
// ======================================

function formatPrice(price) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
    }).format(price);
}

// ======================================
// MOSTRAR PRECIOS DEL CATÁLOGO
// ======================================

function renderProductPrices() {
    document.querySelectorAll("[data-price-for]").forEach(element => {
        const product = products.find(
            item => item.id === element.dataset.priceFor
        );

        if (product) {
            element.textContent = formatPrice(product.price);
        }
    });
}

// ======================================
// ALMACENAMIENTO DEL CARRITO
// ======================================

function loadCart() {
    try {
        const savedCart = localStorage.getItem(STORAGE_KEY);

        if (!savedCart) {
            return [];
        }

        const parsedCart = JSON.parse(savedCart);

        if (!Array.isArray(parsedCart)) {
            return [];
        }

        const loadedCart = [];

        parsedCart.forEach(item => {
            if (!item || typeof item.id !== "string") {
                return;
            }

            const product = products.find(
                product => product.id === item.id
            );

            if (
                !product ||
                !Number.isSafeInteger(item.quantity) ||
                item.quantity < 1
            ) {
                return;
            }

            const existingItem = loadedCart.find(
                cartItem => cartItem.id === product.id
            );

            if (existingItem) {
                existingItem.quantity = Math.min(
                    MAX_QUANTITY,
                    existingItem.quantity + item.quantity
                );
            } else {
                loadedCart.push({
                    ...product,
                    quantity: Math.min(MAX_QUANTITY, item.quantity)
                });
            }
        });

        return loadedCart;

    } catch (error) {
        console.error("Error al recuperar el carrito:", error);
        return [];
    }
}

let cart = loadCart();

function saveCart() {
    try {
        const dataToSave = cart.map(item => ({
            id: item.id,
            quantity: item.quantity
        }));

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(dataToSave)
        );

        return true;

    } catch (error) {
        console.error("No se pudo guardar el carrito:", error);
        return false;
    }
}

// ======================================
// AGREGAR PRODUCTOS
// ======================================

function addToCart(productId) {
    const product = products.find(
        item => item.id === productId
    );

    if (!product) {
        return;
    }

    const existingItem = cart.find(
        item => item.id === productId
    );

    if (existingItem) {
        if (existingItem.quantity >= MAX_QUANTITY) {
            checkoutStatus.textContent =
                `El máximo permitido es ${MAX_QUANTITY} unidades por producto.`;

            return;
        }

        existingItem.quantity++;

    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    checkoutStatus.textContent = "";
    renderCart();
}

// ======================================
// CAMBIAR CANTIDADES
// ======================================

function changeQuantity(productId, amount) {
    const item = cart.find(
        product => product.id === productId
    );

    if (!item) {
        return;
    }

    const newQuantity = item.quantity + amount;

    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }

    if (newQuantity > MAX_QUANTITY) {
        checkoutStatus.textContent =
            `El máximo permitido es ${MAX_QUANTITY} unidades por producto.`;

        return;
    }

    item.quantity = newQuantity;

    checkoutStatus.textContent = "";
    renderCart();
}

// ======================================
// ELIMINAR PRODUCTOS
// ======================================

function removeFromCart(productId) {
    cart = cart.filter(
        item => item.id !== productId
    );

    checkoutStatus.textContent = "";
    renderCart();
}

// ======================================
// VACIAR CARRITO
// ======================================

function clearCart() {
    cart = [];
    checkoutStatus.textContent = "";
    renderCart();
}

// ======================================
// CALCULAR TOTAL
// ======================================

function calculateTotal() {
    return cart.reduce((total, item) => {
        return total + item.price * item.quantity;
    }, 0);
}

// ======================================
// CREAR BOTONES DEL CARRITO
// ======================================

function createCartButton(
    text,
    action,
    productId,
    label,
    disabled = false
) {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = text;
    button.dataset.action = action;
    button.dataset.id = productId;
    button.setAttribute("aria-label", label);
    button.disabled = disabled;

    if (
        action === "increase" ||
        action === "decrease"
    ) {
        button.className = "quantity-button";
    }

    if (action === "remove") {
        button.className = "remove-button";
    }

    return button;
}

// ======================================
// MOSTRAR CARRITO
// ======================================

function renderCart() {
    cartItemsContainer.innerHTML = "";

    if (cart.length === 0) {
        const emptyMessage = document.createElement("p");

        emptyMessage.className = "empty-cart";
        emptyMessage.textContent =
            "Tu carrito está vacío. ¡Agrega algo delicioso!";

        cartItemsContainer.appendChild(emptyMessage);

    } else {
        cart.forEach(item => {
            const cartItem = document.createElement("div");
            cartItem.className = "cart-item";

            const info = document.createElement("div");
            info.className = "cart-item-info";

            const name = document.createElement("h3");
            name.textContent = item.name;

            const details = document.createElement("p");

            details.textContent =
                `${formatPrice(item.price)} × ${item.quantity} = ` +
                formatPrice(item.price * item.quantity);

            info.append(name, details);

            const actions = document.createElement("div");
            actions.className = "cart-item-actions";

            const decreaseButton = createCartButton(
                "−",
                "decrease",
                item.id,
                `Disminuir cantidad de ${item.name}`
            );

            const quantity = document.createElement("span");
            quantity.className = "quantity-number";
            quantity.textContent = item.quantity;

            const increaseButton = createCartButton(
                "+",
                "increase",
                item.id,
                `Aumentar cantidad de ${item.name}`,
                item.quantity >= MAX_QUANTITY
            );

            const removeButton = createCartButton(
                "Eliminar",
                "remove",
                item.id,
                `Eliminar ${item.name} del carrito`
            );

            actions.append(
                decreaseButton,
                quantity,
                increaseButton,
                removeButton
            );

            cartItem.append(info, actions);
            cartItemsContainer.appendChild(cartItem);
        });
    }

    const totalQuantity = cart.reduce((total, item) => {
        return total + item.quantity;
    }, 0);

    cartCountElement.textContent = totalQuantity;
    cartTotalElement.textContent = formatPrice(calculateTotal());

    clearCartButton.hidden = cart.length === 0;
    checkoutButton.disabled = cart.length === 0;

    saveCart();
}

// ======================================
// EVENTOS DE LOS PRODUCTOS
// ======================================

document.querySelectorAll(".add-to-cart").forEach(button => {
    button.addEventListener("click", () => {
        addToCart(button.dataset.id);
    });
});

// ======================================
// EVENTOS DEL CARRITO
// ======================================

cartItemsContainer.addEventListener("click", event => {
    const button = event.target.closest(
        "button[data-action]"
    );

    if (
        !button ||
        !cartItemsContainer.contains(button)
    ) {
        return;
    }

    const productId = button.dataset.id;
    const action = button.dataset.action;

    if (action === "increase") {
        changeQuantity(productId, 1);
    }

    if (action === "decrease") {
        changeQuantity(productId, -1);
    }

    if (action === "remove") {
        removeFromCart(productId);
    }
});

clearCartButton.addEventListener("click", clearCart);

// ======================================
// TIPO DE ENTREGA
// ======================================

function updateAddressField() {
    const isDelivery = orderTypeInput.value === "domicilio";

    addressGroup.hidden = !isDelivery;
    customerAddressInput.required = isDelivery;

    if (!isDelivery) {
        customerAddressInput.value = "";
    }
}

orderTypeInput.addEventListener(
    "change",
    updateAddressField
);

// ======================================
// VALIDAR CONFIGURACIÓN DE WHATSAPP
// ======================================

function isValidWhatsAppNumber() {
    return /^[1-9]\d{7,14}$/.test(WHATSAPP_NUMBER);
}

// ======================================
// GENERAR MENSAJE DEL PEDIDO
// ======================================

function createOrderMessage() {
    const customerName = customerNameInput.value.trim();
    const customerPhone = customerPhoneInput.value.trim();
    const orderType = orderTypeInput.value;

    const customerAddress = customerAddressInput.value.trim();
    const orderNotes = orderNotesInput.value.trim();

    let message = "¡Hola! Quiero realizar el siguiente pedido:\n\n";

    message += "DATOS DEL CLIENTE\n";
    message += `Nombre: ${customerName}\n`;
    message += `Teléfono: ${customerPhone}\n\n`;

    message += "PRODUCTOS\n";

    cart.forEach(item => {
        message +=
            `${item.name}\n` +
            `Cantidad: ${item.quantity}\n` +
            `Precio unitario: ${formatPrice(item.price)}\n` +
            `Subtotal: ${formatPrice(item.price * item.quantity)}\n\n`;
    });

    message += "INFORMACIÓN DE ENTREGA\n";

    if (orderType === "domicilio") {
        message += "Tipo: Domicilio\n";
        message += `Dirección: ${customerAddress}\n`;
    } else {
        message += "Tipo: Recoger en el restaurante\n";
    }

    if (orderNotes) {
        message += `\nObservaciones: ${orderNotes}\n`;
    }

    message += `\nTOTAL DE PRODUCTOS: ${formatPrice(calculateTotal())}`;

    message +=
        "\n\nEste pedido está pendiente de confirmación por el restaurante.";

    return message;
}

// ======================================
// FINALIZAR PEDIDO POR WHATSAPP
// ======================================

function checkoutWhatsApp(event) {
    event.preventDefault();

    checkoutStatus.textContent = "";

    if (cart.length === 0) {
        checkoutStatus.textContent =
            "Agrega al menos un producto antes de continuar.";

        return;
    }

    if (!checkoutForm.reportValidity()) {
        return;
    }

    if (!isValidWhatsAppNumber()) {
        checkoutStatus.textContent =
            "El número de WhatsApp del restaurante no está configurado correctamente.";

        return;
    }

    if (
        orderTypeInput.value === "domicilio" &&
        !customerAddressInput.value.trim()
    ) {
        checkoutStatus.textContent =
            "Escribe la dirección para recibir tu pedido.";

        customerAddressInput.focus();
        return;
    }

    const message = createOrderMessage();

    const whatsappURL =
        "https://wa.me/" +
        WHATSAPP_NUMBER +
        "?text=" +
        encodeURIComponent(message);

    window.open(
        whatsappURL,
        "_blank",
        "noopener,noreferrer"
    );

    checkoutStatus.textContent =
        "Se abrió WhatsApp. Revisa el pedido y envíalo al restaurante.";
}

checkoutForm.addEventListener(
    "submit",
    checkoutWhatsApp
);

// ======================================
// INICIAR APLICACIÓN
// ======================================

renderProductPrices();
updateAddressField();
renderCart();
