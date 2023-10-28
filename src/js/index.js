import '../styles/main.css';
import './main.js';

import '../data.json';
import '../assets/media/daft_punk/daft_punk.jpg';
import "../assets/media/daft_punk/01 Daftendirekt.mp3";
import "../assets/media/daft_punk/02 WDPK 83.7 FM.mp3";
import "../assets/media/daft_punk/03 Revolution 909.mp3";
import "../assets/media/daft_punk/04 Da Funk.mp3";
import "../assets/media/daft_punk/05 Phoenix.mp3";
import "../assets/media/daft_punk/06 Fresh.mp3";
import "../assets/media/daft_punk/07 Around The World.mp3";
import "../assets/media/daft_punk/08 Rollin' & Scratchin'.mp3";
import "../assets/media/daft_punk/09 Teachers.mp3";
import "../assets/media/daft_punk/10 High Fidelity.mp3";
import "../assets/media/daft_punk/11 Rock'n Roll.mp3";
import "../assets/media/daft_punk/12 Oh Yeah.mp3";
import "../assets/media/daft_punk/13 Burnin'.mp3";
import "../assets/media/daft_punk/14 Indo Silver Club.mp3";
import "../assets/media/daft_punk/15 Alive.mp3";
import "../assets/media/daft_punk/16 Funk Ad.mp3";

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
