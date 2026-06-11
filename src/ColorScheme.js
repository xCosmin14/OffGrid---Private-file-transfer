const savedTheme = localStorage.getItem("theme") ? localStorage.getItem("theme") : "light";
document.documentElement.setAttribute("data-theme", savedTheme);

const getUID = () => {
    return localStorage.getItem("UID") || null;
    //se mai fac verificari server side daca este vreo sesiune care inca ruleaza cu UID-ul si credentialele dispozitivului 
}