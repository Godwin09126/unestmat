
import { supabase } from "./supabase.js";

const buyButton = document.getElementById("buyButton");
const checkoutForm = document.getElementById("checkoutForm");
const message = document.getElementById("orderMessage");
const placeOrderButton = document.getElementById("placeOrderButton");

const guestNameInput = document.getElementById("guestName");
const guestPhoneInput = document.getElementById("guestPhone");
const guestEmailInput = document.getElementById("guestEmail");
const deliveryAddressInput = document.getElementById("deliveryAddress");
const quantityInput = document.getElementById("orderQuantity");

// Only run on product details page
if (
    buyButton &&
    checkoutForm &&
    message &&
    placeOrderButton
) {

    // Open checkout form
    buyButton.addEventListener("click", function () {
console.log("BUY BUTTON CLICKED");
        checkoutForm.style.display = "block";
        buyButton.style.display = "none";

        checkoutForm.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });

    // Submit guest order
    checkoutForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const productId =
            new URLSearchParams(window.location.search).get("id");

        const guestName = guestNameInput.value.trim();
        const guestPhone = guestPhoneInput.value.trim();
        const guestEmail = guestEmailInput.value.trim();
        const deliveryAddress = deliveryAddressInput.value.trim();
        const quantity = Number(quantityInput.value);

        if (!productId) {
            message.style.color = "red";
            message.textContent = "Product ID is missing.";
            return;
        }

        if (!guestName || !guestPhone || !deliveryAddress) {
            message.style.color = "red";
            message.textContent = "Please complete all required fields.";
            return;
        }

        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
            message.style.color = "red";
            message.textContent = "Please enter a valid quantity.";
            return;
        }

        placeOrderButton.disabled = true;
        placeOrderButton.textContent = "Placing Order...";

        message.style.color = "#0284C7";
        message.textContent = "Processing your order...";

        try {

            const { data, error } = await supabase.rpc(
                "place_guest_order",
                {
                    p_product_id: productId,
                    p_quantity: quantity,
                    p_guest_name: guestName,
                    p_guest_phone: guestPhone,
                    p_guest_email: guestEmail || null,
                    p_delivery_address: deliveryAddress
                }
            );

            if (error) throw error;

            message.style.color = "green";
            message.textContent =
                "Your order has been placed successfully!";

            placeOrderButton.textContent = "Order Placed";

            checkoutForm.reset();

            buyButton.style.display = "none";

        } catch (error) {

            console.error("Order error:", error);

            message.style.color = "red";
            message.textContent =
                error.message || "Unable to place your order.";

            placeOrderButton.disabled = false;
            placeOrderButton.textContent = "Place Order";
        }
    });
}
