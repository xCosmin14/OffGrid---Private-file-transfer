import { useState } from "react"

export default function isMobile() {
    //if (navigator.userAgentData) return navigator.userAgentData.mobile && window.innerWidth <= 500;  
    //return /Mobi|Android/i.test(navigator.userAgent) && window.innerWidth <= 500;

    //metoda de mai sus o sa fie implementata cand termin designul
    return window.innerWidth <= 500;
}