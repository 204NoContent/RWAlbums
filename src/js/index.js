import '../styles/main.css';

const header = document.createElement('header');
header.setAttribute('class', 'header');
const logo = document.createElement('span');
logo.setAttribute('class', 'logo');
logo.innerText = "RWAlbums";
header.appendChild(logo);

const root = document.createElement('div');
root.setAttribute('id', 'root');
root.innerHTML = 'main content here';

document.body.appendChild(header);
document.body.appendChild(root);
