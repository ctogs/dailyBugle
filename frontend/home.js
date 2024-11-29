document.addEventListener("DOMContentLoaded", async function () {
  try {
      const response = await fetch('http://localhost:8080/dailyBugle/auth/userInfo', {
          method: 'GET',
          credentials: 'include' // Ensure cookies are sent
      });

      if (response.ok) {
          const userInfo = await response.json();
          displayRoleIndicator(userInfo.role);
      } else {
          // Default to anonymous if user info can't be retrieved
          displayRoleIndicator("anonymous");
      }
  } catch (error) {
      console.error("Error fetching user info:", error);
      displayRoleIndicator("anonymous");
  }
});

function displayRoleIndicator(role) {
  const roleIndicator = document.createElement("p");
  roleIndicator.textContent = `You are a ${role.charAt(0).toUpperCase() + role.slice(1)}`;
  document.body.appendChild(roleIndicator);
}
