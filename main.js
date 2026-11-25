import { supabase } from "./supabase.js";

const featuredProducts = document.getElementById("featuredProducts");

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// LOAD FEATURED PRODUCTS
async function loadFeaturedProducts() {
    if (!featuredProducts) return;

    featuredProducts.innerHTML = "<p>Loading products...</p>";

    try {
        const { data, error } = await supabase
            .from("products")
            .select("*")
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(4);

        if (error) throw error;

        if (!data || data.length === 0) {
            featuredProducts.innerHTML =
                "<p>No products available yet.</p>";
            return;
        }

        featuredProducts.innerHTML = data.map(product => `
            <article class="product-card">

                <div class="product-image-container">
                    <img
                        src="${escapeHTML(product.image_url || "")}"
                        alt="${escapeHTML(product.name)}"
                        class="product-image"
                        style="width:100%; height:200px; object-fit:cover;"
                        onerror="this.style.display='none';"
                    >
                </div>

                <div class="product-info">
                    <h3>${escapeHTML(product.name)}</h3>

                    <p class="product-price">
                        ₦${Number(product.price).toLocaleString("en-NG")}
                    </p>

                    <p>${escapeHTML(product.category)}</p>
                    <p>${escapeHTML(product.location)}</p>

                    <button
                        type="button"
                        onclick="window.location.href='product-details.html?id=${encodeURIComponent(product.id)}'"
                    >
                        View Product
                    </button>
                </div>

            </article>
        `).join("");

    } catch (error) {
        console.error("Featured products error:", error);
        featuredProducts.innerHTML =
            "<p>Unable to load products. Please refresh.</p>";
    }
}

// HOMEPAGE SEARCH
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");

if (searchForm && searchInput) {
    searchForm.addEventListener("submit", event => {
        event.preventDefault();

        const search = searchInput.value.trim();

        window.location.href =
            `marketplace.html?search=${encodeURIComponent(search)}`;
    });
}

// START
loadFeaturedProducts();