export const extensionToLanguage = {
    ".js": "javascript",
    ".mjs": "javascript",
    ".cjs": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".html": "xml",
    ".htm": "xml",
    ".xml": "xml",
    ".css": "css",
    ".scss": "scss",
    ".less": "less",
    ".vue": "xml",
    ".svelte": "xml",

    ".json": "json",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".ini": "ini",
    ".toml": "ini",
    ".env": "bash",

    ".py": "python",
    ".java": "java",
    ".c": "c",
    ".h": "c",
    ".cpp": "cpp",
    ".cxx": "cpp",
    ".cc": "cpp",
    ".hpp": "cpp",
    ".cs": "csharp",
    ".php": "php",
    ".rb": "ruby",
    ".rs": "rust",
    ".go": "go",
    ".kt": "kotlin",
    ".kts": "kotlin",
    ".swift": "swift",
    ".m": "objectivec",
    ".mm": "objectivec",
    ".r": "r",
    ".dart": "dart",
    ".scala": "scala",
    ".lua": "lua",
    ".pl": "perl",
    ".pm": "perl",

    ".sh": "bash",
    ".bash": "bash",
    ".zsh": "bash",
    ".ps1": "powershell",
    ".bat": "dos",
    ".cmd": "dos",

    ".sql": "sql",
    ".pgsql": "pgsql",
    ".graphql": "graphql",
    ".gql": "graphql",

    ".md": "markdown",
    ".markdown": "markdown",
    ".tex": "latex",
    ".adoc": "asciidoc",
    ".asciidoc": "asciidoc",

    ".cmake": "cmake",
    ".dockerfile": "dockerfile",
    ".makefile": "makefile",
    ".mk": "makefile",
    ".gradle": "gradle",
    ".groovy": "groovy",
    ".hs": "haskell",
    ".clj": "clojure",
    ".cljs": "clojure",
    ".elm": "elm",
    ".erl": "erlang",
    ".ex": "elixir",
    ".exs": "elixir",
    ".f90": "fortran",
    ".f": "fortran",
    ".fs": "fsharp",
    ".asm": "x86asm",
    ".s": "armasm",
    ".v": "verilog",
    ".vhd": "vhdl",
    ".vhdl": "vhdl",
    ".wasm": "wasm",
    ".proto": "protobuf"
};

const extensionColors = {
    Pdf: "#E53935",
    Doc: "#1E88E5", Docx: "#1E88E5", Odt: "#1E88E5", Wpd: "#1E88E5", Pages: "#1E88E5", Tex: "#1E88E5",
    Xls: "#43A047", Xlsx: "#43A047", Csv: "#43A047", Ods: "#43A047", Numbers: "#43A047", Tsv: "#43A047",
    Ppt: "#F4511E", Pptx: "#F4511E", Odp: "#F4511E", Key: "#F4511E",
    Rtf: "#8E24AA", Epub: "#8E24AA", Mobi: "#8E24AA", Djvu: "#8E24AA",
    Txt: "#757575", Md: "#757575", Markdown: "#757575", Log: "#757575", Adoc: "#757575", Asciidoc: "#757575",

    Wav: "#00ACC1", Flac: "#00ACC1", Mp3: "#00ACC1", Ogg: "#00ACC1", Alac: "#00ACC1", Aac: "#00ACC1", M4a: "#00ACC1",
    Wma: "#00ACC1", Aiff: "#00ACC1", Aif: "#00ACC1", Opus: "#00ACC1", Amr: "#00ACC1", Ac3: "#00ACC1", Caf: "#00ACC1",
    Mid: "#00ACC1", Midi: "#00ACC1",
    Flp: "#FF6600",
    Als: "#26C6DA", Alp: "#26C6DA", Adg: "#26C6DA",
    Logicx: "#5E5CE6",
    Cpr: "#0288D1",
    Song: "#00AEEF",
    Rpp: "#8DC63F",
    Bwproject: "#00BCD4", Bwpreset: "#00BCD4",
    Ptx: "#7A2182", Pts: "#7A2182",
    Band: "#42A5F5",

    Mp4: "#D81B60", Mov: "#D81B60", Mkv: "#D81B60", Avi: "#D81B60", Wmv: "#D81B60", Flv: "#D81B60", Webm: "#D81B60",
    M4v: "#D81B60", Mpg: "#D81B60", Mpeg: "#D81B60", "3gp": "#D81B60", Vob: "#D81B60", Mts: "#D81B60", M2ts: "#D81B60", Ogv: "#D81B60",

    Jpg: "#FDD835", Jpeg: "#FDD835", Png: "#FDD835", Gif: "#FDD835", Bmp: "#FDD835", Tiff: "#FDD835", Tif: "#FDD835",
    Heic: "#FDD835", Heif: "#FDD835", Raw: "#FDD835", Cr2: "#FDD835", Nef: "#FDD835", Arw: "#FDD835", Dng: "#FDD835",
    Ico: "#FDD835", Avif: "#FDD835", Jfif: "#FDD835",
    Svg: "#FFB300",

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

    Html: "#E65100", Htm: "#E65100",
    Css: "#1565C0", Scss: "#CD6799", Less: "#1D365D", Styl: "#FFB300",
    Js: "#FFD600", Mjs: "#FFD600", Cjs: "#FFD600",
    Jsx: "#61DAFB",
    Ts: "#1976D2", Tsx: "#1976D2",
    Vue: "#42B883",
    Svelte: "#FF3E00",

    Py: "#0277BD", Pyw: "#0277BD",
    Java: "#D84315",
    C: "#283593", Cpp: "#283593", Cxx: "#283593", Cc: "#283593", H: "#283593", Hpp: "#283593",
    Cs: "#4527A0",
    Php: "#6A1B9A",
    Rb: "#CC342D",
    Go: "#00ADD8",
    Rs: "#CE422B",
    Swift: "#FA7343",
    Kt: "#7F52FF", Kts: "#7F52FF",
    Dart: "#0175C2",
    R: "#276DC3",
    Lua: "#2C2D72",
    Pl: "#39457E", Pm: "#39457E",
    Vb: "#945DB7", Vbs: "#945DB7",
    Ipynb: "#F37626",
    Wasm: "#654FF0",
    M: "#0076A8", Mm: "#0076A8", 
    Matlab: "#0076A8",

    Hs: "#5D4F85", Lhs: "#5D4F85", 
    Scala: "#DC322F", Sc: "#DC322F",
    Clj: "#63B132", Cljs: "#63B132", Edn: "#63B132",
    Groovy: "#4298B8", Gvy: "#4298B8", Gradle: "#02303A",
    Elm: "#60B5CC",
    Erl: "#A3B5C1", Hrl: "#A3B5C1", 
    Ex: "#6E4A7E", Exs: "#6E4A7E",
    Ml: "#EC6813", Mli: "#EC6813",
    Fs: "#378BBA", Fsi: "#378BBA",
    Nim: "#FFE953",
    Zig: "#F7A41D",
    Crystal: "#000000", Cr: "#000000",
    D: "#BA3925",

    Asm: "#6E4C13", S: "#6E4C13",
    M68k: "#6E4C13",
    F: "#006699", F90: "#006699", Fortran: "#006699",
    Cob: "#005CA5", Cbl: "#005CA5", Cobol: "#005CA5",
    Vhd: "#ACB2BE", Vhdl: "#ACB2BE", Verilog: "#ACB2BE", V: "#ACB2BE",
    Ada: "#02F88C", Adb: "#02F88C",
    Pas: "#E3A857", Pp: "#E3A857",
    Lisp: "#00Bfff", Csp: "#00Bfff",
    Sch: "#1E4A68", Scm: "#1E4A68",
    Prolog: "#74283C", Pro: "#74283C",

    Sh: "#4CAF50", Bash: "#4CAF50", Zsh: "#4CAF50", Fish: "#4CAF50",
    Bat: "#4CAF50", Cmd: "#4CAF50",
    Ps1: "#012456", Psm1: "#012456",
    Cmake: "#064F8C",
    Dockerfile: "#2496ED",
    Makefile: "#427819", Mk: "#427819",
    Nix: "#5277C3",
    Puppet: "#FFAE1A",
    Ansible: "#EE0000",

    Json: "#558B2F",
    Xml: "#558B2F", Xsl: "#558B2F", Xslt: "#558B2F",
    Toml: "#558B2F",
    Ini: "#558B2F", Cfg: "#558B2F", Conf: "#558B2F",
    Env: "#558B2F",
    Yaml: "#D32F2F", Yml: "#D32F2F",
    Sql: "#0277BD", Pgsql: "#0277BD", Plsql: "#0277BD",
    Graphql: "#E10098", Gql: "#E10098",
    Proto: "#00285A", 

    Obj: "#6D4C41", Fbx: "#6D4C41", Stl: "#6D4C41", Ply: "#6D4C41", "3ds": "#6D4C41",
    Blend: "#F57C00",
    Dwg: "#006064", Dxf: "#006064", Max: "#006064", Ma: "#006064", Mb: "#006064", Step: "#006064", Stp: "#006064", Iges: "#006064", Igs: "#006064",
    C4d: "#14213D",
    Gltf: "#8BC34A", Glb: "#8BC34A",
    Usdz: "#0091EA",
    Skp: "#0A6FBF",

    Zip: "#8D6E63", Rar: "#8D6E63", "7z": "#8D6E63", Tar: "#8D6E63", Gz: "#8D6E63",
    Bz2: "#8D6E63", Xz: "#8D6E63", Tgz: "#8D6E63", Cab: "#8D6E63",

    Exe: "#455A64", Msi: "#455A64", Apk: "#388E3C", Dmg: "#455A64", Pkg: "#455A64", Iso: "#455A64",
    Dll: "#455A64", Sys: "#455A64", Dat: "#757575", Bin: "#757575", Application: "#455A64",
    Deb: "#A80030", Rpm: "#EE0000",
    Torrent: "#5C6BC0", Ics: "#0288D1", Vcf: "#00897B",
}

export const viewerComponentsMap = {
    "mp4": "VideoPlayer", "webm": "VideoPlayer", "ogv": "VideoPlayer",

    "mp3": "AudioPlayer", "wav": "AudioPlayer", "ogg": "AudioPlayer",
    "flac": "AudioPlayer", "aac": "AudioPlayer", "m4a": "AudioPlayer",

    "zip": "ArchiveViewer",

    "jpg": "PhotoViewer", "jpeg": "PhotoViewer", "png": "PhotoViewer",
    "gif": "PhotoViewer", "bmp": "PhotoViewer", "svg": "PhotoViewer",
    "webp": "PhotoViewer",


    "pdf": "PdfViewer", "docx": "DocumentViewer", 
    "md": "DocumentViewer",

    "xls": "DocumentViewer", "xlsx": "DocumentViewer", 
    "csv": "DocumentViewer", 

    "txt": "DocumentViewer"
};

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

    if (extensionColors[formattedExt]) return extensionColors[formattedExt]
    return generateColorFromText(formattedExt)
}

export function getViewerComponent(filename, codeExtensionsMap = {}) {
    if (!filename) return "Unsupported"

    const lowerName = filename.toLowerCase()
    if (lowerName === "dockerfile" || lowerName === "makefile") 
        return "CodeViewer"

    const lastDotIndex = filename.lastIndexOf(".")
    if (lastDotIndex === -1) return "UnsupportedViewer"

    const extWithoutDot = filename.slice(lastDotIndex + 1).toLowerCase()
    const extWithDot = filename.slice(lastDotIndex).toLowerCase()

    if (viewerComponentsMap[extWithoutDot]) 
        return viewerComponentsMap[extWithoutDot]
    
    if (codeExtensionsMap[extWithDot]) return "CodeViewer"
    
    return "Unsupported"
}