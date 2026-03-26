export type PointType = 'museum' | 'restaurant';

export type PointInfo = {
    id: string;
    type: PointType;
    position: [number, number, number];
    logo: string;
    image: string;
    title: string;
    lead: string;
    description: string;
    schedule: [string, string, string, string, string, string, string]; // Mon → Sun
    phone: string;
    email: string;
    website: string;
};

const IMG = '/3d-map/images';

export const POINTS: PointInfo[] = [
    {
        id: 'mcba',
        type: 'museum',
        position: [2.62, 1.2, 0.9],
        logo: `${IMG}/logo-mcba.svg`,
        image: `${IMG}/img-mcba.jpg`,
        title: 'Musée Cantonal des Beaux-Arts Lausanne',
        lead: 'Opened in 1841, the Vaud Museum of Fine Arts in Lausanne is one of the oldest Swiss museums exclusively dedicated to art. Now located in Plateforme 10, it presents several temporary exhibitions a year from its collection of 10,000 works.',
        description:
            "Ducros, Gleyre, Steinlen, Vallotton and Soutter: these are some of the Vaudois painters for which the Vaud Museum of Fine Arts (MCBA) is known, nationally and internationally. Their works form a large part of the museum's collection, currently comprising some 10,000 paintings.<br><br>The MCBA organises several temporary exhibitions every year, each one accompanied with a programme of cultural activities including events, guided tours and workshops for adults and children. Admission is free on the first Saturday of the month.",
        schedule: ['Closed', '10:00 – 18:00', '10:00 – 18:00', '10:00 – 20:00', '10:00 – 18:00', '10:00 – 18:00', '10:00 – 18:00'],
        phone: '+41 21 316 34 45',
        email: 'mcba@plateforme10.ch',
        website: 'https://www.mcba.ch/en/',
    },
    {
        id: 'mudac',
        type: 'museum',
        position: [-3.75, 1.2, 0.25],
        logo: `${IMG}/logo-mudac.svg`,
        image: `${IMG}/img-mudac.jpg`,
        title: "Musée Cantonal de Design et d'Arts Appliqués Contemporains",
        lead: "mudac – Lausanne's Museum of Contemporary Design and Applied Arts – is the only institution in Western Switzerland entirely dedicated to design.",
        description:
            "It has developed its identity and international reputation through hundreds of ambitious and often unusual exhibitions and continues to pursue a policy of openness and exchange between the many disciplines of contemporary creation.<br><br>Its programme showcases designers and artists at solo exhibitions and extends to exhibitions that question the public on contemporary social issues. It demonstrates the museum's interest in the world and in the wide scope that the term design itself can encompass.<br><br>The diversity of points of view of each project has enabled mudac to assert itself both on the national and international scene by offering its exhibitions to its counterparts. Europe and Asia have thus been able to discover exhibitions made in mudac on numerous occasions.",
        schedule: ['10:00 – 18:00', 'Closed', '10:00 – 18:00', '10:00 – 20:00', '10:00 – 18:00', '10:00 – 18:00', '10:00 – 18:00'],
        phone: '+41 21 318 44 00',
        email: 'mudac@plateforme10.ch',
        website: 'https://mudac.ch/en/',
    },
    {
        id: 'elysee',
        type: 'museum',
        position: [-3.75, 1.2, -1.55],
        logo: `${IMG}/logo-elysee.svg`,
        image: `${IMG}/img-elysee.jpg`,
        title: 'Photo Elysée',
        lead: 'Photo Elysée is one of the most important museums entirely dedicated to the photographic medium. Each year, we produce demanding exhibitions, distribute reference editorial content, conceive innovative events and offer events open to all.',
        description:
            'Since its creation in 1985 as a "museum for photography", Photo Elysée has been questioning the permanent reinvention of the medium through the great figures who have marked its history by imagining new ways of seeing or making people see, while revealing in a privileged way the emerging photography which, through unseen views, bears witness to the world of today and prefigures that of tomorrow.<br><br>The museum\'s collection of more than 1,200,000 phototypes covers the entire field of photography, from the first processes dating from the 1840s to the digital image. It includes many complete photographic collections or archives, including those of Sabine Weiss, Jan Groover, René Burri, Ella Maillart, Nicolas Bouvier, Charlie Chaplin, Gertrude Fehr, Hans Steiner and Olivier Föllmi.',
        schedule: ['10:00 – 18:00', 'Closed', '10:00 – 18:00', '10:00 – 20:00', '10:00 – 18:00', '10:00 – 18:00', '10:00 – 18:00'],
        phone: '+41 21 318 44 00',
        email: 'info@elysee.ch',
        website: 'https://elysee.ch/en',
    },
    {
        id: 'arcadia',
        type: 'restaurant',
        position: [-0.65, 0.17, -1.2],
        logo: `${IMG}/logo-arcadia.svg`,
        image: `${IMG}/img-arcadia.jpg`,
        title: 'Arcadia Restaurant',
        lead: "Authentic Mediterranean dining at the heart of Lausanne's arts district.",
        description:
            'Arcadia Restaurant, with its seven iconic arches, opens the door to a la carte Mediterranean cuisine, balancing fresh flavours with seasonal local ingredients and products. Our menu is served alongside an inspired cocktail offering and a selection of local beer and wines.<br><br>For those looking for a relaxed, tasty, and inclusive dining experience, whether at lunch for everyday cooking or in the evening for a more special occasion. Always in a relaxed and friendly environment.',
        schedule: ['10:00 – 23:00', 'Closed', '10:00 – 23:00', '10:00 – 23:00', '10:00 – 23:00', '10:00 – 23:00', '10:00 – 18:00'],
        phone: '+41 21 318 44 10',
        email: 'info@arcadiarestaurant.ch',
        website: 'https://www.arcadiarestaurant.ch/',
    },
    {
        id: 'nabi',
        type: 'restaurant',
        position: [3.12, 0.17, 0.41],
        logo: `${IMG}/logo-nabi.svg`,
        image: `${IMG}/img-nabi.jpg`,
        title: 'Le Nabi Café-Restaurant',
        lead: 'Traditional cuisine to savour before or after a visit to Plateforme 10!',
        description:
            'The menu aims to be inviting, familial, yet inventive. Traditional cooking is restyled while the menu follows the seasons by adapting to the harvest of local producers. The drinks are artisanal. Meticulous service at reasonable prices for a convivial moment that everyone can afford to enjoy. Kids are very much welcome, too. Menu selections are designed for savory discoveries, and a play area encourages creativity.',
        schedule: ['Closed', '09:30 – 18:00', '09:30 – 18:00', '09:30 – 20:00', '09:30 – 18:00', '09:30 – 18:00', '09:30 – 18:00'],
        phone: '+41 21 311 02 90',
        email: 'info@lenabi.ch',
        website: 'https://www.mcba.ch/en/cafe-restaurant-2/',
    },
    {
        id: 'lumen',
        type: 'restaurant',
        position: [-4.26, 0.17, 0.66],
        logo: `${IMG}/logo-lumen.svg`,
        image: `${IMG}/img-lumen.jpg`,
        title: 'Lumen Café',
        lead: 'A spontaneous and fast cuisine with authentic artisanal products.',
        description:
            "Le Café Lumen invites you to discover its menu of quick and spontaneous dishes that use artisanal products served simply on a board, in a clay bowl, or nestled between two slices of focaccia. Here you will find the best of the region's culinary tradition. All our drinks are artisanal with a fine selection of craft cider and beer, wine, and homemade non-alcoholic beverages. Our coffee is freshly roasted.<br><br>We're a stop along the region's greenway, the Voie Verte foot and bicycle path, with takeaway service available.",
        schedule: ['10:00 – 18:00', 'Closed', '10:00 – 18:00', '10:00 – 20:00', '10:00 – 18:00', '10:00 – 18:00', '10:00 – 18:00'],
        phone: '+41 21 311 02 90',
        email: 'info@cafelumen.ch',
        website: 'https://mudac.ch/de/cafe-lumen/',
    },
];

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
