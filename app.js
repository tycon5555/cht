// SELECT BUTTONS
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

// ------------------------------
// LOGIN WITH GOOGLE
// ------------------------------
loginBtn.onclick = async () => {
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: window.location.origin   // After login return to your domain
        }
    });

    if (error) console.log("Login error:", error);
};

// ------------------------------
// LOGOUT
// ------------------------------
logoutBtn.onclick = async () => {
    await supabaseClient.auth.signOut();
    window.location.reload();
};

// ------------------------------
// AUTH STATE CHECK
// ------------------------------
supabaseClient.auth.onAuthStateChange(async (event, session) => {

    if (session?.user) {
        // USER LOGGED IN
        loginBtn.classList.add("hidden");
        logoutBtn.classList.remove("hidden");

        // CHECK IF PROFILE EXISTS
        const { data, error } = await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

        // IF NO PROFILE → REDIRECT TO PROFILE SETUP
        if (!data) {
            // Avoid infinite redirect loop
            if (!window.location.pathname.includes("profile.html")) {
                window.location.href = "profile.html";
            }
        }

    } else {
        // USER LOGGED OUT
        loginBtn.classList.remove("hidden");
        logoutBtn.classList.add("hidden");
    }
});

// ------------------------------
// OPTIONAL: GET LOGGED-IN USER
// ------------------------------
async function getUser() {
    const { data } = await supabaseClient.auth.getUser();
    return data?.user || null;
}

