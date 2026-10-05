const scriptTag = document.currentScript;
const navBase = scriptTag.src.replace(/js\/inject\.js.*$/, '');

fetch(navBase + 'shared/header.html')
	.then(res => res.text())
	.then(html => {
		document.getElementById('site-header').innerHTML = html;
	});