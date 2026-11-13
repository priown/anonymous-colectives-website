/* =============================================================================
   ANONYMOUS COLLECTIVES — contact.js
   Wires up the contact cards and the enquiry form (which opens WhatsApp).
============================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  // WhatsApp
  $("wa-number").textContent = SITE.whatsappDisplay;
  $("wa-btn").href = AC.waLink("Hello Anonymous Collectives!");

  // TikTok
  $("tt-handle").textContent = SITE.social.tiktok.handle;
  $("tt-btn").href = SITE.social.tiktok.url;

  // Instagram: hidden until a real URL is set in SITE.social.instagram (js/products.js)
  const ig = SITE.social.instagram;
  if (ig.url) {
    $("ig-handle").textContent = ig.handle;
    $("ig-btn").href = ig.url;
  } else {
    $("ig-card").classList.add("hidden");
    $("contact-cards").classList.replace("md:grid-cols-3", "md:grid-cols-2");
  }

  // Enquiry form -> pre-filled WhatsApp message
  $("enquiry-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("enq-name").value.trim();
    const topic = $("enq-topic").value;
    const message = $("enq-message").value.trim();
    const status = $("enq-status");
    $("enq-message").classList.remove("field-error");
    if (!message) {
      $("enq-message").classList.add("field-error");
      status.textContent = "Write your message first, then send it.";
      status.className = "min-h-[1.25rem] text-sm msg-err";
      return;
    }
    const text = ["Hello Anonymous Collectives!", "", name ? `My name is ${name}.` : "", `Topic: ${topic}`, "", message]
      .filter((l, i, a) => l !== "" || (a[i - 1] !== "" && i !== 0))
      .join("\n");
    status.textContent = "Opening WhatsApp. Press send there to deliver your message.";
    status.className = "min-h-[1.25rem] text-sm msg-info";
    const url = AC.waLink(text);
    const win = window.open(url, "_blank", "noopener");
    if (!win) window.location.href = url;
  });

  AC.reveal();
  AC.icons();
});
