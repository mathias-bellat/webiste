function toggleMenu() {
    const menu = document.querySelector(".menu-links");
    const icon = document.querySelector(".hamburger-icon");
    menu.classList.toggle("open");
    icon.classList.toggle("open");
}

function toggleList(targetId) {
    const content = document.getElementById(targetId);
    if (content.style.maxHeight && content.style.maxHeight !== "0px") {
        content.style.maxHeight = "0px"; // cache
    } else {
        content.style.maxHeight = "600px"; 
    }
}

// Initialisation
window.addEventListener('DOMContentLoaded', function() {
    const defaultOpen = document.getElementById('dropdown-content-1');
    if (defaultOpen) {
        defaultOpen.style.maxHeight = "1200px";
    }
});

window.onscroll = function() {
  const btn = document.getElementById("scrollTopBtn");
  if (document.body.scrollTop > 600 || document.documentElement.scrollTop > 600) {
    btn.style.display = "block";
  } else {
    btn.style.display = "none";
  }
};

// Remonter en haut en douceur
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

/* Function for leaflet*/


// Initialisation de la carte
let map;
let markers;
let currentZoom = null;
let originalView = { center: [36, 22], zoom: 4 };

// Données des marqueurs
const locations = [
    {
        coords: [36.959108, 42.721261],
        title: "Bassetki",
        date: "2022 - 2025",
        description: "Kurdistan, Iraq, soil survey, environmental study, archaeological excavation (Bronze Age)."
    },
    {
        coords: [36.914226, 42.743235],
        title: "Muqable",
        date: "2022 - 2025",
        description: "Kurdistan, Iraq, soil survey, environmental study and micromorphological study of surface area (Bronze Age)."
    },
    {
        coords: [35.749709, 45.246259],
        title: "MPKI Survey",
        date: "Since 2025",
        description: "Kurdistan, Iraq, archaeological and geomorphological survey, focus on cave and rock shelter in karstic environment (Paleolithic)."
    },
    {
        coords: [40.445321, 46.630793],
        title: "Qaraçinar",
        date: "2021 - 2022",
        description: "Middle Kura Valley, Azerbaijan, archaeological excavation, focus on Kuro-Araxes levels (Chalcolithic, Bronze Age)."
    },
    {
        coords: [39.301766, 45.548045],
        title: "Kultepe and Uçan Agil",
        date: "2021",
        description: "Nakichevan region, Azerbaijan, archaeological excavation, focus on pastoral occupations, micromorphological earthen material sampling, archaeological survey (Neolithic)."
    },
    {
        coords: [48.667333, 1.724267],
        title: "Moulineaux",
        date: "2019 - 2024",
        description: "Yvelines, France, archaeological excavation, focus on monastic occupations, direction of the excavations, 5 - 10 archaeologists team (Medieval, Modern)."
    },
    {
        coords: [48.638291, -2.060131],
        title: "Dinard",
        date: "2019",
        description: "Brittany, France, littoral geography trip (geomorphology, biology, geology ...)."
    },
    {
        coords: [37.637002, 22.726853],
        title: "Argos",
        date: "2019",
        description: "Peloponnese, Greece, geoarchaeological trip."
    },
    {
        coords: [44.084626, 4.779143],
        title: "Lampourdier",
        date: "2018",
        description: "Vaucluse, France, archaeological excavation, celtic cairn (Iron Age)."
    },
    {
        coords: [43.609843, 3.734546],
        title: "Castellas",
        date: "2018",
        description: "Hérault, France, archaeological excavation, gallo-roman oppida (Iron Age)."
    },
    {
        coords: [43.354210, 3.424183],
        title: "Monédière",
        date: "2017 - 2018",
        description: "Hérault, France, archaeological excavation, gallo-greek oppida (Neolithic, Bronze Age, Iron Age)."
    },
    {
        coords: [43.257058, 2.756791],
        title: "Mourel-Ferrat",
        date: "2018",
        description: "Hérault, France, archaeological excavation, gallo-greek oppida (Iron Age)."
    },
    
];

/**
 * Initialise la carte avec les paramètres de base
 */
function initializeMap() {
    // Initialisation de la carte
    map = L.map('map').setView(originalView.center, originalView.zoom);

    // Ajout de la couche satellite
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 18
    }).addTo(map);
}

/**
 * Crée et configure le groupe de clusters
 */
function createClusterGroup() {
    markers = L.markerClusterGroup({
        iconCreateFunction: function(cluster) {
            const count = cluster.getChildCount();
            let className = 'marker-cluster-';
            
            if (count < 10) {
                className += 'small';
            } else if (count < 100) {
                className += 'medium';
            } else {
                className += 'large';
            }
            
            return new L.DivIcon({
                html: '<div><span>' + count + '</span></div>',
                className: 'marker-cluster ' + className,
                iconSize: new L.Point(40, 40)
            });
        },
        maxClusterRadius: 80,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: false,
        disableClusteringAtZoom: 15
    });
}

/**
 * Crée les marqueurs personnalisés et les ajoute au groupe de clusters
 */
function createMarkers() {
    locations.forEach((location, index) => {
        const customIcon = L.divIcon({
            html: `<div class="custom-marker"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
            className: 'custom-marker-container'
        });

        const marker = L.marker(location.coords, { icon: customIcon })
            .on('click', () => zoomToLocation(location, index));

        // Ajouter le marqueur au groupe de clusters
        markers.addLayer(marker);
    });

    // Ajouter le groupe de clusters à la carte
    map.addLayer(markers);
}

/**
 * Configure les gestionnaires d'événements
 */
function setupEventHandlers() {
    // Gestionnaire pour les clics sur les clusters
    markers.on('clusterclick', function(event) {
        const cluster = event.layer;
        const bounds = cluster.getBounds();
        
        // Zoomer sur le cluster avec animation fluide
        map.fitBounds(bounds, {
            padding: [20, 20],
            animate: true,
            duration: 1.2
        });
    });

    // Gestionnaire pour les changements de zoom
    map.on('zoomend', function() {
        const zoom = map.getZoom();
        // Logique spécifique selon le niveau de zoom si nécessaire
        if (zoom > 12) {
            markers.options.disableClusteringAtZoom = 15;
        }
    });

    // Event listeners pour les boutons
    document.getElementById('closeBtn').addEventListener('click', resetView);

    // Fermer avec échap
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && currentZoom) {
            resetView();
        }
    });

    // Empêcher le clic sur la boîte d'information de fermer
    document.getElementById('infoBox').addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

/**
 * Zoom sur un lieu spécifique avec effet fluide
 * @param {Object} location - Objet contenant les données du lieu
 * @param {number} index - Index du lieu dans le tableau
 */
function zoomToLocation(location, index) {
    currentZoom = location;
    
    // Activer immédiatement l'overlay
    document.getElementById('mapOverlay').classList.add('active');
    
    // Zoom fluide avec durée réduite
    map.flyTo(location.coords, 16, {
        animate: true,
        duration: 1.2,
        easeLinearity: 0.1
    });

    // Afficher la boîte d'information plus rapidement
    setTimeout(() => {
        updateInfoBox(location);
    }, 1500);
}

/**
 * Met à jour le contenu de la boîte d'information
 * @param {Object} location - Objet contenant les données du lieu
 */
function updateInfoBox(location) {
    const infoBox = document.getElementById('infoBox');
    const title = document.getElementById('locationTitle');
    const date = document.getElementById('locationDate');
    const description = document.getElementById('locationDescription');
    
    title.textContent = location.title;
    date.textContent = location.date;
    description.textContent = location.description;

    infoBox.classList.add('active');
}

/**
 * Réinitialise la vue à l'état original
 */
function resetView() {
    currentZoom = null;
    
    // Masquer la boîte d'information
    document.getElementById('infoBox').classList.remove('active');
    
    // Revenir à la vue originale avec durée réduite
    map.flyTo(originalView.center, originalView.zoom, {
        animate: true,
        duration: 1.2,
        easeLinearity: 0.1
    });
    
    // Masquer l'overlay plus rapidement
    setTimeout(() => {
        document.getElementById('mapOverlay').classList.remove('active');
    }, 300);
}

/**
 * Fonction d'initialisation principale
 */
function init() {
    initializeMap();
    createClusterGroup();
    createMarkers();
    setupEventHandlers();
}

// Démarrage de l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', init);

/* Pour le timeline */

// Animation au scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animationPlayState = 'running';
        }
    });
}, observerOptions);

// Observer tous les éléments de la timeline
document.querySelectorAll('.timeline-item').forEach(item => {
    observer.observe(item);
});

// Effet de parallaxe léger
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallax = document.querySelector('.timeline-header');
    const speed = scrolled * 0.5;
    
    if (parallax) {
        parallax.style.transform = `translateY(${speed}px)`;
    }
});

// Animation des compétences au hover
document.querySelectorAll('.timeline-content').forEach(content => {
    content.addEventListener('mouseenter', () => {
        const skills = content.querySelectorAll('.skill');
        skills.forEach((skill, index) => {
            setTimeout(() => {
                skill.style.transform = 'translateY(-2px) scale(1.05)';
            }, index * 50);
        });
    });

    content.addEventListener('mouseleave', () => {
        const skills = content.querySelectorAll('.skill');
        skills.forEach(skill => {
            skill.style.transform = 'translateY(0) scale(1)';
        });
    });
});

/* Pour ouvrir les liens extern*/
document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('a[href]');
    
    links.forEach(link => {
        const href = link.getAttribute('href');
        
        // Ouvre dans un nouvel onglet sauf les ancres (#) et liens spéciaux
        if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });
});

/* Onglet pour les compétences */
function createDonut(wrapper) {
  const percent = parseInt(wrapper.dataset.percent) || 0;
  const icon = wrapper.dataset.icon || "";
  const label = wrapper.dataset.label || "";

  wrapper.innerHTML = `
    <svg>
      <circle class="bg-ring" cx="75" cy="75" r="60"></circle>
      <circle class="progress-ring" cx="75" cy="75" r="60"></circle>
    </svg>
    <div class="center-hole">
      <img src="${icon}" alt="${label}">
    </div>
    <div class="skill-label">${label}</div>
  `;

  const circle = wrapper.querySelector('.progress-ring');
  const radius = circle.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;
  circle.style.strokeDasharray = `${circumference}`;
  circle.style.strokeDashoffset = circumference;

  // Animation
  const targetOffset = circumference * (1 - percent / 100);
  let currentOffset = circumference;

  function animate() {
    if (currentOffset > targetOffset) {
      currentOffset -= 6;
      if (currentOffset < targetOffset) currentOffset = targetOffset;
      circle.style.strokeDashoffset = currentOffset;
      requestAnimationFrame(animate);
    }
  }
  animate();
}

function loadCategory(id) {
  if (id === "code" || id === "software") {
    document.querySelectorAll(`#${id} .donut-wrapper`).forEach(el => createDonut(el));
  }
}

// Gestion des onglets
const tabButtons = document.querySelectorAll('.tab-button');
const categories = document.querySelectorAll('.skill-category');

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    categories.forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    const id = btn.dataset.tab;
    document.getElementById(id).classList.add('active');
    loadCategory(id);
  });
});

// Charger la catégorie Code au départ
loadCategory("code");

// CONFIGUREZ VOTRE NOM ICI

const MY_NAME = "Bellat"; // Modifiez avec votre nom tel qu'il apparaît dans les publications

// CONFIGURATION DE LA PAGINATION
const ITEMS_PER_PAGE = 5; // Nombre de publications par page
let currentPage = 1;
let filteredPublications = [];

const publications = [

    {
        title: "Comparative review of recent developments in archaeological predictive models and automatic structure detection",
        authors: "Bellat, M., Hatton, A., Orellana Figueroa, J.D.",
        type: "Pre-print",
        year: 2026,
        journal: "CAA2025 Conference Proceedings",
        logo: "https://zenodo.org/api/communities/40d1bfed-cc00-4f33-bd79-b7793ec44454/logo",
        url: " https://doi.org/10.5281/zenodo.20610648",
        keywords: ["machine learning", "site detection", "review", "archaeological theory", "archaeological modelling" ]
    },


        {
        title: "Soil information and soil property maps for the Kurdistan region, Dohuk governorate (Iraq)",
        authors: "Bellat, M., Zebari, M., Glissman, B., Rentschler, T., Sconzo, P., Kakhani, N., Taghizadeh-Mehrjardi, R., Khosravani, P., Brifany, B., Pfälzner, P., Scholten, T.",
        type: "Article",
        year: 2026,
        journal: "Earth System Science Data",
        logo: "https://contentmanager.copernicus.org/11936/386/locale/ssl",
        url: "https://doi.org/10.5194/essd-18-2507-2026",
        keywords: ["digital soil mapping", "machine learning", "Iraq", "aridic environment" ]
    },    
    

    {
        title: "Material for: 'Soil information and soil property maps for the Kurdistan region, Dohuk governorate (Iraq)'",
        authors: "Bellat, M., Zebari, M., Glissman, B., Rentschler, T., Sconzo, P., Kakhani, N., Taghizadeh-Mehrjardi, R., Khosravani, P., Brifany, B., Pfälzner, P., Scholten, T.",
        type: "Data",
        year: 2026,
        journal: "FDAT University Tübingen",
        logo: "https://uni-tuebingen.de/_assets/7d66ab3e4599366251c5af46f0e770b9/Images/Logo_Universitaet_Tuebingen.svg",
        url: " https://doi.org/10.57754/FDAT.d5h1h-4x027",
        keywords: ["soil science", "spectroscopy", "Iraq", "geographical information systems" ]
    },

    {
        title: "Digital soil mapping predicted on mid-infrared (MIR) spectroscopy measurements in North-Western Kurdistan region, Iraq (netCDF and GeoTIFF files) V3.0",
        authors: "Bellat, M., Zebari, M., Glissmann, B., Rentschler, T., Sconzo, P., Kakhani, N., Khosravani, P., Taghizadeh-Mehrjardi, R., Brifkany, B., Pfälzner, P., & Scholten, T.",
        type: "Data",
        year: 2026,
        journal: "figshare",
        logo: "/assets/logo/figshare.png",
        url: "https://doi.org/10.6084/m9.figshare.31320958.v2",
        keywords: ["digital soil mapping", "FTIR", "spectroscopy", "Iraq", "machine learning", "soil depth", "soil properties", "spatial modelling"]
    },

    {
        title: "Machine learning applications in archaeological practices: A review",
        authors: "Bellat, M., Orellana Figueroa, J.D., Reeves, J.S., Taghizadeh-Mehrjardi, R., Tennie, C., Scholten, T.",
        type: "Article",
        year: 2025,
        journal: "Journal of Computer Applications in Archaeology",
        logo: "https://storage.googleapis.com/jnl-up-j-jcaa-public/journals/1/societyLogoImage_en_US.png?t=1764113160000",
        url: "https://doi.org/10.5334/jcaa.201",
        keywords: ["archaeological science", "computing science", "state of art", "artificial intelligence", "machine learning" ]
    },

    {
        title: "Mission Préhistorique au Kurdistan irakien - MPKI : rapport d'activité 2025",
        authors: "Bonilauri, S., Bellat, M., Ben Arou, E., Berillon, G., Beuzen-Waller, T., David, É., Forti, L., Galet, X., Karim, R., Hashemi, M., Mesfin, I., Nomade, S., Rawf Aziz, Z., Sévêque, N.",
        type: "Report",
        year: 2025,
        journal: "Rapport MEAE",
        logo: "https://hal.science/assets/img/hal-logo-header.png",
        keywords: ["Kurdistan", "Paleolithic", "cave", "survey"]
    },

    {
        title: "Machine learning applications in archaeological practices: A review",
        authors: "Bellat, M., Orellana Figueroa, J.D., Reeves, J.S., Taghizadeh-Mehrjardi, R., Tennie, C., Scholten, T.",
        type: "Pre-print",
        year: 2025,
        journal: "ArXiv",
        logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/ArXiv_logo_2022.png",
        url: "https://arxiv.org/abs/2501.03840",
        keywords: ["archaeological science", "computing science", "state of art", "artificial intelligence", "machine learning" ]
    },

    
    {
        title: "Soil properties predicted on mid-infrared (MIR) spectroscopy measurements in North-Western Kurdistan region, Iraq",
        authors: "Bellat, M., Glissman, B., Rentschler, T., Sconzo, P., Pfälzner, P., Brifany, B., Scholten, T.",
        type: "Data",
        year: 2024,
        journal: "PANGAEA",
        logo: "https://www.pangaea.de/assets/v.6b7105a5fd061af46552d8c6ee53c11c/layout-images/pangaea-logo.png",
        url: "https://doi.org/10.1594/PANGAEA.973700",
        keywords: ["digital soil mapping", "FTIR", "spectroscopy", "Iraq", "machine learning", "soil depth", "soil properties", "spatial modelling"]
    },

    {
        title: "Soil bulk density and soil depth from on-site observations in the North-Western Kurdistan region, Iraq",
        authors: "Bellat, M., Glissman, B., Rentschler, T., Sconzo, P., Pfälzner, P., Brifany, B., Scholten, T.",
        type: "Data",
        year: 2024,
        journal: "PANGAEA",
        logo: "https://www.pangaea.de/assets/v.6b7105a5fd061af46552d8c6ee53c11c/layout-images/pangaea-logo.png",
        url: "https://doi.org/10.1594/PANGAEA.973714",
        keywords: ["digital soil mapping", "FTIR", "spectroscopy", "Iraq", "machine learning", "soil depth", "soil properties", "spatial modelling"]
    },

    {
        title: "Soil properties in the North-Western Kurdistan region, Iraq, derived from laboratory measurements",
        authors: "Bellat, M., Glissman, B., Rentschler, T., Sconzo, P., Pfälzner, P., Brifany, B., Scholten, T.",
        type: "Data",
        year: 2024,
        journal: "PANGAEA",
        logo: "https://www.pangaea.de/assets/v.6b7105a5fd061af46552d8c6ee53c11c/layout-images/pangaea-logo.png",
        url: "https://doi.org/10.1594/PANGAEA.973701",
        keywords: ["digital soil mapping", "FTIR", "spectroscopy", "Iraq", "machine learning", "soil depth", "soil properties", "spatial modelling"]
    },

    {
        title: "Supplementary Information for Machine Learning Applications in Archaeological Practices: A Review",
        authors: "Bellat, M., Orellana Figueroa, J.D., Reeves, J.S., Taghizadeh-Mehrjardi, R., Tennie, C., Scholten, T.",
        type: "Data",
        year: 2024,
        journal: "OSF",
        logo: "/assets/logo/osf_logo.png",
        url: "https://doi.org/10.1594/PANGAEA.973701",
        keywords: ["archaeology", "computer science", "deep learning", "machine learning", "review"]
    },


    {
        title: "La celle de Poigny-la-Forêt (78) : Quelles traces des grandmontains ?",
        authors: "Bellat, M., Courné, E., Devred, R.",
        type: "NPR",
        year: 2024,
        journal: "Histoire Médiévale et Archéologie",
        logo: "https://www.cahmer.fr/wp-content/uploads/2014/02/logo3.png",
        url: "https://www.cahmer.fr/publications/hma-n-38-labbaye-et-lordre-de-grandmont",
        keywords: ["grandmontains", "Yvelines", "manoir seigneurial", "édifice religieux", "chapelle", "période moderne", "moyen age", "archéologie"]
    },

    {
        title: "Rapport annuel d’opération Fouille Programmée 2023 : Site des Moulineaux D’occupation religieuse au Moyen-Âge à la transformation en bâtiment civil à la période Moderne",
        authors: "Bellat, M., Courné, E., Jeanpierre Berraud, F., Foy, J., Gaat, A., Mathieu, L.-A., Genneret, A.",
        type: "Report",
        year: 2024,
        journal: "DRAC Île-de-France",
        logo: "https://hal.science/assets/img/hal-logo-header.png",
        url: "https://hal.science/hal-04423804",
        keywords: ["grandmontains", "Yvelines", "manoir seigneurial", "édifice religieux", "chapelle", "période moderne", "moyen age", "archéologie"]
    },

    {
        title: "New insights into the Neolithic architecture of the Southern Caucasus: A micromorphological case-study from Mentesh Tepe (middle Kura Valley, Azerbaĳan)",
        authors: "Bellat, M., Baudouin, E., Cammas, C., Lyonnet, B.",
        type: "Article",
        year: 2023,
        journal: "Journal of Archaeological Science: Reports",
        logo: "https://ars.els-cdn.com/content/image/1-s2.0-S2352409X23X00030-cov200h.gif",
        url: "https://doi.org/10.17605/OSF.IO/RUPGY",
        keywords: ["protohistory", "earthen material", "multiscalar approach", "Aratashen-Shulaveri-Shomutepe", "facies", "building techniques"]
    },

    {
        title: "Rapport pluriannuel d’opération 2022 Fouilles Programmées 2019 - 2021 : Site des Moulineaux",
        authors: "Bellat, M., Foy, J., Jeanpierre Berraud, F., Mathieu, L.-A., Courné, E.",
        type: "Report",
        year: 2023,
        journal: "DRAC Île-de-France",
        logo: "https://hal.science/assets/img/hal-logo-header.png",
        url: "https://hal.science/hal-04135477",
        keywords: ["archéologie", "Moyen Âge", "manoir seigneurial", "celle", "Yvelines", "France", "archéologie de la période industrielle", "édifice religieux", "chapelle", "grandmontains", "archéologie moderne"]
    },

        {
        title: "Rapport annuel d’opération Fouille Programmée 2021 : Site des Moulineaux D’occupation religieuse au Moyen-Âge à la transformation en bâtiment civil à la période Moderne",
        authors: "Bellat, M., Courné, E., Jeanpierre Berraud, F., Waszak, M., Foy, J., Mathieu, L.-A., Rousset, G., Mouillac, L.",
        type: "Report",
        year: 2022,
        journal: "DRAC Île-de-France",
        logo: "https://hal.science/assets/img/hal-logo-header.png",
        url: "https://hal.science/hal-03547747",
        keywords: ["grandmontains", "Yvelines", "manoir seigneurial", "édifice religieux", "chapelle", "période moderne", "moyen age", "archéologie"]
    },

        {
        title: "Rapport annuel d’opération Fouille Programmée 2020 : Site des Moulineaux D’occupation religieuse au Moyen-Âge à la transformation en bâtiment civil à la période Moderne",
        authors: "Bellat, M., M., Courné, E., Jeanpierre Berraud, F., Waszak, M., Le Tellier-Heitz I.",
        type: "Report",
        year: 2021,
        journal: "DRAC Île-de-France",
        logo: "https://hal.science/assets/img/hal-logo-header.png",
        url: "https://hal.science/hal-03547769",
        keywords: ["grandmontains", "Yvelines", "manoir seigneurial", "édifice religieux", "chapelle", "période moderne", "moyen age", "archéologie"]
    },

        {
        title: "Rapport de sondage, Poigny-la-Forêt 2019 : Prieuré des Moulineaux",
        authors: "Bellat, M., Courné, E., Jeanpierre Berraud, F., Devred R., Manière, A., Waszak, M., ",
        type: "Report",
        year: 2020,
        journal: "DRAC Île-de-France",
        logo: "https://hal.science/assets/img/hal-logo-header.png",
        url: "https://hal.science/hal-03547775",
        keywords: ["grandmontains", "Yvelines", "manoir seigneurial", "édifice religieux", "chapelle", "période moderne", "moyen age", "archéologie"]
    },

];

function populateYears() {
    const years = [...new Set(publications.map(p => p.year))].sort((a, b) => b - a);
    const yearSelect = document.getElementById('filterYear');
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });
}

function highlightMyName(authorsText) {
    return authorsText.replace(
        new RegExp(MY_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        `<span class="my-name">${MY_NAME}</span>`
    );
}

function displayPublications(pubs) {
    filteredPublications = pubs;
    const container = document.getElementById('publicationsList');
    const resultsCount = document.getElementById('resultsCount');
    
    const totalPages = Math.ceil(pubs.length / ITEMS_PER_PAGE);
    
    // Réinitialiser à la page 1 si on est au-delà du nombre de pages
    if (currentPage > totalPages && totalPages > 0) {
        currentPage = 1;
    }
    
  resultsCount.textContent = `${pubs.length} publication${pubs.length > 1 ? 's' : ''} found`;
    
    if (pubs.length === 0) {
        container.innerHTML = '<div class="no-results">No publications found</div>';
        document.getElementById('pagination').innerHTML = '';
        return;
    }

    
    // Calculer les indices pour la pagination
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pubsToDisplay = pubs.slice(startIndex, endIndex);
    
    container.innerHTML = pubsToDisplay.map(pub => `
        <a href="${pub.url}" target="_blank" class="publication">
            <img src="${pub.logo}" alt="${pub.journal}" class="pub-logo">
            <div class="pub-content">
                <div class="pub-title">${pub.title}</div>
                <div class="pub-authors">${highlightMyName(pub.authors)}</div>
                <div class="pub-details">
                    <span class="pub-type">${pub.type}</span>
                    <span class="pub-year">${pub.year}</span>
                    <span>${pub.journal}</span>
                </div>
                <div class="pub-keywords">
                    ${pub.keywords.map(kw => `<span class="keyword">${kw}</span>`).join('')}
                </div>
            </div>
        </a>
    `).join('');
    
    displayPagination(totalPages);
}

function displayPagination(totalPages) {
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = `
        <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            ← Previous
        </button>
        <span class="page-info">Page ${currentPage} on ${totalPages}</span>
        <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            Next →
        </button>
    `;
    
    pagination.innerHTML = paginationHTML;
}

function changePage(newPage) {
    const totalPages = Math.ceil(filteredPublications.length / ITEMS_PER_PAGE);
    
    if (newPage < 1 || newPage > totalPages) {
        return;
    }
    
    currentPage = newPage;
    displayPublications(filteredPublications);
    
    // Scroll vers le haut de la liste
    document.getElementById('publicationsList').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function filterPublications() {
    currentPage = 1; // Retour à la page 1 lors d'un nouveau filtre
    const searchName = document.getElementById('searchName').value.toLowerCase();
    const filterType = document.getElementById('filterType').value;
    const searchKeywords = document.getElementById('searchKeywords').value.toLowerCase();
    const filterYear = document.getElementById('filterYear').value;

    const filtered = publications.filter(pub => {
        const matchName = !searchName || 
            pub.title.toLowerCase().includes(searchName) || 
            pub.authors.toLowerCase().includes(searchName);
        
        const matchType = !filterType || pub.type === filterType;
        
        const matchKeywords = !searchKeywords || 
            pub.keywords.some(kw => kw.toLowerCase().includes(searchKeywords));
        
        const matchYear = !filterYear || pub.year.toString() === filterYear;

        return matchName && matchType && matchKeywords && matchYear;
    });

    displayPublications(filtered);
}

function resetFilters() {
    currentPage = 1;
    document.getElementById('searchName').value = '';
    document.getElementById('filterType').value = '';
    document.getElementById('searchKeywords').value = '';
    document.getElementById('filterYear').value = '';
    displayPublications(publications);
}

// Event listeners
document.getElementById('searchName').addEventListener('input', filterPublications);
document.getElementById('filterType').addEventListener('change', filterPublications);
document.getElementById('searchKeywords').addEventListener('input', filterPublications);
document.getElementById('filterYear').addEventListener('change', filterPublications);

// Initialisation
populateYears();
displayPublications(publications);

// ── Fonction toggle pour les sections Communications ──
function toggle(box) {
  const dropdown = box.nextElementSibling;
  const isOpen = box.classList.contains('open');
  box.classList.toggle('open', !isOpen);
  dropdown.style.maxHeight = isOpen ? '0' : dropdown.scrollHeight + 'px';
}
