const formTitle = document.getElementById("form-title");
const submitBtn = document.getElementById("submit-btn");
const toggleLink = document.getElementById("toggle-link");
const userForm = document.getElementById("user-form");

let isSignUp = true;

toggleLink.addEventListener("click", () => {
    isSignUp = !isSignUp;
    formTitle.textContent = isSignUp ? "Sign Up" : "Log In";
    submitBtn.textContent = isSignUp ? "Sign Up" : "Log In";
    toggleLink.textContent = isSignUp ? "Log In" : "Sign Up";
});

userForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    
    if (isSignUp) {
        signup(username, password);
    } else {
        login(username, password);
    }
});

async function signup(username, password) {
    try {
        const response = await fetch('http://localhost:8080/dailyBugle/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            window.location.href = "index.html";
        } else {
            const errorText = await response.text();
            alert(`Signup failed: ${errorText}`);
        }
    } catch (error) {
        console.error("Error during signup:", error);
        alert("An error occurred during signup. Please try again.");
    }
}

async function login(username, password) {
    try {
        const response = await fetch('http://localhost:8080/dailyBugle/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const role = (await response.json()).role
            if (role === 'reader') window.location.href = "reader.html"
            else if (role === 'author') window.location.href = "author.html"
            else window.location.href = "index.html";
        } else {
            const errorText = await response.text();
            alert(`Login failed: ${errorText}`);
        }
    } catch (error) {
        console.error("Error during login:", error);
        alert("An error occurred during login. Please try again.");
    }
}
