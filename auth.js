// --- INÍCIO: CONFIGURAÇÃO E INICIALIZAÇÃO DO FIREBASE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// SUAS CONFIGURAÇÕES DO FIREBASE AQUI
const firebaseConfig = {
    apiKey: "AIzaSyBerEbWZfzczjrvX7TK5nS6MfeRU-qJ-HU",
    authDomain: "bdsorveteria-2690d.firebaseapp.com",
    projectId: "bdsorveteria-2690d",
    storageBucket: "bdsorveteria-2690d.appspot.com",
    messagingSenderId: "1004178621874",
    appId: "1:1004178621874:web:d8d83047045d2ba93e50ab",
    measurementId: "G-SMW22TX942"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// --- FIM: CONFIGURAÇÃO E INICIALIZAÇÃO DO FIREBASE ---

// Função para exibir mensagens (erro ou sucesso)
function showFeedbackMessage(elementId, message, type = 'error') { // 'error' ou 'success'
    const messageElement = document.getElementById(elementId);
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.classList.remove('error-message', 'success-message'); // Remove classes antigas
        if (type === 'error') {
            messageElement.classList.add('error-message');
        } else if (type === 'success') {
            messageElement.classList.add('success-message');
            // Você pode adicionar um CSS para 'success-message' no seu estilo
            // Ex: .success-message { color: var(--cor-sucesso); font-weight: 500; }
        }
        messageElement.style.display = 'block';
    }
}

// Função para limpar mensagens
function clearFeedbackMessage(elementId) {
    const messageElement = document.getElementById(elementId);
    if (messageElement) {
        messageElement.textContent = '';
        messageElement.style.display = 'none';
        messageElement.classList.remove('error-message', 'success-message');
    }
}

// =========================================================
// Lógica de Registro (register.html)
// =========================================================
const registerBtn = document.getElementById('register-btn');
if (registerBtn) {
    registerBtn.addEventListener('click', async () => {
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value.trim();
        const confirmPassword = document.getElementById('register-confirm-password').value.trim();

        clearFeedbackMessage('register-error-message'); // Limpa antes de exibir nova

        if (!name) {
            showFeedbackMessage('register-error-message', 'Por favor, digite seu nome completo.', 'error');
            return;
        }
        if (!email || !password || !confirmPassword) {
            showFeedbackMessage('register-error-message', 'Por favor, preencha todos os campos.', 'error');
            return;
        }
        if (password.length < 6) {
            showFeedbackMessage('register-error-message', 'A senha deve ter no mínimo 6 caracteres.', 'error');
            return;
        }
        if (password !== confirmPassword) {
            showFeedbackMessage('register-error-message', 'As senhas não coincidem.', 'error');
            return;
        }

        try {
            // Cria o usuário no Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Salva o perfil do usuário no Firestore
            await setDoc(doc(db, 'users', user.uid), {
                name: name,
                email: email,
                role: 'customer', // Define o papel padrão como 'customer'
                createdAt: new Date()
            });

            showFeedbackMessage('register-error-message', 'Cadastro realizado com sucesso! Redirecionando para o login...', 'success');
            // Adicionamos um pequeno delay para o usuário ver a mensagem antes de redirecionar
            setTimeout(() => {
                window.location.href = 'login.html'; // Redireciona para a página de login
            }, 2000); // 2 segundos de delay
            
        } catch (error) {
            console.error("Erro ao registrar:", error);
            let errorMessage = "Ocorreu um erro ao registrar. Tente novamente.";
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Este email já está em uso. Tente fazer login ou use outro email.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Formato de email inválido.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Senha muito fraca. Por favor, use uma senha mais forte.';
                    break;
                case 'auth/operation-not-allowed':
                    // Este é um erro CRÍTICO que significa que o provedor Email/Password não está ativado no Firebase Console.
                    errorMessage = 'Erro interno: A operação de email/senha não está permitida. Por favor, ative-a no Firebase Console (Autenticação > Métodos de Login).';
                    break;
                default:
                    errorMessage = 'Erro desconhecido. Verifique sua conexão e tente novamente. Código: ' + error.code;
            }
            showFeedbackMessage('register-error-message', errorMessage, 'error');
        }
    });
}

// =========================================================
// Lógica de Login (login.html)
// =========================================================
const loginBtn = document.getElementById('login-btn');
if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value.trim();

        clearFeedbackMessage('login-error-message'); // Limpa antes de exibir nova

        if (!email || !password) {
            showFeedbackMessage('login-error-message', 'Por favor, preencha todos os campos.', 'error');
            return;
        }

        try {
            // Faz o login do usuário no Firebase Authentication
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Busca o perfil do usuário no Firestore para verificar a função (role)
            const userDoc = await getDoc(doc(db, 'users', user.uid));

            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.role === 'admin') {
                    // Se for admin, redireciona para o painel de administração
                    showFeedbackMessage('login-error-message', 'Login de administrador realizado com sucesso! Redirecionando...', 'success');
                    setTimeout(() => {
                        window.location.href = 'admin-dashboard.html'; // Você criará esta página depois
                    }, 1500);
                } else {
                    // Se for cliente, redireciona para a página principal da loja
                    showFeedbackMessage('login-error-message', 'Login realizado com sucesso! Redirecionando para a loja...', 'success');
                    setTimeout(() => {
                        window.location.href = 'index.html'; // Sua página principal da loja
                    }, 1500);
                }
            } else {
                // Caso o documento do usuário não exista no Firestore (improvável após o registro)
                console.warn("Documento de usuário não encontrado no Firestore para UID:", user.uid);
                showFeedbackMessage('login-error-message', 'Erro ao carregar perfil do usuário. Tente novamente.', 'error');
                await signOut(auth); // Desloga para evitar problemas
            }

        } catch (error) {
            console.error("Erro ao fazer login:", error);
            let errorMessage = "Erro ao fazer login. Verifique seu email e senha.";
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = 'Formato de email inválido.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'Sua conta foi desativada. Entre em contato com o suporte.';
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    errorMessage = 'Email ou senha incorretos.';
                    break;
                case 'auth/operation-not-allowed':
                    // Este é um erro CRÍTICO que significa que o provedor Email/Password não está ativado no Firebase Console.
                    errorMessage = 'Erro interno: A operação de email/senha não está permitida. Por favor, ative-a no Firebase Console (Autenticação > Métodos de Login).';
                    break;
                default:
                    errorMessage = 'Erro desconhecido. Tente novamente. Código: ' + error.code;
            }
            showFeedbackMessage('login-error-message', errorMessage, 'error');
        }
    });
}

// =========================================================
// Lógica de Redefinição de Senha (login.html)
// =========================================================
const forgotPasswordLink = document.getElementById('forgot-password-link');
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        clearFeedbackMessage('login-error-message');

        if (!email) {
            showFeedbackMessage('login-error-message', 'Por favor, digite seu email para redefinir a senha.', 'error');
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
            showFeedbackMessage('login-error-message', 'Um link para redefinir a senha foi enviado para o seu email. Verifique sua caixa de entrada (e spam)!', 'success');
        } catch (error) {
            console.error("Erro ao enviar email de redefinição de senha:", error);
            let errorMessage = "Erro ao enviar email de redefinição. Tente novamente.";
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = 'Formato de email inválido.';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'Nenhuma conta encontrada com este email.';
                    break;
                default:
                    errorMessage = 'Erro desconhecido. Tente novamente. Código: ' + error.code;
            }
            showFeedbackMessage('login-error-message', errorMessage, 'error');
        }
    });
}

// =========================================================
// Lógica de Logout (Pode ser adicionado no index.html ou admin-dashboard.html)
// =========================================================
window.logoutUser = async function() {
    try {
        await signOut(auth);
        alert('Você foi desconectado.'); // Mantive o alert aqui por ser uma ação menos crítica
        window.location.href = 'login.html'; // Redireciona para a página de login após o logout
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
        alert('Erro ao fazer logout. Tente novamente.');
    }
};

// =========================================================
// Gerenciamento de Estado de Autenticação (Pode ser usado em qualquer página)
// =========================================================
onAuthStateChanged(auth, async (user) => {
    // Este bloco é executado sempre que o estado de autenticação muda (login/logout)

    // Exemplo: Se você tiver um link de "Login" e "Registrar" e um botão de "Sair"
    // no seu header (index.html), você pode controlá-los aqui.
    const headerAuthLinks = document.getElementById('header-auth-links'); // Crie uma div com este ID no seu header
    if (headerAuthLinks) {
        if (user) {
            // Usuário logado
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);

            let userName = user.email; // Valor padrão, caso o nome não seja encontrado
            let userRole = 'customer'; // Valor padrão

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                userName = userData.name || user.email;
                userRole = userData.role || 'customer';
            }

            let adminLink = '';
            // Verifique se o usuário é admin ANTES de mostrar o link para o painel
            if (userRole === 'admin') {
                adminLink = '<a href="admin-dashboard.html" style="margin-left: 15px; color: var(--cor-branca); text-decoration: none; font-weight: 600;">Painel Admin</a>';
            }

            headerAuthLinks.innerHTML = `
                <span style="color: var(--cor-branca); margin-right: 15px;">Olá, ${userName}!</span>
                ${adminLink}
                <button onclick="logoutUser()" style="background-color: var(--cor-branca); color: var(--cor-primaria); border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; font-family: 'Poppins', sans-serif; font-weight: 600; transition: background-color 0.3s ease;">Sair</button>
            `;
        } else {
            // Usuário deslogado
            headerAuthLinks.innerHTML = `
                <a href="login.html" style="color: var(--cor-branca); text-decoration: none; margin-right: 15px; font-weight: 600;">Login</a>
                <a href="register.html" style="color: var(--cor-branca); text-decoration: none; font-weight: 600;">Registrar</a>
            `;
        }
    }
});