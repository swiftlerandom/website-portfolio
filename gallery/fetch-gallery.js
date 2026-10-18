const GITHUB_API = 'https://api.github.com/repos/swiftlyrandom/website-portfolio/contents/gallery';
const CACHE_KEY = 'gallery-cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function loadGallery() {
	const container = document.querySelector('.gallery');
	if (!container) return;

	// Check cache first
	const cached = localStorage.getItem(CACHE_KEY);
	if (cached) {
		const { timestamp, data } = JSON.parse(cached);
		if (Date.now() - timestamp < CACHE_TTL) {
			renderGallery(container, data);
			return;
		}
	}

	// Fetch fresh data
	try {
		const res = await fetch(GITHUB_API);
		if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);
		const files = await res.json();
		
		const imageFiles = files
			.filter(f => f.type === 'file' && /\.(jpg|jpeg|png|webp)$/i.test(f.name))
			.map(f => f.download_url);

		// Save to cache
		localStorage.setItem(CACHE_KEY, JSON.stringify({
			timestamp: Date.now(),
			data: imageFiles
		}));

		renderGallery(container, imageFiles);
	} catch (err) {
		console.error('Gallery failed to load:', err);
		container.innerHTML = '<p style="color: #808080; padding: 1rem;">Gallery could not be loaded right now. Please refresh later.</p>';
	}
}

function renderGallery(container, imageUrls) {
	container.innerHTML = '';
	imageUrls.forEach(url => {
		const item = document.createElement('div');
		item.className = 'gallery-item';
		
		const img = document.createElement('img');
		img.src = url;
		img.alt = 'Gallery Image';
		
		const caption = document.createElement('div');
		caption.className = 'gallery-caption';
		caption.textContent = url.split('/').pop(); // Uses filename as caption
		
		item.appendChild(img);
		item.appendChild(caption);
		container.appendChild(item);
	});
}

// Run when page loads
document.addEventListener('DOMContentLoaded', loadGallery);