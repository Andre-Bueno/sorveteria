// auth.js

// Importe as funções necessárias dos SDKs do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
    getAuth,
    // FUNÇÕES DE CADASTRO E LOGIN
    createUserWithEmailAndPassword, // <-- ADICIONADO PARA CADASTRO
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js"; // <-- ADICIONADO setDoc

// A configuração do seu aplicativo da web do Firebase (mantenha a sua)
const firebaseConfig = {
    apiKey: "AIzaSyBl4eXhkSPJMNXIMShKH2d447_q3kd2fO8", // Cuidado ao expor sua chave. Considere usar regras de segurança.
    authDomain: "mvpsorvetria.firebaseapp.com",
    projectId: "mvpsorvetria",
    storageBucket: "mvpsorvetria.firebasestorage.app",
    messagingSenderId: "976443256656",
    appId: "1:976443256656:web:e71c8567f66e5d54320655",
    measurementId: "G-55TYKSB5WN"
};

// Inicialize o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==========================================================
// --- LÓGICA DA PÁGINA DE CADASTRO (NOVO CÓDIGO) ---
// ==========================================================

// Pega os elementos da página de CADASTRO
const registerNameInput = document.getElementById('register-name');
const registerEmailInput = document.getElementById('register-email');
const registerPasswordInput = document.getElementById('register-password');
const registerConfirmPasswordInput = document.getElementById('register-confirm-password');
const registerButton = document.getElementById('register-btn');
const registerErrorMessage = document.getElementById('register-error-message');

// Adiciona o "ouvinte" para o clique no botão de REGISTRAR
// O 'if' garante que este código só execute se o botão existir na página
if (registerButton) {
    registerButton.addEventListener('click', () => {
        const name = registerNameInput.value.trim();
        const email = registerEmailInput.value.trim();
        const password = registerPasswordInput.value;
        const confirmPassword = registerConfirmPasswordInput.value;

        registerErrorMessage.textContent = ''; // Limpa erros

        // Validações
        if (!name || !email || !password || !confirmPassword) {
            registerErrorMessage.textContent = 'Por favor, preencha todos os campos.';
            return;
        }
        if (password !== confirmPassword) {
            registerErrorMessage.textContent = 'As senhas não coincidem.';
            return;
        }
        if (password.length < 6) {
            registerErrorMessage.textContent = 'A senha deve ter pelo menos 6 caracteres.';
            return;
        }

        // Tenta criar o usuário com o Firebase Auth
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log('Usuário criado com sucesso no Auth:', user.uid);
                
                // Agora, salve as informações adicionais (nome, função) no Firestore
                // Usamos setDoc para criar um novo documento para este usuário
                return setDoc(doc(db, "users", user.uid), {
                    name: name,
                    email: email,
                    role: 'user' // Define uma função padrão. Mude para 'admin' se necessário.
                });
            })
            .then(() => {
                console.log('Dados do usuário salvos no Firestore!');
                alert('Cadastro realizado com sucesso! Você será redirecionado para o login.');
                window.location.href = 'login.html'; // Redireciona para a página de login
            })
            .catch((error) => {
                console.error('Erro no cadastro:', error.code, error.message);
                if (error.code === 'auth/email-already-in-use') {
                    registerErrorMessage.textContent = 'Este e-mail já está em uso.';
                } else if (error.code === 'auth/invalid-email') {
                    registerErrorMessage.textContent = 'O formato do e-mail é inválido.';
                } else {
                    registerErrorMessage.textContent = 'Ocorreu um erro ao tentar criar a conta.';
                }
            });
    });
}


// ==========================================================
// --- LÓGICA DA PÁGINA DE LOGIN (SEU CÓDIGO ORIGINAL) ---
// ==========================================================

// Pega os elementos da página de LOGIN
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const loginButton = document.getElementById('login-btn');
const loginErrorMessage = document.getElementById('login-error-message');
const forgotPasswordLink = document.getElementById('forgot-password-link');

// Função para verificar a função (role) do usuário no Firestore
const checkUserRole = async (user) => {
    const userDocRef = doc(db, "users", user.uid);
    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const userData = docSnap.data();
            if (userData.role === 'admin') {
                console.log('Acesso de administrador concedido.');
                window.location.href = 'admin.html';
            } else {
                loginErrorMessage.textContent = 'Acesso negado. Você não tem permissão de administrador.';
                auth.signOut(); // Desloga o usuário sem permissão
            }
        } else {
            loginErrorMessage.textContent = 'Acesso negado. Perfil de usuário não encontrado.';
            auth.signOut();
        }
    } catch (error) {
        console.error("Erro ao verificar a função do usuário:", error);
        loginErrorMessage.textContent = 'Erro ao verificar permissões.';
        auth.signOut();
    }
};

// Adiciona um "ouvinte" para o clique no botão de login
if (loginButton) {
    loginButton.addEventListener('click', () => {
        const email = loginEmailInput.value;
        const password = loginPasswordInput.value;
        loginErrorMessage.textContent = '';

        if (!email || !password) {
            loginErrorMessage.textContent = 'Por favor, preencha o e-mail e a senha.';
            return;
        }

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                console.log('Login realizado com sucesso, verificando função...', userCredential.user.uid);
                checkUserRole(userCredential.user);
            })
            .catch((error) => {
                console.error('Erro no login:', error.code, error.message);
                if (error.code === 'auth/invalid-credential') {
                    loginErrorMessage.textContent = 'E-mail ou senha inválidos.';
                } else {
                    loginErrorMessage.textContent = 'Ocorreu um erro ao tentar fazer login.';
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
