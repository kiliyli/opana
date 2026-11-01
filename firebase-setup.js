// Подключение к Firebase: вход по секретному коду и общий альбом Юли и Саши.
// ВАЖНО: вставь свои данные из консоли Firebase в firebaseConfig (инструкция в чате).

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
    getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
    getFirestore, collection, addDoc, getDocs, deleteDoc, doc,
    query, orderBy, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyAWTfucJA5wCc0R6BpGzzsqJt0eHfHmChM",
  authDomain: "kiliyli.firebaseapp.com",
  projectId: "kiliyli",
  storageBucket: "kiliyli.firebasestorage.app",
  messagingSenderId: "610310384391",
  appId: "1:610310384391:web:91931a336223e255fb33a2",
  measurementId: "G-LS8CCXFWNJ"
};

export const isConfigured = firebaseConfig.apiKey !== 'ВСТАВЬ_СЮДА';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Два аккаунта. Почты выдуманные, настоящие письма на них не уходят.
// Пароль каждого аккаунта и есть секретный код (его ты задашь в консоли Firebase).
export const USERS = {
    yulya: { email: 'yulya@gallery.local', label: 'Юля' },
    sasha: { email: 'sasha@gallery.local', label: 'Саша' }
};

export function userKeyByEmail(email) {
    return Object.keys(USERS).find(function (key) {
        return USERS[key].email === email;
    }) || null;
}

export function login(userKey, code) {
    return signInWithEmailAndPassword(auth, USERS[userKey].email, code);
}

export function logout() {
    return signOut(auth);
}

export function onUser(callback) {
    return onAuthStateChanged(auth, callback);
}

// Сохраняем фото в общий альбом. image — маленький JPEG в виде data URL.
export function savePhoto(dataUrl) {
    const user = auth.currentUser;
    const owner = user ? userKeyByEmail(user.email) : null;
    if (!owner) {
        return Promise.reject(new Error('нет входа'));
    }
    return addDoc(collection(db, 'photos'), {
        owner: owner,
        image: dataUrl,
        createdAt: serverTimestamp()
    });
}

export async function loadPhotos() {
    const snapshot = await getDocs(query(collection(db, 'photos'), orderBy('createdAt', 'desc')));
    return snapshot.docs.map(function (item) {
        const data = item.data();
        return {
            id: item.id,
            owner: data.owner,
            image: data.image,
            createdAt: data.createdAt ? data.createdAt.toDate() : null
        };
    });
}

// Удаляем фото вместе с его комментариями (сами по себе комментарии не удаляются)
export async function removePhoto(id) {
    const comments = await getDocs(collection(db, 'photos', id, 'comments'));
    await Promise.all(comments.docs.map(function (item) {
        return deleteDoc(item.ref);
    }));
    await deleteDoc(doc(db, 'photos', id));
}

// Кто сейчас вошёл: 'yulya', 'sasha' или null
export function currentUserKey() {
    const user = auth.currentUser;
    return user ? userKeyByEmail(user.email) : null;
}

// ===== комментарии к фото =====
export async function loadComments(photoId) {
    const snapshot = await getDocs(
        query(collection(db, 'photos', photoId, 'comments'), orderBy('createdAt', 'asc'))
    );
    return snapshot.docs.map(function (item) {
        const data = item.data();
        return {
            id: item.id,
            owner: data.owner,
            text: data.text,
            createdAt: data.createdAt ? data.createdAt.toDate() : null
        };
    });
}

export function addComment(photoId, text) {
    const owner = currentUserKey();
    if (!owner) {
        return Promise.reject(new Error('нет входа'));
    }
    return addDoc(collection(db, 'photos', photoId, 'comments'), {
        owner: owner,
        text: text,
        createdAt: serverTimestamp()
    });
}

export function removeComment(photoId, commentId) {
    return deleteDoc(doc(db, 'photos', photoId, 'comments', commentId));
}
