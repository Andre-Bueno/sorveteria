// Importe as funções necessárias dos SDKs do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// A configuração do seu aplicativo da web do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBerEbWZfzczjrvX7TK5nS6MfeRU-qJ-HU",
    authDomain: "bdsorveteria-2690d.firebaseapp.com",
    projectId: "bdsorveteria-2690d",
    storageBucket: "bdsorveteria-2690d.firebasestorage.app",
    messagingSenderId: "1004178621874",
    appId: "1:1004178621874:web:d8d83047045d2ba93e50ab",
    measurementId: "G-SMW22TX942"
};

// Inicialize o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Inicializa o Firestore

// --- LÓGICA DA PÁGINA DE LOGIN ---

// Pega os elementos do HTML
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const loginButton = document.getElementById('login-btn');
const errorMessageElement = document.getElementById('login-error-message');
const forgotPasswordLink = document.getElementById('forgot-password-link');

// Função para verificar a função (role) do usuário no Firestore
const checkUserRole = async (user) => {
    // Cria uma referência para o documento do usuário na coleção 'users'
    const userDocRef = doc(db, "users", user.uid);
    try {
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
            const userData = docSnap.data();
            // Verifica se a função do usuário é 'admin'
            if (userData.role === 'admin') {
                console.log('Acesso de administrador concedido.');
                window.location.href = 'admin.html'; // Redireciona para a página de admin
            } else {
                errorMessageElement.textContent = 'Acesso negado. Você não tem permissão de administrador.';
            }
        } else {
            // Documento do usuário não encontrado no Firestore
            errorMessageElement.textContent = 'Acesso negado. Perfil de usuário não encontrado.';
        }
    } catch (error) {
        console.error("Erro ao verificar a função do usuário:", error);
        errorMessageElement.textContent = 'Erro ao verificar permissões.';
    }
};


// Adiciona um "ouvinte" para o clique no botão de login
if (loginButton) {
    loginButton.addEventListener('click', () => {
        const email = loginEmailInput.value;
        const password = loginPasswordInput.value;
        errorMessageElement.textContent = ''; // Limpa mensagens de erro antigas

        if (!email || !password) {
            errorMessageElement.textContent = 'Por favor, preencha o e-mail e a senha.';
            return;
        }

        // Tenta fazer o login com o Firebase Auth
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Login bem-sucedido, agora verifica a função do usuário
                console.log('Login realizado com sucesso, verificando função...', userCredential.user.uid);
                checkUserRole(userCredential.user);
            })
            .catch((error) => {
                // Ocorreu um erro no login
                console.error('Erro no login:', error.code, error.message);
                if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                    errorMessageElement.textContent = 'E-mail ou senha inválidos.';
                } else {
                    errorMessageElement.textContent = 'Ocorreu um erro ao tentar fazer login.';
                }
            });
    });
}

// Adiciona a funcionalidade de "Esqueci a senha"
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        const email = loginEmailInput.value;

        if (!email) {
            alert('Por favor, digite seu e-mail no campo correspondente para redefinir a senha.');
            return;
        }

        sendPasswordResetEmail(auth, email)
            .then(() => {
                alert('E-mail de redefinição de senha enviado! Verifique sua caixa de entrada.');
            })
            .catch((error) => {
                console.error('Erro ao enviar e-mail de redefinição:', error);
                alert('Erro ao enviar e-mail de redefinição. Verifique se o e-mail está correto.');
            });
    });
}
