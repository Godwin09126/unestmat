
import { supabase } from "./supabase.js";

const productSummary = document.getElementById("productSummary");
const checkoutForm = document.getElementById("checkoutForm");
const message = document.getElementById("checkoutMessage");
const placeOrderButton = document.getElementById("placeOrderButton");

const productId = new URLSearchParams(window.location.search).get("id");

let currentProduct = null;

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

async function loadCheckoutProduct() {
    if (!productId) {
        productSummary.textContent = "Product ID is missing.";
        placeOrderButton.disabled = true;
        return;
    }

    try {
        const { data, error } = await supabase
            .from("products")
            .select("id, name, price, image_url, status")
            .eq("id", productId)
            .eq("status", "active")
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            throw new Error("This product is unavailable.");
        }

        currentProduct = data;

        productSummary.innerHTML = `
            <h2>${escapeHTML(data.name)}</h2>
            ${data.image_url ? `
                <img src="${escapeHTML(data.image_url)}"
                     alt="${escapeHTML(data.name)}"
                     style="width:100%;max-height:200px;object-fit:contain;">
            ` : ""}
            <p>Price: <strong>₦${Number(data.price).toLocaleString("en-NG")}</strong></p>
            <p id="totalPrice">
                Total: ₦${Number(data.price).toLocaleString("en-NG")}
            </p>
        `;

        updateTotal();

    } catch (error) {
        console.error("Product loading error:", error);
        productSummary.textContent = error.message;
        placeOrderButton.disabled = true;
    }
}

function updateTotal() {
    if (!currentProduct) return;

    const quantity = Number(
        document.getElementById("orderQuantity").value
    );

    const total = Number(currentProduct.price) * quantity;

    document.getElementById("totalPrice").textContent =
        "Total: ₦" + total.toLocaleString("en-NG");
}

document.getElementById("orderQuantity")
    .addEventListener("input", updateTotal);

checkoutForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    if (!currentProduct) {
        message.textContent = "Product information is not ready.";
        return;
    }

    const guestName = document.getElementById("guestName").value.trim();
    const guestPhone = document.getElementById("guestPhone").value.trim();
    const guestEmail = document.getElementById("guestEmail").value.trim();
    const deliveryAddress = document.getElementById("deliveryAddress").value.trim();
    const quantity = Number(document.getElementById("orderQuantity").value);

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
        message.style.color = "red";
        message.textContent = "Enter a valid quantity.";
        return;
    }

    placeOrderButton.disabled = true;
    placeOrderButton.textContent = "Placing Order...";
    message.style.color = "#0284C7";
    message.textContent = "Processing your order...";

    try {
        const { data, error } = await supabase.rpc("place_guest_order", {
            p_product_id: productId,
            p_quantity: quantity,
            p_guest_name: guestName,
            p_guest_phone: guestPhone,
            p_guest_email: guestEmail || null,
            p_delivery_address: deliveryAddress
        });

        if (error) throw error;

        message.style.color = "green";
        message.textContent = "Order placed successfully! Order ID: " + data;

        placeOrderButton.textContent = "Order Placed";
        checkoutForm.reset();

    } catch (error) {
        console.error("Checkout error:", error);

        message.style.color = "red";
        message.textContent = error.message || "Unable to place your order.";

        placeOrderButton.disabled = false;
        placeOrderButton.textContent = "Place Order";
    }
});

loadCheckoutProduct();
