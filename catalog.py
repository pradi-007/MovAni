"""
MOVAni Catalog Data Module
Master titles database featuring Movies, Web Series, and Anime Simulcasts
with full X-Ray scene intelligence and legal streaming provider mappings.
"""

CATALOG_DATA = [
    {
        "id": "cm-reze",
        "title": "Chainsaw Man: Reze Arc",
        "type": "anime",
        "studio": "MAPPA",
        "match": "99% Match",
        "rating": "U/A 16+",
        "runtime": "12 Episodes",
        "year": "2024",
        "genres": ["Action", "Dark Fantasy", "Supernatural"],
        "overview": "Denji encounters the mysterious Reze amidst the Tokyo rain, unaware she harbors the explosive heart of the Bomb Devil. As devil hunter factions collide, loyalties are tested in an all-out urban war.",
        "backdrop": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1920&q=80",
        "poster": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80",
        "youtubeId": "M-L03U477s4",
        "audio": ["Japanese 5.1", "English Dub", "Hindi Dub", "Telugu", "Tamil"],
        "providers": [
            {"name": "Crunchyroll", "badge": "Simulcast HD"},
            {"name": "Prime Video", "badge": "4K UHD"}
        ],
        "xray": {
            "actors": [
                {"name": "Kikunosuke Toya", "role": "Denji", "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"},
                {"name": "Reina Ueda", "role": "Reze / Bomb Devil", "image": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80"}
            ],
            "song": {"title": "Kick Back", "artist": "Kenshi Yonezu"},
            "trivia": "MAPPA spent nearly 18 weeks hand-sketching the high-speed urban rail fight sequences to maintain cinematic sakuga motion."
        }
    },
    {
        "id": "solo-leveling",
        "title": "Solo Leveling: Arise",
        "type": "anime",
        "studio": "Crunchyroll",
        "match": "98% Match",
        "rating": "U/A 16+",
        "runtime": "12 Episodes",
        "year": "2024",
        "genres": ["Action", "Fantasy", "Adventure"],
        "overview": "In a world where hunters awaken with magical abilities, the weakest hunter Sung Jinwoo is left for dead in a double dungeon—only to wake up with a mysterious system that allows him to level up without limits.",
        "backdrop": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1920&q=80",
        "poster": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80",
        "youtubeId": "uYPbbksJxIg",
        "audio": ["Japanese Original", "Hindi Dubbed", "English 5.1", "Tamil"],
        "providers": [
            {"name": "Crunchyroll", "badge": "Official Exclusive"},
            {"name": "Hotstar", "badge": "Dubbed Hub"}
        ],
        "xray": {
            "actors": [
                {"name": "Taito Ban", "role": "Sung Jinwoo", "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"},
                {"name": "Genta Nakamura", "role": "Yoo Jinho", "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"}
            ],
            "song": {"title": "LEveL", "artist": "SawanoHiroyuki[nZk]"},
            "trivia": "The digital webtoon adaptation hit over 14.3 billion views worldwide prior to this television anime premiere."
        }
    },
    {
        "id": "oppenheimer",
        "title": "Oppenheimer",
        "type": "movies",
        "studio": "Paramount",
        "match": "97% Match",
        "rating": "U/A 16+",
        "runtime": "3h 00m",
        "year": "2023",
        "genres": ["Biography", "Drama", "History"],
        "overview": "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during the Manhattan Project at Los Alamos.",
        "backdrop": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1920&q=80",
        "poster": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=600&q=80",
        "youtubeId": "bK6ldnjE3Y0",
        "audio": ["English Dolby Atmos", "Hindi Dubbed", "German 5.1"],
        "providers": [
            {"name": "Prime Video", "badge": "4K UHD"},
            {"name": "JioCinema", "badge": "Premium"}
        ],
        "xray": {
            "actors": [
                {"name": "Cillian Murphy", "role": "J. Robert Oppenheimer", "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80"},
                {"name": "Robert Downey Jr.", "role": "Lewis Strauss", "image": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=120&q=80"}
            ],
            "song": {"title": "Can You Hear the Music", "artist": "Ludwig Göransson"},
            "trivia": "Christopher Nolan avoided using CGI completely, choosing practical explosive effects with real magnesium charges for the Trinity test."
        }
    },
    {
        "id": "mirzapur-3",
        "title": "Mirzapur: Season 3",
        "type": "series",
        "studio": "Hotstar",
        "match": "96% Match",
        "rating": "18+",
        "runtime": "10 Episodes",
        "year": "2024",
        "genres": ["Crime", "Action", "Thriller"],
        "overview": "With Kaleen Bhaiya sidelined and Guddu Pandit consolidating power over the Purvanchal throne, fresh rivals emerge from the shadows in a vicious struggle for supremacy.",
        "backdrop": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=80",
        "poster": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80",
        "youtubeId": "x7vFp3w9pX0",
        "audio": ["Hindi 5.1 Original", "Tamil", "Telugu", "Kannada", "Malayalam"],
        "providers": [
            {"name": "Prime Video", "badge": "Original"},
            {"name": "Hotstar", "badge": "Special Hub"}
        ],
        "xray": {
            "actors": [
                {"name": "Ali Fazal", "role": "Guddu Pandit", "image": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&q=80"},
                {"name": "Pankaj Tripathi", "role": "Akhandanand Tripathi", "image": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80"}
            ],
            "song": {"title": "Bhaukaal Theme", "artist": "Anand Bhaskar"},
            "trivia": "Filmed across real rustic terrains in Uttar Pradesh with live audio capture in authentic regional Purvanchal dialect."
        }
    },
    {
        "id": "demon-slayer",
        "title": "Demon Slayer: Hashira Training",
        "type": "anime",
        "studio": "Ufotable",
        "match": "99% Match",
        "rating": "U/A 13+",
        "runtime": "8 Episodes",
        "year": "2024",
        "genres": ["Action", "Fantasy", "Historical"],
        "overview": "Tanjiro visits the Stone Hashira, Gyomei Himejima, who intends to prepare him for the forthcoming battles. The training to become a Hashira is grueling and tests physical limits.",
        "backdrop": "https://images.unsplash.com/photo-1618042164219-62c820f10723?auto=format&fit=crop&w=1920&q=80",
        "poster": "https://images.unsplash.com/photo-1618042164219-62c820f10723?auto=format&fit=crop&w=600&q=80",
        "youtubeId": "1Tvy7e2F55I",
        "audio": ["Japanese 5.1", "Hindi Dub", "English 5.1", "Tamil"],
        "providers": [
            {"name": "Crunchyroll", "badge": "Simulcast"},
            {"name": "Netflix", "badge": "4K HDR"}
        ],
        "xray": {
            "actors": [
                {"name": "Natsuki Hanae", "role": "Tanjiro Kamado", "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"},
                {"name": "Hiro Shimono", "role": "Zenitsu Agatsuma", "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"}
            ],
            "song": {"title": "Mugen", "artist": "MY FIRST STORY x HYDE"},
            "trivia": "Ufotable deployed proprietary custom lighting shaders to synchronize Tanjiro's Hinokami Kagura flame particle effects."
        }
    },
    {
        "id": "the-boys-4",
        "title": "The Boys: Season 4",
        "type": "series",
        "studio": "HBO Max",
        "match": "95% Match",
        "rating": "18+",
        "runtime": "8 Episodes",
        "year": "2024",
        "genres": ["Action", "Dark Comedy", "Sci-Fi"],
        "overview": "Victoria Neuman is closer than ever to the Oval Office and under the muscular thumb of Homelander. Butcher, with months to live, must find a way to save the world.",
        "backdrop": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80",
        "poster": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
        "youtubeId": "F9U-CH980H0",
        "audio": ["English 5.1", "Hindi 5.1", "Spanish 5.1"],
        "providers": [
            {"name": "Prime Video", "badge": "Original 4K"}
        ],
        "xray": {
            "actors": [
                {"name": "Karl Urban", "role": "Billy Butcher", "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"},
                {"name": "Antony Starr", "role": "Homelander", "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"}
            ],
            "song": {"title": "Rock the Casbah", "artist": "The Clash"},
            "trivia": "Karl Urban performed over 80% of his combat stunts despite wearing heavy prosthetic battle rigs in Season 4."
        }
    },
    {
        "id": "dune-2",
        "title": "Dune: Part Two",
        "type": "movies",
        "studio": "Paramount",
        "match": "99% Match",
        "rating": "U/A 13+",
        "runtime": "2h 46m",
        "year": "2024",
        "genres": ["Sci-Fi", "Adventure", "Drama"],
        "overview": "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family in an epic struggle for Arrakis.",
        "backdrop": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1920&q=80",
        "poster": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80",
        "youtubeId": "Way9Dexny3w",
        "audio": ["English Dolby Atmos", "Hindi", "Telugu", "French 5.1"],
        "providers": [
            {"name": "JioCinema", "badge": "Premium 4K"},
            {"name": "Prime Video", "badge": "Dolby Atmos"}
        ],
        "xray": {
            "actors": [
                {"name": "Timothée Chalamet", "role": "Paul Atreides", "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80"},
                {"name": "Zendaya", "role": "Chani", "image": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80"}
            ],
            "song": {"title": "A Time of Quiet Between the Storms", "artist": "Hans Zimmer"},
            "trivia": "Filmed with infrared camera sensors in the sand dunes of Abu Dhabi and Jordan for eerie celestial lighting."
        }
    },
    {
        "id": "jujutsu-kaisen",
        "title": "Jujutsu Kaisen: Shibuya Incident",
        "type": "anime",
        "studio": "MAPPA",
        "match": "98% Match",
        "rating": "U/A 16+",
        "runtime": "23 Episodes",
        "year": "2023",
        "genres": ["Action", "Supernatural", "Dark Fantasy"],
        "overview": "On October 31st in Shibuya, a veil descends trapping civilians. Satoru Gojo enters the lion's den alone against the high-grade curses led by Geto and Mahito.",
        "backdrop": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1920&q=80",
        "poster": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80",
        "youtubeId": "pkZXUG_o0SA",
        "audio": ["Japanese 5.1", "Hindi Dubbed", "English 5.1", "Tamil"],
        "providers": [
            {"name": "Crunchyroll", "badge": "HD Simulcast"},
            {"name": "Netflix", "badge": "Streaming"}
        ],
        "xray": {
            "actors": [
                {"name": "Junya Enoki", "role": "Yuji Itadori", "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"},
                {"name": "Yuichi Nakamura", "role": "Satoru Gojo", "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"}
            ],
            "song": {"title": "SPECIALZ", "artist": "King Gnu"},
            "trivia": "The subway station fight sequences were mapped millimeter-by-millimeter against real Shibuya Tokyo stations."
        }
    },
    {
        "id": "shogun",
        "title": "Shōgun",
        "type": "series",
        "studio": "Hotstar",
        "match": "99% Match",
        "rating": "18+",
        "runtime": "10 Episodes",
        "year": "2024",
        "genres": ["Drama", "Historical", "Adventure"],
        "overview": "When a mysterious European ship is found marooned in a nearby fishing village, Lord Yoshii Toranaga discovers secrets that could tip the scales of power in feudal Japan.",
        "backdrop": "https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=1920&q=80",
        "poster": "https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=600&q=80",
        "youtubeId": "yK6IQCgXBLg",
        "audio": ["Japanese / English 5.1", "Hindi Dub", "Tamil", "Telugu"],
        "providers": [
            {"name": "Hotstar", "badge": "FX Series 4K"},
            {"name": "Hulu", "badge": "Original"}
        ],
        "xray": {
            "actors": [
                {"name": "Hiroyuki Sanada", "role": "Lord Yoshii Toranaga", "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80"},
                {"name": "Anna Sawai", "role": "Toda Mariko", "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"}
            ],
            "song": {"title": "The Shōgun Suite", "artist": "Atticus Ross & Leopold Ross"},
            "trivia": "Over 800 hand-crafted samurai armor suits were constructed using historical museum blueprints from the Sengoku era."
        }
    },
    {
        "id": "spider-verse",
        "title": "Spider-Man: Across the Spider-Verse",
        "type": "movies",
        "studio": "Paramount",
        "match": "98% Match",
        "rating": "U/A 13+",
        "runtime": "2h 20m",
        "year": "2023",
        "genres": ["Animation", "Action", "Sci-Fi"],
        "overview": "Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence, but clashes with Miguel O'Hara.",
        "backdrop": "https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=1920&q=80",
        "poster": "https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=600&q=80",
        "youtubeId": "cqGjhVJWtEg",
        "audio": ["English Atmos", "Hindi 5.1", "Tamil", "Telugu"],
        "providers": [
            {"name": "Netflix", "badge": "4K HDR"},
            {"name": "Prime Video", "badge": "Rental"}
        ],
        "xray": {
            "actors": [
                {"name": "Shameik Moore", "role": "Miles Morales", "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"},
                {"name": "Hailee Steinfeld", "role": "Gwen Stacy", "image": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80"}
            ],
            "song": {"title": "Am I Dreaming", "artist": "Metro Boomin & A$AP Rocky"},
            "trivia": "More than 1,000 animators worked on the film to render six completely distinct visual and dimensional animation art styles."
        }
    },
    {
        "id": "frieren",
        "title": "Frieren: Beyond Journey's End",
        "type": "anime",
        "studio": "Crunchyroll",
        "match": "99% Match",
        "rating": "U/A 13+",
        "runtime": "28 Episodes",
        "year": "2024",
        "genres": ["Adventure", "Drama", "Fantasy"],
        "overview": "Elf mage Frieren, having defeated the Demon King alongside heroes who now grow old and pass away, begins a new reflective journey across the continent to understand human hearts.",
        "backdrop": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80",
        "poster": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
        "youtubeId": "qgQunxF0q6k",
        "audio": ["Japanese 5.1", "Hindi Dubbed", "English 5.1"],
        "providers": [
            {"name": "Crunchyroll", "badge": "Highest Rated"},
            {"name": "Netflix", "badge": "Streaming"}
        ],
        "xray": {
            "actors": [
                {"name": "Atsumi Tanezaki", "role": "Frieren", "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"}
            ],
            "song": {"title": "The Brave (Yūsha)", "artist": "YOASOBI"},
            "trivia": "Produced by Studio Madhouse, the series earned the #1 all-time spot on international anime ranking boards."
        }
    },
    {
        "id": "fallout",
        "title": "Fallout: Season 1",
        "type": "series",
        "studio": "Paramount",
        "match": "97% Match",
        "rating": "18+",
        "runtime": "8 Episodes",
        "year": "2024",
        "genres": ["Sci-Fi", "Action", "Adventure"],
        "overview": "In a future, post-apocalyptic Los Angeles brought about by nuclear decimation, citizens must live in underground bunkers to protect themselves from radiation and irradiated surface mutants.",
        "backdrop": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1920&q=80",
        "poster": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80",
        "youtubeId": "V-mugKDQDlg",
        "audio": ["English Dolby Atmos", "Hindi 5.1", "Tamil"],
        "providers": [
            {"name": "Prime Video", "badge": "Original 4K"}
        ],
        "xray": {
            "actors": [
                {"name": "Ella Purnell", "role": "Lucy MacLean", "image": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80"},
                {"name": "Walton Goggins", "role": "The Ghoul", "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80"}
            ],
            "song": {"title": "I Don't Want to Set the World on Fire", "artist": "The Ink Spots"},
            "trivia": "The motorized Brotherhood of Steel T-60 Power Armor was physically fabricated with fiberglass shells weighing over 65 lbs."
        }
    },
    {
        "id": "interstellar",
        "title": "Interstellar",
        "type": "movies",
        "studio": "Paramount",
        "match": "99% Match",
        "rating": "U/A 13+",
        "runtime": "2h 49m",
        "year": "2014",
        "genres": ["Sci-Fi", "Drama", "Adventure"],
        "overview": "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft along with a team of researchers through a mysterious wormhole.",
        "backdrop": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80",
        "poster": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
        "youtubeId": "zSWdZVtXT7E",
        "audio": ["English Dolby Atmos", "Hindi 5.1", "French 5.1"],
        "providers": [
            {"name": "Prime Video", "badge": "4K UHD"},
            {"name": "JioCinema", "badge": "Dolby Atmos"}
        ],
        "xray": {
            "actors": [
                {"name": "Matthew McConaughey", "role": "Cooper", "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80"},
                {"name": "Anne Hathaway", "role": "Brand", "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"}
            ],
            "song": {"title": "Cornfield Chase", "artist": "Hans Zimmer"},
            "trivia": "Theoretical physicist Kip Thorne provided exact relativistic equations to render the Gargantua black hole accurately on supercomputers."
        }
    },
    {
        "id": "aot-final",
        "title": "Attack on Titan: The Final Season",
        "type": "anime",
        "studio": "MAPPA",
        "match": "99% Match",
        "rating": "18+",
        "runtime": "28 Episodes",
        "year": "2023",
        "genres": ["Action", "Dark Fantasy", "Drama"],
        "overview": "The battle for humanity's freedom reaches its devastating culmination as Eren Yeager commands the Rumbling across the sea to protect Paradis Island.",
        "backdrop": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1920&q=80",
        "poster": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80",
        "youtubeId": "M_OauHnAFc8",
        "audio": ["Japanese 5.1", "English Dub", "Hindi Dub"],
        "providers": [
            {"name": "Crunchyroll", "badge": "Simulcast"},
            {"name": "Hotstar", "badge": "Streaming"}
        ],
        "xray": {
            "actors": [
                {"name": "Yuki Kaji", "role": "Eren Yeager", "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"},
                {"name": "Yui Ishikawa", "role": "Mikasa Ackerman", "image": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80"}
            ],
            "song": {"title": "The Rumbling", "artist": "SiM"},
            "trivia": "Series creator Hajime Isayama personally oversaw the revised pacing of the Colossal Wall Titan march sequence."
        }
    },
    {
        "id": "dandadan",
        "title": "Dandadan",
        "type": "anime",
        "studio": "Crunchyroll",
        "match": "98% Match",
        "rating": "U/A 16+",
        "runtime": "12 Episodes",
        "year": "2024",
        "genres": ["Action", "Supernatural", "Comedy"],
        "overview": "Momo Ayase, who believes in ghosts, and Okarun, who believes in extraterrestrial aliens, make a bet that throws them headfirst into explosive paranormal encounters.",
        "backdrop": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1920&q=80",
        "poster": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80",
        "youtubeId": "iPhd38z7R_w",
        "audio": ["Japanese 5.1", "Hindi Dubbed", "English 5.1"],
        "providers": [
            {"name": "Crunchyroll", "badge": "Simulcast"},
            {"name": "Netflix", "badge": "4K HDR"}
        ],
        "xray": {
            "actors": [
                {"name": "Shion Wakayama", "role": "Momo Ayase", "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"},
                {"name": "Natsuki Hanae", "role": "Ken Takakura / Okarun", "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"}
            ],
            "song": {"title": "Otonoke", "artist": "Creepy Nuts"},
            "trivia": "Science SARU combined psychedelic pop art colors with hyper-kinetic sakuga animation to match the manga's manic pacing."
        }
    },
    {
        "id": "panchayat-3",
        "title": "Panchayat: Season 3",
        "type": "series",
        "studio": "Hotstar",
        "match": "98% Match",
        "rating": "U/A 13+",
        "runtime": "8 Episodes",
        "year": "2024",
        "genres": ["Comedy", "Drama"],
        "overview": "Abhishek Tripathi navigates political crosswinds, local village rivalries, and his ongoing MBA aspirations as election season descends upon the quiet village of Phulera.",
        "backdrop": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=80",
        "poster": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80",
        "youtubeId": "W236L7yWl84",
        "audio": ["Hindi 5.1 Original", "Tamil", "Telugu", "Bengali"],
        "providers": [
            {"name": "Prime Video", "badge": "Original"}
        ],
        "xray": {
            "actors": [
                {"name": "Jitendra Kumar", "role": "Abhishek Tripathi (Sachiv Ji)", "image": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&q=80"},
                {"name": "Neena Gupta", "role": "Manju Devi", "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"}
            ],
            "song": {"title": "Hiya Ho", "artist": "Anurag Saikia"},
            "trivia": "Filmed continuously in Mahodiya village, Sehore district in Madhya Pradesh through sweltering 45°C summer temperatures."
        }
    },
    {
        "id": "top-gun",
        "title": "Top Gun: Maverick",
        "type": "movies",
        "studio": "Paramount",
        "match": "97% Match",
        "rating": "U/A 13+",
        "runtime": "2h 10m",
        "year": "2022",
        "genres": ["Action", "Drama"],
        "overview": "After thirty years, Pete 'Maverick' Mitchell is testing the limits of supersonic flight before training a detachment of Top Gun graduates for a specialized, perilous mission.",
        "backdrop": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80",
        "poster": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
        "youtubeId": "giXco2JaZ_4",
        "audio": ["English Atmos", "Hindi 5.1", "Spanish 5.1"],
        "providers": [
            {"name": "Prime Video", "badge": "4K UHD"},
            {"name": "JioCinema", "badge": "Dolby Atmos"}
        ],
        "xray": {
            "actors": [
                {"name": "Tom Cruise", "role": "Pete 'Maverick' Mitchell", "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80"},
                {"name": "Miles Teller", "role": "Bradley 'Rooster' Bradshaw", "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"}
            ],
            "song": {"title": "Hold My Hand", "artist": "Lady Gaga"},
            "trivia": "All cast members completed a 5-month aviation syllabus personally engineered by Tom Cruise to withstand up to 7.5 Gs in real Navy F/A-18 cockpits."
        }
    },
    {
        "id": "rrr",
        "title": "RRR",
        "type": "movies",
        "studio": "Hotstar",
        "match": "98% Match",
        "rating": "U/A 16+",
        "runtime": "3h 07m",
        "year": "2022",
        "genres": ["Action", "Drama", "History"],
        "overview": "A fearless revolutionary and an officer in the British force develop an unbreakable bond in 1920s India, unaware that they stand on opposite sides of a national uprising.",
        "backdrop": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1920&q=80",
        "poster": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80",
        "youtubeId": "GY4BgdUSpbE",
        "audio": ["Telugu Original Atmos", "Hindi Dubbed 5.1", "Tamil", "Malayalam", "Kannada"],
        "providers": [
            {"name": "Netflix", "badge": "Hindi 4K HDR"},
            {"name": "Hotstar", "badge": "South Languages"}
        ],
        "xray": {
            "actors": [
                {"name": "N.T. Rama Rao Jr.", "role": "Komaram Bheem", "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"},
                {"name": "Ram Charan", "role": "Alluri Sitarama Raju", "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"}
            ],
            "song": {"title": "Naatu Naatu", "artist": "M.M. Keeravani"},
            "trivia": "Won the Academy Award for Best Original Song; the interval compound action sequence took 65 consecutive nights of filming."
        }
    },
    {
        "id": "bleach-tybw",
        "title": "Bleach: Thousand-Year Blood War",
        "type": "anime",
        "studio": "Ufotable",
        "match": "98% Match",
        "rating": "U/A 16+",
        "runtime": "26 Episodes",
        "year": "2024",
        "genres": ["Action", "Supernatural", "Fantasy"],
        "overview": "The peace is abruptly broken when warning sirens blare through Soul Society. The Quincy Emperor Yhwach awakens to reclaim the realm from the Shinigami.",
        "backdrop": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1920&q=80",
        "poster": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80",
        "youtubeId": "78WIYMxpHuk",
        "audio": ["Japanese 5.1", "English Dub", "Hindi Dub"],
        "providers": [
            {"name": "Hotstar", "badge": "Simulcast 4K"},
            {"name": "Hulu", "badge": "Exclusive"}
        ],
        "xray": {
            "actors": [
                {"name": "Masakazu Morita", "role": "Ichigo Kurosaki", "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"}
            ],
            "song": {"title": "SCAR", "artist": "Tatsuya Kitani"},
            "trivia": "Tite Kubo closely collaborated with Pierrot Films to write newly animated battle scenes not originally present in the weekly manga chapters."
        }
    },
    {
        "id": "house-of-dragon",
        "title": "House of the Dragon: Season 2",
        "type": "series",
        "studio": "HBO Max",
        "match": "97% Match",
        "rating": "18+",
        "runtime": "8 Episodes",
        "year": "2024",
        "genres": ["Fantasy", "Action", "Drama"],
        "overview": "Westeros sits on the precipice of a bloody civil war as the Black and Green Councils fight for King Aegon and Queen Rhaenyra's rightful claims to the Iron Throne.",
        "backdrop": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80",
        "poster": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
        "youtubeId": "F9U-CH980H0",
        "audio": ["English Dolby Atmos", "Hindi 5.1", "Tamil", "Telugu"],
        "providers": [
            {"name": "JioCinema", "badge": "HBO Original 4K"},
            {"name": "HBO Max", "badge": "Exclusive"}
        ],
        "xray": {
            "actors": [
                {"name": "Emma D'Arcy", "role": "Queen Rhaenyra Targaryen", "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"},
                {"name": "Matt Smith", "role": "Prince Daemon Targaryen", "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80"}
            ],
            "song": {"title": "The Prince That Was Promised", "artist": "Ramin Djawadi"},
            "trivia": "Each dragon in Season 2 was engineered with individual skull biomechanics and distinctive flight patterns inspired by eagles and Komodo dragons."
        }
    }
]

STUDIOS_LIST = [
    {"name": "Crunchyroll", "type": "Anime Simulcasts", "icon": "ph-sparkle", "color": "text-orange-400"},
    {"name": "MAPPA", "type": "Anime Vault", "icon": "ph-sword", "color": "text-red-500"},
    {"name": "HBO Max", "type": "Prestige Series", "icon": "ph-television", "color": "text-purple-400"},
    {"name": "Paramount", "type": "Blockbuster Hub", "icon": "ph-mountains", "color": "text-blue-400"},
    {"name": "Ufotable", "type": "Cinematic Sakuga", "icon": "ph-fire", "color": "text-emerald-400"},
    {"name": "Hotstar", "type": "Regional Thrillers", "icon": "ph-star-four", "color": "text-yellow-400"},
]
