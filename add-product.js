
import { supabase } from "./supabase.js";

const productForm = document.getElementById("productForm");
const message = document.getElementById("message");

productForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const button = productForm.querySelector("button[type='submit']");
    let uploadedImagePath = null;

    try {
        button.disabled = true;
        button.textContent = "Uploading...";

        message.style.color = "blue";
        message.textContent = "Checking account...";

        const { data: { user }, error: userError } =
            await supabase.auth.getUser();

        if (userError || !user) {
            throw new Error("Please log in before uploading.");
        }

        const name = document.getElementById("productName").value.trim();
        const price = Number(document.getElementById("productPrice").value);
        const category = document.getElementById("productCategory").value;
        const condition = document.getElementById("productCondition").value;
        const location = document.getElementById("productLocation").value.trim();
        const description = document.getElementById("productDescription").value.trim();
        const image = document.getElementById("productImage").files[0];

        if (!name || !price || price <= 0 || !category ||
            !condition || !location || !description || !image) {
            throw new Error("Please complete all fields and select an image.");
        }

        if (!image.type.startsWith("image/")) {
            throw new Error("Please select a valid image.");
        }

        if (image.size > 5 * 1024 * 1024) {
            throw new Error("Image must not exceed 5MB.");
        }

        message.textContent = "Uploading image...";

        const safeName = image.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const imagePath = `${user.id}/${crypto.randomUUID()}-${safeName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("product-images")
            .upload(imagePath, image, {
                cacheControl: "3600",
                upsert: false
            });

        if (uploadError) throw uploadError;

        uploadedImagePath = uploadData.path;

        const { data: urlData } = supabase.storage
            .from("product-images")
            .getPublicUrl(uploadedImagePath);

        const imageUrl = urlData.publicUrl;

        message.textContent = "Saving product...";

        const { error: insertError } = await supabase
            .from("products")
            .insert({
                seller_id: user.id,
                name,
                price,
                category,
                condition,
                location,
                description,
                image_url: imageUrl
            });

        if (insertError) throw insertError;

        message.style.color = "green";
        message.textContent = "Product uploaded successfully!";

        productForm.reset();

    } catch (error) {
        console.error("Product upload error:", error);

        if (uploadedImagePath) {
            await supabase.storage
                .from("product-images")
                .remove([uploadedImagePath]);
        }

        message.style.color = "red";
        message.textContent = error.message || "Something went wrong.";

    } finally {
        button.disabled = false;
        button.textContent = "Submit Product";
    }
});
