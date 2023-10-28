import '../styles/main.css';
import './main.js';
import './media_imports';

const header = document.createElement('header');
header.setAttribute('class', 'header');
const logo = document.createElement('span');
logo.setAttribute('class', 'logo');
logo.innerText = "RWAlbums";
header.appendChild(logo);

const root = document.createElement('div');
root.setAttribute('id', 'root');
root.setAttribute('class', 'center');

document.body.appendChild(header);
document.body.appendChild(root);
