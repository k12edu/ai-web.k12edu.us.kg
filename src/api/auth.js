import { ref } from "vue";

export function useAuth() {
    const isLogIn = ref(true);

    function logout() {
        isLogIn.value = false;
    }

    return {
        isLogIn,
        logout,
    };
}
