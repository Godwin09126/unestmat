
import { supabase } from "./supabase.js";

const container = document.getElementById("ordersContainer");
const message = document.getElementById("ordersMessage");

async function loadOrders() {
    const { data: { user }, error: authError } =
        await supabase.auth.getUser();

    if (authError || !user) {
        window.location.href = "login.html";
        return;
    }

    const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        message.textContent = error.message;
        return;
    }

    if (!orders.length) {
        message.textContent = "You haven't placed any orders yet.";
        return;
    }

    const ids = [...new Set(orders.map(order => order.product_id))];

    const { data: products, error: productError } = await supabase
        .from("products")
        .select("id, name")
        .in("id", ids);

    if (productError) {
        message.textContent = productError.message;
        return;
    }

    const names = Object.fromEntries(
        products.map(product => [product.id, product.name])
    );

    message.textContent = `${orders.length} order(s) found.`;

    container.innerHTML = orders.map(order => `
        <article class="order-card">
            <h3>${escapeHTML(names[order.product_id] || "Product")}</h3>
            <p>Order: ${escapeHTML(order.id.slice(0, 8))}</p>
            <p>Quantity: ${order.quantity}</p>
            <p class="price">
                ₦${Number(order.total_price).toLocaleString("en-NG")}
            </p>
            <p>Status: <strong>${escapeHTML(order.status)}</strong></p>
            ${order.status === "delivered" ? `
                <button data-confirm="${escapeHTML(order.id)}">
                    Confirm Received
                </button>
            ` : ""}
        </article>
    `).join("");
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;",
        '"': "&quot;", "'": "&#39;"
    })[char]);
}

container.addEventListener("click", async event => {
    const button = event.target.closest("[data-confirm]");
    if (!button) return;

    if (!confirm("Have you received this product?")) return;

    button.disabled = true;
    button.textContent = "Updating...";

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from("orders")
        .update({ status: "completed" })
        .eq("id", button.dataset.confirm)
        .eq("buyer_id", user.id)
        .eq("status", "delivered")
        .select("id");

    if (error || !data?.length) {
        alert(error?.message || "Order could not be confirmed.");
        button.disabled = false;
        button.textContent = "Confirm Received";
        return;
    }

    await loadOrders();
});

loadOrders();
