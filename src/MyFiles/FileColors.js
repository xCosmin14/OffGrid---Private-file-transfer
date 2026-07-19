// fileColors.js

const extensionColors = {
    // 📄 Documente
        Pdf: "#E53935",
    Doc: "#1E88E5", Docx: "#1E88E5", Odt: "#1E88E5", Wpd: "#1E88E5", Pages: "#1E88E5", Tex: "#1E88E5",
    Xls: "#43A047", Xlsx: "#43A047", Csv: "#43A047", Ods: "#43A047", Numbers: "#43A047", Tsv: "#43A047",
    Ppt: "#F4511E", Pptx: "#F4511E", Odp: "#F4511E", Key: "#F4511E",
    Rtf: "#8E24AA", Epub: "#8E24AA", Mobi: "#8E24AA", Djvu: "#8E24AA",
    Txt: "#757575", Md: "#757575", Log: "#757575",
 
    // 🎵 Audio
    Wav: "#00ACC1", Flac: "#00ACC1", Mp3: "#00ACC1", Ogg: "#00ACC1", Alac: "#00ACC1", Aac: "#00ACC1", M4a: "#00ACC1",
    Wma: "#00ACC1", Aiff: "#00ACC1", Aif: "#00ACC1", Opus: "#00ACC1", Amr: "#00ACC1", Ac3: "#00ACC1", Caf: "#00ACC1",
    Mid: "#00ACC1", Midi: "#00ACC1",
 
    // 🎚️ Proiecte audio (DAW)
    Flp: "#FF6600",           
    Als: "#26C6DA", Alp: "#26C6DA", Adg: "#26C6DA",
    Logicx: "#5E5CE6",         
    Cpr: "#0288D1",            
    Song: "#00AEEF",           
    Rpp: "#8DC63F",           
    Bwproject: "#00BCD4", Bwpreset: "#00BCD4",
    Ptx: "#7A2182", Pts: "#7A2182", 
    Band: "#42A5F5",           
 
    // 🎬 Video
    Mp4: "#D81B60", Mov: "#D81B60", Mkv: "#D81B60", Avi: "#D81B60", Wmv: "#D81B60", Flv: "#D81B60", Webm: "#D81B60",
    M4v: "#D81B60", Mpg: "#D81B60", Mpeg: "#D81B60", "3gp": "#D81B60", Vob: "#D81B60", Mts: "#D81B60", M2ts: "#D81B60", Ogv: "#D81B60",
 
    // 🖼️ Imagini
    Jpg: "#FDD835", Jpeg: "#FDD835", Png: "#FDD835", Gif: "#FDD835", Bmp: "#FDD835", Tiff: "#FDD835", Tif: "#FDD835",
    Heic: "#FDD835", Heif: "#FDD835", Raw: "#FDD835", Cr2: "#FDD835", Nef: "#FDD835", Arw: "#FDD835", Dng: "#FDD835",
    Ico: "#FDD835", Avif: "#FDD835", Jfif: "#FDD835",
    Svg: "#FFB300",
 
    // 🎨 Design Grafic & UI
    Psd: "#3949AB", Psb: "#3949AB",
    Ai: "#FF8F00", Eps: "#FF8F00",
    Indd: "#D81B60",
    Fig: "#8E24AA",
    Sketch: "#FBC02D",
    Xd: "#FF4081",
    Xcf: "#5C6BC0",             
    Afdesign: "#00838F", Afphoto: "#00838F", Afpub: "#00838F", 
    Procreate: "#FF6F00",
    Clip: "#EC407A",            
    Kra: "#26A69A",             
 
    // 💻 Cod & Web
    Html: "#E65100",
    Css: "#1565C0",
    Js: "#FFD600",
    Jsx: "#61DAFB",
    Ts: "#1976D2", Tsx: "#1976D2",
    Py: "#0277BD",
    Java: "#D84315",
    C: "#283593", Cpp: "#283593", Cs: "#4527A0",
    Php: "#6A1B9A",
    Json: "#558B2F", Xml: "#558B2F", Toml: "#558B2F", Ini: "#558B2F", Cfg: "#558B2F", Env: "#558B2F",
    Sql: "#0277BD",
    Sh: "#4CAF50", Bat: "#4CAF50", Cmd: "#4CAF50",
    Ps1: "#012456",             
    Yaml: "#D32F2F", Yml: "#D32F2F",
    Rb: "#CC342D",             
    Go: "#00ADD8",
    Rs: "#CE422B",              
    Swift: "#FA7343",
    Kt: "#7F52FF", Kts: "#7F52FF", 
    Dart: "#0175C2",
    R: "#276DC3",
    Vue: "#42B883",
    Svelte: "#FF3E00",
    Lua: "#2C2D72",
    Pl: "#39457E",              
    Vb: "#945DB7",
    Ipynb: "#F37626",          
    Wasm: "#654FF0",           
    Graphql: "#E10098", Gql: "#E10098",
 
    // 🧊 Design 3D & CAD
    Obj: "#6D4C41", Fbx: "#6D4C41", Stl: "#6D4C41", Ply: "#6D4C41", "3ds": "#6D4C41",
    Blend: "#F57C00",
    Dwg: "#006064", Dxf: "#006064", Max: "#006064", Ma: "#006064", Mb: "#006064", Step: "#006064", Stp: "#006064", Iges: "#006064", Igs: "#006064",
    C4d: "#14213D",            
    Gltf: "#8BC34A", Glb: "#8BC34A",
    Usdz: "#0091EA",
    Skp: "#0A6FBF",            
 
    // 📦 Arhive & Compresie
    Zip: "#8D6E63", Rar: "#8D6E63", "7z": "#8D6E63", Tar: "#8D6E63", Gz: "#8D6E63",
    Bz2: "#8D6E63", Xz: "#8D6E63", Tgz: "#8D6E63", Cab: "#8D6E63",
 
    // ⚙️ Executabile, Sistem & Diverse
    Exe: "#455A64", Msi: "#455A64", Apk: "#388E3C", Dmg: "#455A64", Pkg: "#455A64", Iso: "#455A64",
    Dll: "#455A64", Sys: "#455A64", Dat: "#757575", Bin: "#757575", Application: "#455A64",
    Deb: "#A80030", Rpm: "#EE0000",
    Torrent: "#5C6BC0", Ics: "#0288D1", Vcf: "#00897B",

}

const generateColorFromText = (text) => {
    let hash = 0
    for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash)
    }
    
    let color = '#'
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF
        color += ("00" + value.toString(16)).slice(-2)
    }
    return color
}

export const getFileColor = (extension) => {
    if (!extension) return "#9E9E9E" 
    
    const formattedExt = extension.charAt(0).toUpperCase() + extension.slice(1).toLowerCase()

    if (extensionColors[formattedExt]) {
        return extensionColors[formattedExt]
    }

    return generateColorFromText(formattedExt)
}