export default function isMobile() {
    if (navigator.userAgentData) return navigator.userAgentData.mobile && window.innerWidth <= 500
    return /Mobi|Android/i.test(navigator.userAgent) && window.innerWidth <= 500

    return window.innerWidth <= 500
}