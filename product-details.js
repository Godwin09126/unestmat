
import { supabase } from "./supabase.js";

const container = document.getElementById("productDetails");
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

async function loadProduct() {
    if (!productId) {
        container.innerHTML = "<h2>Product not found</h2>";
        return;
    }

    container.innerHTML = "<p>Loading product...</p>";

    const { data: product, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .eq("status", "active")
        .maybeSingle();

    if (error || !product) {
        container.innerHTML = "<h2>Product not found</h2>";
        return;
    }

    container.innerHTML = `
        <div class="details-card">
            <img
                class="details-image"
                src="${escapeHTML(product.image_url || "")}"
                alt="${escapeHTML(product.name)}"
                onerror="this.style.display='none'"
            >

            <div class="details-info">
                <h1>${escapeHTML(product.name)}</h1>

                <h2 class="details-price">
                    ₦${Number(product.price).toLocaleString("en-NG")}
                </h2>

                <p><strong>Category:</strong> ${escapeHTML(product.category)}</p>
                <p><strong>Condition:</strong> ${escapeHTML(product.condition)}</p>
                <p><strong>Location:</strong> ${escapeHTML(product.location)}</p>

                <h3>Description</h3>
                <p>${escapeHTML(product.description)}</p>

                <a href="marketplace.html">Back to Marketplace</a>
            </div>
        </div>
    `;
}

loadProduct();
