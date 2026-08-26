<div align="center">


# OffGrid

<p align="center">OffGrid is a file storage app built for security and speed.
Upload files, share and preview them, everything in the browser with the smallest performance cost.</p>


[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

![React.JS (website)](https://img.shields.io/badge/-React.JS%20(website)-555?style=for-the-badge&logo=react.js%20(website)) ![C++ (server)](https://img.shields.io/badge/-C%2B%2B%20(server)-555?style=for-the-badge&logo=c%2B%2B%20(server)) ![QT 6 (Desktop app)](https://img.shields.io/badge/-QT%206%20(Desktop%20app)-555?style=for-the-badge&logo=qt%206%20(desktop%20app))

[✨ Request Feature](https://github.com/xCosmin14/offgrid/issues)
[📼 Video Demo](https://youtu.be/Ao-LEOav1Co)

</div>

---

## 📋 Table of Contents

- [✨ Features](#features)
- [🗺️ Roadmap](#roadmap)
- [📄 License](#license)
- [👤 Contact](#contact)
- [🙏 Acknowledgements](#acknowledgements)

## ✨ Features

- ✅ Minimal configuration needed
- ✅ User friendly
- ✅ Designed for customisation (light-dark mode with the ability to change all the colors for both themes)
- ✅ Mobile responsive on all pages
  
- ✅ Special pages for: Documents, Music, Photos/Videos
- ✅ Special pages for favourite and shared files/folders
- ✅ Search the filesystem by name or various interactive filters
- ✅ Every page has a diagram at the top that shows the size % of every present file type from the total file size. Very wide color coding support for most file types 
- ✅ Lightspeed communication between the server and frontend/app
- ✅ Supports various file formats for previewing in the browser (Listed down below)
- ✅ Security first - solid security checks for all server connections / operations + encrypted files

## 🗺️ Roadmap

## **The app is still in development but we reached a stage at which we agreed to make the repository public**

## **In the near future:**

### Website

- ✅ Sharing files
- ✅ Notifications
- ✅ Downloading folders as .ZIP archives
- [ ] Editing .txt files dirrectly with the ability to collaborate with other users (Google Docs style)

### Server

- ✅ Implementing more security checks and preventing network/request highjacking

See the [open issues](https://github.com/xCosmin14/offgrid/issues) for proposed features and known issues.



## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 👤 Contact

**Cosmin Nichita, Baltag Andreea**

- GitHub: [@xCosmin14](https://github.com/xCosmin14), [@AndreeaBaltag](https://github.com/AndreeaBaltag)
- Email: [nichitacosmin35@gmail.com](mailto:nichitacosmin35@gmail.com), [deeaparaschiva@gmail.com](mailto:deeaparaschiva@gmail.com)
- Project: [https://github.com/xCosmin14/offgrid](https://github.com/xCosmin14/offgrid)

## 🙏 Acknowledgements

- The desktop app is still in the beginning of development and will take more time to advance
- The design might be refined later in regards to icons, squares and circles ;)

### Supported extensions that can be previewed in the browser:
- Videos: mp4, WebM, OGF
- Photos: JPG, JPEG, PNG, GIF, BMP, SVG, WebP
- Audio files (including reading metadata from music if possible): mp3, WAV, OGG, FLAC, AAC, m4a
- ZIP archives (the app only reads the file structure and displays a tree)
- Documents and spreadsheets: PDF, DOCX, MD, XLS, XLSX, CSV, TXT
- Code files (every known programming language is properly syntax highlighted)



## Tech stack

### 	Frontend

​		**React.js**

​		Zip.js, JSZip

​		Docx-preview, React PDF, XLSX

​		Dompurify, React-syntax-highlighter

​		Music-metadata

​		React-file-icon



### 	Backend

​		**C++**

​		Boost.beast, Boost.asio, Boost.json, Boost.sql, Boost.uuid

​		Argon2

​		Miniz

​		OpenSSL

---

<div align="center">Made with ❤️ by Cosmin Nichita, Baltag Andreea</div>
