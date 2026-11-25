
import { supabase } from "./supabase.js";

const productsGrid = document.getElementById("productsGrid");
const searchInput = document.getElementById("marketplaceSearchInput");
const searchForm = document.getElementById("marketplaceSearch");
const categoryFilter = document.getElementById("categoryFilter");

let products = [];

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// Display products
function displayProducts(items) {
    if (!items.length) {
        productsGrid.innerHTML = `
            <p>No products found. Try another search.</p>
        `;
        return;
    }

    productsGrid.innerHTML = items.map(product => `
        <article class="product-card">

            <div class="product-image-container">
                ${
                    product.image_url
                    ? `
                        <img
                            src="${escapeHTML(product.image_url)}"
                            alt="${escapeHTML(product.name)}"
                            loading="lazy"
                            onerror="this.style.display='none'"
                        >
                    `
                    : `
                        <div class="image-fallback">
                            Image unavailable
                        </div>
                    `
                }
            </div>

            <div class="product-info">

                <p class="product-category">
                    ${escapeHTML(product.category)}
                </p>

                <h3>${escapeHTML(product.name)}</h3>

                <p class="product-price">
                    ₦${Number(product.price).toLocaleString("en-NG")}
                </p>

                <p class="product-condition">
                    Condition: ${escapeHTML(product.condition)}
                </p>

                <p class="product-location">
                    Location: ${escapeHTML(product.location)}
                </p>

                <button
                    type="button"
                    data-product-id="${escapeHTML(product.id)}"
                >
                    View Product
                </button>

            </div>
        </article>
    `).join("");
}

// Search and filter products
function filterProducts() {

    const search = searchInput.value
        .toLowerCase()
        .trim();

    const category = categoryFilter.value;

    const filteredProducts = products.filter(product => {

        const searchableText = [
            product.name,
            product.category,
            product.location,
            product.condition,
            product.description
        ].filter(Boolean).join(" ").toLowerCase();

        const matchesSearch = searchableText.includes(search);

        const matchesCategory =
            category === "all" ||
            product.category === category;

        return matchesSearch && matchesCategory;
    });

    displayProducts(filteredProducts);
}

// Load products from Supabase
async function loadProducts() {

    productsGrid.innerHTML = "<p>Loading products...</p>";

    try {

        const { data, error } = await supabase
            .from("products")
            .select("*")
            .eq("status", "active")
            .order("created_at", { ascending: false });

        if (error) throw error;

        products = data || [];

        console.log("UNEST MARKET products:", products);

        filterProducts();

    } catch (error) {

        console.error("Marketplace loading error:", error);

        productsGrid.innerHTML = `
            <p style="color:red;">
                Unable to load products:
                ${escapeHTML(error.message)}
            </p>
        `;
    }
}

// Open product details
productsGrid.addEventListener("click", function(event) {

    const button = event.target.closest("[data-product-id]");

    if (!button) return;

    const productId = button.dataset.productId;

    window.location.href =
        `product-details.html?id=${encodeURIComponent(productId)}`;
});

// SEARCH BUTTON
if (searchForm) {
    searchForm.addEventListener("submit", function(event) {
        event.preventDefault();
        filterProducts();
    });
}

// DIRECT SEARCH BUTTON CLICK
const searchButton = searchForm?.querySelector('button[type="submit"]');

if (searchButton) {
    searchButton.addEventListener("click", function(event) {
        event.preventDefault();
        filterProducts();
    });
}

// Search while typing
if (searchInput) {
    searchInput.addEventListener("input", filterProducts);
}

// Category filter
if (categoryFilter) {
    categoryFilter.addEventListener("change", filterProducts);
}

// Initial search from URL
const initialSearch =
    new URLSearchParams(window.location.search).get("search");

if (initialSearch && searchInput) {
    searchInput.value = initialSearch;
}

// Start
loadProducts();
