import { useEffect, useState } from "react"
import MockUserImg from "./assets/MockUserImg.jpg"

export function useProfilePhoto() {
    const [avatar, setAvatar] = useState(MockUserImg)

    useEffect(() => {
        let currentUrl = ""

        const fetchPhoto = async () => {
            try {
                const response = await fetch("http://localhost:18080/get_profile_photo", {
                    method: 'GET',
                    credentials: 'include' 
                })

                if (response.ok) {
                    const imageBlob = await response.blob()
                    
                    if (currentUrl && currentUrl.startsWith("blob:")) 
                        URL.revokeObjectURL(currentUrl)
                    
                    currentUrl = URL.createObjectURL(imageBlob)
                    setAvatar(currentUrl)
                } 
            } catch (error) {}
        }

        fetchPhoto()

        window.addEventListener('avatar-updated', fetchPhoto)

        return () => {
            window.removeEventListener('avatar-updated', fetchPhoto)
            if (currentUrl && currentUrl.startsWith("blob:")) 
                URL.revokeObjectURL(currentUrl)       
        }
    }, [])
    
    return avatar
}