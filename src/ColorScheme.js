const savedTheme = localStorage.getItem("theme") ? localStorage.getItem("theme") : "light";
document.documentElement.setAttribute("data-theme", savedTheme);

const getUID = () => {
    return (localStorage.getItem("isLogged") == "true" || null)
}