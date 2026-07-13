const savedTheme = localStorage.getItem("theme") ? localStorage.getItem("theme") : "light";
document.documentElement.setAttribute("data-theme", savedTheme);

export const getUID = () => {
    return (localStorage.getItem("isLogged") == "true" || null)
}