const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

// Login with Google
loginBtn.onclick = async () => {
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: window.location.origin
        }
    });

    if (error) console.log(error);
};

// Logout
logoutBtn.onclick = async () => {
    await supabaseClient.auth.signOut();
    window.location.reload();
};

// Check Auth State
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
        loginBtn.classList.add("hidden");
        logoutBtn.classList.remove("hidden");
    } else {
        loginBtn.classList.remove("hidden");
        logoutBtn.classList.add("hidden");
    }
});
