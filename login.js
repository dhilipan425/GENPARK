
const CLIENT_ID =
  "234332844737-b1omn8f8rndmo7jp50j0tot4t1hb9p7c.apps.googleusercontent.com";

const statusText = document.getElementById("status");
const googleButton = document.getElementById("google-button");

function handleCredentialResponse(response) {
  if (!response || !response.credential) {
    statusText.textContent = "Google sign-in failed. Please try again.";
    return;
  }

  // Store the Google ID token for the next page.
  // This is a front-end demo, not secure server-side authentication.
  sessionStorage.setItem("genparkGoogleCredential", response.credential);

  statusText.textContent = "Login successful! Opening GENPARK...";

  window.location.href = "loading.html";
}

function initializeGoogleLogin() {
  if (!window.google || !window.google.accounts) {
    statusText.textContent =
      "Google Sign-In could not load. Check your internet connection.";
    return;
  }

  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: handleCredentialResponse
  });

  google.accounts.id.renderButton(googleButton, {
    theme: "outline",
    size: "large",
    shape: "pill",
    text: "signin_with",
    width: 280
  });
}

window.addEventListener("load", initializeGoogleLogin);
