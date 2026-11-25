
import { supabase } from "./supabase.js";

const sellerName = document.getElementById("sellerName");
const productsContainer = document.getElementById("myProducts");
const message = document.getElementById("dashboardMessage");
const ordersContainer = document.getElementById("sellerOrders");
const ordersMessage = document.getElementById("ordersMessage");
const logoutButton = document.getElementById("logoutButton");

let currentUser;

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// LOAD SELLER PRODUCTS
async function loadProducts() {
    const { data: products, error } = await supabase
        .from("products")
        .select("*")
        .eq("seller_id", currentUser.id)
        .order("created_at", { ascending: false });

    if (error) {
        message.textContent = error.message;
        return;
    }

    if (!products || products.length === 0) {
        message.textContent = "You haven't uploaded any products yet.";
        productsContainer.innerHTML = "";
        return;
    }

    message.textContent = `${products.length} product(s) listed.`;

    productsContainer.innerHTML = products.map(product => `
        <article class="product-card">
            <img src="${escapeHTML(product.image_url)}"
                 alt="${escapeHTML(product.name)}">

            <div class="product-info">
                <h3>${escapeHTML(product.name)}</h3>
                <p class="price">₦${Number(product.price).toLocaleString("en-NG")}</p>
                <p>Category: ${escapeHTML(product.category)}</p>
                <p>Condition: ${escapeHTML(product.condition)}</p>
                <p>Location: ${escapeHTML(product.location)}</p>
                <p>Status: ${escapeHTML(product.status)}</p>

                <button class="delete-button"
                        data-delete="${escapeHTML(product.id)}">
                    Delete Product
                </button>
            </div>
        </article>
    `).join("");
}

// LOAD INCOMING ORDERS
async function loadOrders() {
    ordersMessage.textContent = "Loading orders...";

    const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("seller_id", currentUser.id)
        .order("created_at", { ascending: false });

    if (error) {
        ordersMessage.textContent = error.message;
        return;
    }

    if (!orders || orders.length === 0) {
        ordersMessage.textContent = "You have no incoming orders yet.";
        ordersContainer.innerHTML = "";
        return;
    }

    const productIds = [...new Set(orders.map(order => order.product_id))];

    const { data: products, error: productError } = await supabase
        .from("products")
        .select("id, name")
        .in("id", productIds);

    if (productError) {
        ordersMessage.textContent = productError.message;
        return;
    }

    const productMap = Object.fromEntries(
        products.map(product => [product.id, product.name])
    );

    ordersMessage.textContent = `${orders.length} incoming order(s).`;

    ordersContainer.innerHTML = orders.map(order => `
        <article class="product-card">
            <div class="product-info">
                <h3>${escapeHTML(productMap[order.product_id] || "Product")}</h3>

                <p>Order ID: ${escapeHTML(order.id.slice(0, 8))}</p>
                <p>Quantity: ${order.quantity}</p>

                <p class="price">
                    ₦${Number(order.total_price).toLocaleString("en-NG")}
                </p>

                <p>Order Status:
                    <strong>${escapeHTML(order.status)}</strong>
                </p>

                ${order.status === "pending" ? `
                    <button class="buy-button"
                            data-accept="${escapeHTML(order.id)}">
                        Accept Order
                    </button>

                    <button class="delete-button"
                            data-reject="${escapeHTML(order.id)}">
                        Reject Order
                    </button>
                ` : ""}

                ${order.status === "accepted" ? `
                    <button class="buy-button"
                            data-delivered="${escapeHTML(order.id)}">
                        Mark as Delivered
                    </button>
                ` : ""}
            </div>
        </article>
    `).join("");
}

// LOAD DASHBOARD
async function loadDashboard() {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;

    sellerName.textContent =
        "Welcome, " + (user.user_metadata?.full_name || user.email);

    await Promise.all([loadProducts(), loadOrders()]);
}

// DELETE PRODUCT
productsContainer.addEventListener("click", async event => {
    const button = event.target.closest("[data-delete]");
    if (!button) return;

    if (!confirm("Are you sure you want to delete this product?")) return;

    button.disabled = true;

    const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", button.dataset.delete)
        .eq("seller_id", currentUser.id);

    if (error) {
        alert(error.message);
        button.disabled = false;
        return;
    }

    await loadProducts();
});

// ACCEPT, REJECT OR MARK DELIVERED
ordersContainer.addEventListener("click", async event => {
    const acceptButton = event.target.closest("[data-accept]");
    const rejectButton = event.target.closest("[data-reject]");
    const deliveredButton = event.target.closest("[data-delivered]");

    if (!acceptButton && !rejectButton && !deliveredButton) return;

    const button = acceptButton || rejectButton || deliveredButton;

    const orderId =
        button.dataset.accept ||
        button.dataset.reject ||
        button.dataset.delivered;

    let newStatus;
    let oldStatus;

    if (acceptButton) {
        newStatus = "accepted";
        oldStatus = "pending";
    } else if (rejectButton) {
        newStatus = "rejected";
        oldStatus = "pending";
    } else {
        newStatus = "delivered";
        oldStatus = "accepted";
    }

    if (newStatus === "rejected" &&
        !confirm("Are you sure you want to reject this order?")) {
        return;
    }

    if (newStatus === "delivered" &&
        !confirm("Confirm that you have delivered this order to the buyer?")) {
        return;
    }

    button.disabled = true;
    button.textContent = "Updating...";

    const { data, error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId)
        .eq("seller_id", currentUser.id)
        .eq("status", oldStatus)
        .select("id");

    if (error || !data || data.length === 0) {
        alert(error?.message || "Order could not be updated.");
        await loadOrders();
        return;
    }

    await loadOrders();
});

// LOGOUT
logoutButton.addEventListener("click", async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
        alert(error.message);
        return;
    }

    window.location.href = "login.html";
});

loadDashboard();
