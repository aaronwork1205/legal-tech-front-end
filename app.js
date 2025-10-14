// Toggle between sign-in, sign-up, and verification tabs
const tabButtons = document.querySelectorAll(".auth-tabs .tab");
const forms = document.querySelectorAll(".auth-forms .form");

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.dataset.target;

    tabButtons.forEach((tab) => tab.classList.toggle("active", tab === button));
    forms.forEach((form) => {
      form.classList.toggle("active", form.id === targetId);
    });
  });
});

// Simulate submitting forms; swap with real API later
document.querySelectorAll(".auth-forms form").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const submitButton = form.querySelector("button[type='submit']");
    const original = submitButton.textContent;
    submitButton.textContent = "Processing...";
    submitButton.disabled = true;

    // Mock network request
    setTimeout(() => {
      submitButton.textContent = original;
      submitButton.disabled = false;
      alert("Submitted. Wire this form to your production auth service next.");
    }, 1200);
  });
});

// Simple chat showcase
const chatForm = document.querySelector(".chat-input");
const chatHistory = document.querySelector(".chat-history");

if (chatForm && chatHistory) {
  chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const textarea = chatForm.querySelector("textarea");
    const text = textarea.value.trim();
    if (!text) return;

    appendMessage({
      role: "user",
      content: text,
    });

    textarea.value = "";

    setTimeout(() => {
      appendMessage({
        role: "ai",
        content:
          "Noted your request—I'm matching the right attorney now. Feel free to book a quick diagnostic call.",
      });
    }, 800);
  });
}

function appendMessage({ role, content }) {
  const message = document.createElement("div");
  message.className = `chat-message ${role}`;
  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = role === "user" ? "You · just now" : "LexiFlow · just now";
  const text = document.createElement("p");
  text.textContent = content;
  message.append(meta, text);
  chatHistory.appendChild(message);
  chatHistory.scrollTo({
    top: chatHistory.scrollHeight,
    behavior: "smooth",
  });
}
