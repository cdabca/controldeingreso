document.addEventListener('DOMContentLoaded', () => {
    const supabaseUrl = 'URL_DE_TU_PROYECTO_SUPABASE';
    const supabaseKey = 'TU_SUPABASE_ANON_KEY';
    
    // Validar que las credenciales de Supabase estén presentes
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('URL') || supabaseKey.includes('KEY')) {
        console.error("Error: Las credenciales de Supabase no están configuradas en auth.js.");
        alert("Error de configuración: Por favor, contacta al administrador.");
        return;
    }

    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const authAlert = document.getElementById('auth-alert');

    // Función para mostrar alertas de autenticación
    function showAuthAlert(message, isError = true) {
        authAlert.textContent = message;
        authAlert.className = isError ? 'alert alert-error show' : 'alert alert-success show';
    }

    // Comprobar si hay una sesión activa al cargar la página
    async function checkSession() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            loginContainer.classList.add('hidden');
            appContainer.classList.remove('hidden');
        } else {
            loginContainer.classList.remove('hidden');
            appContainer.classList.add('hidden');
        }
    }

    // Manejar el inicio de sesión
    loginButton.addEventListener('click', async () => {
        const email = emailInput.value;
        const password = passwordInput.value;

        if (!email || !password) {
            showAuthAlert('Por favor, ingresa correo y contraseña.');
            return;
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            showAuthAlert(`Error: ${error.message}`);
        } else {
            showAuthAlert('Inicio de sesión exitoso.', false);
            loginContainer.classList.add('hidden');
            appContainer.classList.remove('hidden');
        }
    });

    // Manejar el cierre de sesión
    logoutButton.addEventListener('click', async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            alert(`Error al cerrar sesión: ${error.message}`);
        } else {
            window.location.reload(); // Recargar la página para volver al login
        }
    });
    
    // Verificar la sesión al cargar la página
    checkSession();
});
