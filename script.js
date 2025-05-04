document.getElementById("passportForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = {
        has_passport: formData.get("has_passport"),
        signature: formData.get("signature"),
        applicationDate: formData.get("applicationDate"),
    };

    try {
        const res = await fetch("https://chcdnmncmytcbiujjkrp.supabase.co/rest/v1/passport_applications", {
            method: "POST",
            headers: {
                "apikey": "your-api-key-here",
                "Authorization": "Bearer your-api-key-here",
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
            },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            window.location.href = "payment.html";
        } else {
            alert("Failed to submit application.");
        }
    } catch (err) {
        alert("An error occurred.");
        console.error(err);
    }
});