/**
 * MOVAni Master JavaScript API Module & Vercel Serverless Function
 * Provides instant access to streaming catalog, metadata, search, and rankings.
 * Works seamlessly in Node.js, Vercel Serverless Functions, and browser environments.
 */

const CATALOG_DATA = [
  {
    "audio": [
      "Japanese 5.1",
      "English Dub",
      "Hindi Dub",
      "Telugu",
      "Tamil"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/5DUMPBSnHOZsbBv81GFXZXvDpo6.jpg",
    "dubs": [
      "Japanese (Original)",
      "Kannada Dubbed",
      "Hindi Dubbed",
      "Tamil Dubbed",
      "Telugu Dubbed",
      "Malayalam Dubbed",
      "Bengali Dubbed",
      "English Dubbed"
    ],
    "genres": [
      "Action",
      "Dark Fantasy",
      "Supernatural"
    ],
    "id": "cm-reze",
    "match": "99% Match",
    "movieTmdbId": 1218925,
    "overview": "Denji encounters the mysterious Reze amidst the Tokyo rain, unaware she harbors the explosive heart of the Bomb Devil. As devil hunter factions collide, loyalties are tested in an all-out urban war.",
    "poster": "https://image.tmdb.org/t/p/w780/npdB6eFzizki0WaZ1OvKcJrWe97.jpg",
    "providers": [
      {
        "badge": "Simulcast HD",
        "name": "Crunchyroll"
      },
      {
        "badge": "4K UHD",
        "name": "Prime Video"
      }
    ],
    "rating": "U/A 16+",
    "runtime": "12 Episodes",
    "studio": "MAPPA",
    "subs": [
      "Japanese [Sub]",
      "Kannada [Sub]",
      "Hindi [Sub]",
      "Tamil [Sub]",
      "Telugu [Sub]",
      "Malayalam [Sub]",
      "Bengali [Sub]",
      "Marathi [Sub]",
      "Punjabi [Sub]",
      "English [CC]"
    ],
    "title": "Chainsaw Man: Reze Arc",
    "tmdbId": 114410,
    "type": "anime",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
          "name": "Kikunosuke Toya",
          "role": "Denji"
        },
        {
          "image": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80",
          "name": "Reina Ueda",
          "role": "Reze / Bomb Devil"
        }
      ],
      "song": {
        "artist": "Kenshi Yonezu",
        "title": "Kick Back"
      },
      "trivia": "MAPPA spent nearly 18 weeks hand-sketching the high-speed urban rail fight sequences to maintain cinematic sakuga motion."
    },
    "year": "2024",
    "youtubeId": "j9sSzNmB5po"
  },
  {
    "audio": [
      "Japanese Original",
      "Hindi Dubbed",
      "English 5.1",
      "Tamil"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/xMNH87maNLt9n2bMDYeI6db5VFm.jpg",
    "dubs": [
      "Japanese (Original)",
      "Kannada Dubbed",
      "Hindi Dubbed",
      "Tamil Dubbed",
      "Telugu Dubbed",
      "Malayalam Dubbed",
      "Bengali Dubbed",
      "English Dubbed"
    ],
    "genres": [
      "Action",
      "Fantasy",
      "Adventure"
    ],
    "id": "solo-leveling",
    "match": "98% Match",
    "overview": "In a world where hunters awaken with magical abilities, the weakest hunter Sung Jinwoo is left for dead in a double dungeon—only to wake up with a mysterious system that allows him to level up without limits.",
    "poster": "https://image.tmdb.org/t/p/w780/geCRueV3ElhRTr0xtJuEWJt6dJ1.jpg",
    "providers": [
      {
        "badge": "Official Exclusive",
        "name": "Crunchyroll"
      },
      {
        "badge": "Dubbed Hub",
        "name": "Hotstar"
      }
    ],
    "rating": "U/A 16+",
    "runtime": "12 Episodes",
    "studio": "Crunchyroll",
    "subs": [
      "Japanese [Sub]",
      "Kannada [Sub]",
      "Hindi [Sub]",
      "Tamil [Sub]",
      "Telugu [Sub]",
      "Malayalam [Sub]",
      "Bengali [Sub]",
      "Marathi [Sub]",
      "Punjabi [Sub]",
      "English [CC]"
    ],
    "title": "Solo Leveling: Arise",
    "tmdbId": 127532,
    "type": "anime",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
          "name": "Taito Ban",
          "role": "Sung Jinwoo"
        },
        {
          "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
          "name": "Genta Nakamura",
          "role": "Yoo Jinho"
        }
      ],
      "song": {
        "artist": "SawanoHiroyuki[nZk]",
        "title": "LEveL"
      },
      "trivia": "The digital webtoon adaptation hit over 14.3 billion views worldwide prior to this television anime premiere."
    },
    "year": "2024",
    "youtubeId": "uYPbbksJxIg"
  },
  {
    "audio": [
      "English Dolby Atmos",
      "Hindi Dubbed",
      "German 5.1"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/7CENyUim29IEsaJhUxIGymCRvPu.jpg",
    "dubs": [
      "English (Original)",
      "Kannada Dubbed",
      "Hindi Dubbed",
      "Tamil Dubbed",
      "Telugu Dubbed",
      "Malayalam Dubbed",
      "Bengali Dubbed",
      "Marathi Dubbed",
      "Punjabi Dubbed",
      "Spanish",
      "French"
    ],
    "genres": [
      "Biography",
      "Drama",
      "History"
    ],
    "id": "oppenheimer",
    "match": "97% Match",
    "overview": "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during the Manhattan Project at Los Alamos.",
    "poster": "https://image.tmdb.org/t/p/w780/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    "providers": [
      {
        "badge": "4K UHD",
        "name": "Prime Video"
      },
      {
        "badge": "Premium",
        "name": "JioCinema"
      }
    ],
    "rating": "U/A 16+",
    "runtime": "3h 00m",
    "studio": "Paramount",
    "subs": [
      "Kannada [Sub]",
      "Hindi [Sub]",
      "Tamil [Sub]",
      "Telugu [Sub]",
      "Malayalam [Sub]",
      "Bengali [Sub]",
      "Marathi [Sub]",
      "Punjabi [Sub]",
      "English [CC]"
    ],
    "title": "Oppenheimer",
    "tmdbId": 872585,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
          "name": "Cillian Murphy",
          "role": "J. Robert Oppenheimer"
        },
        {
          "image": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=120&q=80",
          "name": "Robert Downey Jr.",
          "role": "Lewis Strauss"
        }
      ],
      "song": {
        "artist": "Ludwig Göransson",
        "title": "Can You Hear the Music"
      },
      "trivia": "Christopher Nolan avoided using CGI completely, choosing practical explosive effects with real magnesium charges for the Trinity test."
    },
    "year": "2023",
    "youtubeId": "bK6ldnjE3Y0"
  },
  {
    "audio": [
      "Hindi 5.1 Original",
      "Tamil",
      "Telugu",
      "Kannada",
      "Malayalam"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/3dV7pWAdwIPKR2lMIACMfObXdgK.jpg",
    "dubs": [
      "Hindi (Original)",
      "Kannada Dubbed",
      "Tamil Dubbed",
      "Telugu Dubbed",
      "Malayalam Dubbed",
      "Bengali Dubbed",
      "Marathi Dubbed",
      "English Dubbed"
    ],
    "genres": [
      "Crime",
      "Action",
      "Thriller"
    ],
    "id": "mirzapur-3",
    "match": "96% Match",
    "overview": "With Kaleen Bhaiya sidelined and Guddu Pandit consolidating power over the Purvanchal throne, fresh rivals emerge from the shadows in a vicious struggle for supremacy.",
    "poster": "https://image.tmdb.org/t/p/w780/1rxLUFVrtTo82OxhbDXJDiJVkwL.jpg",
    "providers": [
      {
        "badge": "Original",
        "name": "Prime Video"
      },
      {
        "badge": "Special Hub",
        "name": "Hotstar"
      }
    ],
    "rating": "18+",
    "runtime": "10 Episodes",
    "studio": "Hotstar",
    "subs": [
      "Kannada [Sub]",
      "Hindi [Sub]",
      "Tamil [Sub]",
      "Telugu [Sub]",
      "Malayalam [Sub]",
      "Bengali [Sub]",
      "Marathi [Sub]",
      "Punjabi [Sub]",
      "English [CC]"
    ],
    "title": "Mirzapur: Season 3",
    "tmdbId": 84105,
    "type": "series",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&q=80",
          "name": "Ali Fazal",
          "role": "Guddu Pandit"
        },
        {
          "image": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80",
          "name": "Pankaj Tripathi",
          "role": "Akhandanand Tripathi"
        }
      ],
      "song": {
        "artist": "Anand Bhaskar",
        "title": "Bhaukaal Theme"
      },
      "trivia": "Filmed across real rustic terrains in Uttar Pradesh with live audio capture in authentic regional Purvanchal dialect."
    },
    "year": "2024",
    "youtubeId": "33o3s4Vs4Sw"
  },
  {
    "audio": [
      "Japanese 5.1",
      "Hindi Dub",
      "English 5.1",
      "Tamil"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/3GQKYh6Trm8pxd2AypovoYQf4Ay.jpg",
    "dubs": [
      "Japanese (Original)",
      "Kannada Dubbed",
      "Hindi Dubbed",
      "Tamil Dubbed",
      "Telugu Dubbed",
      "Malayalam Dubbed",
      "Bengali Dubbed",
      "English Dubbed"
    ],
    "genres": [
      "Action",
      "Fantasy",
      "Historical"
    ],
    "id": "demon-slayer",
    "match": "99% Match",
    "overview": "Tanjiro visits the Stone Hashira, Gyomei Himejima, who intends to prepare him for the forthcoming battles. The training to become a Hashira is grueling and tests physical limits.",
    "poster": "https://image.tmdb.org/t/p/w780/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg",
    "providers": [
      {
        "badge": "Simulcast",
        "name": "Crunchyroll"
      },
      {
        "badge": "4K HDR",
        "name": "Netflix"
      }
    ],
    "rating": "U/A 13+",
    "runtime": "8 Episodes",
    "studio": "Ufotable",
    "subs": [
      "Japanese [Sub]",
      "Kannada [Sub]",
      "Hindi [Sub]",
      "Tamil [Sub]",
      "Telugu [Sub]",
      "Malayalam [Sub]",
      "Bengali [Sub]",
      "Marathi [Sub]",
      "Punjabi [Sub]",
      "English [CC]"
    ],
    "title": "Demon Slayer: Hashira Training",
    "tmdbId": 85937,
    "type": "anime",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
          "name": "Natsuki Hanae",
          "role": "Tanjiro Kamado"
        },
        {
          "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
          "name": "Hiro Shimono",
          "role": "Zenitsu Agatsuma"
        }
      ],
      "song": {
        "artist": "MY FIRST STORY x HYDE",
        "title": "Mugen"
      },
      "trivia": "Ufotable deployed proprietary custom lighting shaders to synchronize Tanjiro's Hinokami Kagura flame particle effects."
    },
    "year": "2024",
    "youtubeId": "6MSY8_acauE"
  },
  {
    "audio": [
      "English 5.1",
      "Hindi 5.1",
      "Spanish 5.1"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/bq28ajZaoMyzEIm6REelqyqtEDZ.jpg",
    "dubs": [
      "English (Original)",
      "Kannada Dubbed",
      "Hindi Dubbed",
      "Tamil Dubbed",
      "Telugu Dubbed",
      "Malayalam Dubbed",
      "Bengali Dubbed",
      "Marathi Dubbed",
      "Punjabi Dubbed",
      "Spanish",
      "French"
    ],
    "genres": [
      "Action",
      "Dark Comedy",
      "Sci-Fi"
    ],
    "id": "the-boys-4",
    "match": "95% Match",
    "overview": "Victoria Neuman is closer than ever to the Oval Office and under the muscular thumb of Homelander. Butcher, with months to live, must find a way to save the world.",
    "poster": "https://image.tmdb.org/t/p/w780/in1R2dDc421JxsoRWaIIAqVI2KE.jpg",
    "providers": [
      {
        "badge": "Original 4K",
        "name": "Prime Video"
      }
    ],
    "rating": "18+",
    "runtime": "8 Episodes",
    "studio": "HBO Max",
    "subs": [
      "Kannada [Sub]",
      "Hindi [Sub]",
      "Tamil [Sub]",
      "Telugu [Sub]",
      "Malayalam [Sub]",
      "Bengali [Sub]",
      "Marathi [Sub]",
      "Punjabi [Sub]",
      "English [CC]"
    ],
    "title": "The Boys: Season 4",
    "tmdbId": 76479,
    "type": "series",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
          "name": "Karl Urban",
          "role": "Billy Butcher"
        },
        {
          "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
          "name": "Antony Starr",
          "role": "Homelander"
        }
      ],
      "song": {
        "artist": "The Clash",
        "title": "Rock the Casbah"
      },
      "trivia": "Karl Urban performed over 80% of his combat stunts despite wearing heavy prosthetic battle rigs in Season 4."
    },
    "year": "2024",
    "youtubeId": "EzFXDvC-EwM"
  },
  {
    "audio": [
      "English Dolby Atmos",
      "Hindi",
      "Telugu",
      "French 5.1"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/eZ239CUp1d6OryZEBPnO2n87gMG.jpg",
    "dubs": [
      "English (Original)",
      "Kannada Dubbed",
      "Hindi Dubbed",
      "Tamil Dubbed",
      "Telugu Dubbed",
      "Malayalam Dubbed",
      "Bengali Dubbed",
      "Marathi Dubbed",
      "Punjabi Dubbed",
      "Spanish",
      "French"
    ],
    "genres": [
      "Sci-Fi",
      "Adventure",
      "Drama"
    ],
    "id": "dune-2",
    "match": "99% Match",
    "overview": "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family in an epic struggle for Arrakis.",
    "poster": "https://image.tmdb.org/t/p/w780/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg",
    "providers": [
      {
        "badge": "Premium 4K",
        "name": "JioCinema"
      },
      {
        "badge": "Dolby Atmos",
        "name": "Prime Video"
      }
    ],
    "rating": "U/A 13+",
    "runtime": "2h 46m",
    "studio": "Paramount",
    "subs": [
      "Kannada [Sub]",
      "Hindi [Sub]",
      "Tamil [Sub]",
      "Telugu [Sub]",
      "Malayalam [Sub]",
      "Bengali [Sub]",
      "Marathi [Sub]",
      "Punjabi [Sub]",
      "English [CC]"
    ],
    "title": "Dune: Part Two",
    "tmdbId": 693134,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
          "name": "Timothée Chalamet",
          "role": "Paul Atreides"
        },
        {
          "image": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80",
          "name": "Zendaya",
          "role": "Chani"
        }
      ],
      "song": {
        "artist": "Hans Zimmer",
        "title": "A Time of Quiet Between the Storms"
      },
      "trivia": "Filmed with infrared camera sensors in the sand dunes of Abu Dhabi and Jordan for eerie celestial lighting."
    },
    "year": "2024",
    "youtubeId": "Way9Dexny3w"
  },
  {
    "audio": [
      "Japanese 5.1",
      "Hindi Dubbed",
      "English 5.1",
      "Tamil"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/qpin8cASXEVtwhzNsprHYFiOAGk.jpg",
    "dubs": [
      "Japanese (Original)",
      "Kannada Dubbed",
      "Hindi Dubbed",
      "Tamil Dubbed",
      "Telugu Dubbed",
      "Malayalam Dubbed",
      "Bengali Dubbed",
      "English Dubbed"
    ],
    "genres": [
      "Action",
      "Supernatural",
      "Dark Fantasy"
    ],
    "id": "jujutsu-kaisen",
    "match": "98% Match",
    "overview": "On October 31st in Shibuya, a veil descends trapping civilians. Satoru Gojo enters the lion's den alone against the high-grade curses led by Geto and Mahito.",
    "poster": "https://image.tmdb.org/t/p/w780/6qQzMJG27XOJsyAEEIisoJB45j2.jpg",
    "providers": [
      {
        "badge": "HD Simulcast",
        "name": "Crunchyroll"
      },
      {
        "badge": "Streaming",
        "name": "Netflix"
      }
    ],
    "rating": "U/A 16+",
    "runtime": "23 Episodes",
    "studio": "MAPPA",
    "subs": [
      "Japanese [Sub]",
      "Kannada [Sub]",
      "Hindi [Sub]",
      "Tamil [Sub]",
      "Telugu [Sub]",
      "Malayalam [Sub]",
      "Bengali [Sub]",
      "Marathi [Sub]",
      "Punjabi [Sub]",
      "English [CC]"
    ],
    "title": "Jujutsu Kaisen: Shibuya Incident",
    "tmdbId": 95479,
    "type": "anime",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
          "name": "Junya Enoki",
          "role": "Yuji Itadori"
        },
        {
          "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
          "name": "Yuichi Nakamura",
          "role": "Satoru Gojo"
        }
      ],
      "song": {
        "artist": "King Gnu",
        "title": "SPECIALZ"
      },
      "trivia": "The subway station fight sequences were mapped millimeter-by-millimeter against real Shibuya Tokyo stations."
    },
    "year": "2023",
    "youtubeId": "9OhV3IWUsxE"
  },
  {
    "audio": [
      "Japanese / English 5.1",
      "Hindi Dub",
      "Tamil",
      "Telugu"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/bwSmgmd90hCWwqOKQYTEraeOZhJ.jpg",
    "dubs": [
      "English (Original)",
      "Kannada Dubbed",
      "Hindi Dubbed",
      "Tamil Dubbed",
      "Telugu Dubbed",
      "Malayalam Dubbed",
      "Bengali Dubbed",
      "Marathi Dubbed",
      "Punjabi Dubbed",
      "Spanish",
      "French"
    ],
    "genres": [
      "Drama",
      "Historical",
      "Adventure"
    ],
    "id": "shogun",
    "match": "99% Match",
    "overview": "When a mysterious European ship is found marooned in a nearby fishing village, Lord Yoshii Toranaga discovers secrets that could tip the scales of power in feudal Japan.",
    "poster": "https://image.tmdb.org/t/p/w780/7O4iVfOMQmdCSxhOg1WnzG1AgYT.jpg",
    "providers": [
      {
        "badge": "FX Series 4K",
        "name": "Hotstar"
      },
      {
        "badge": "Original",
        "name": "Hulu"
      }
    ],
    "rating": "18+",
    "runtime": "10 Episodes",
    "studio": "Hotstar",
    "subs": [
      "Kannada [Sub]",
      "Hindi [Sub]",
      "Tamil [Sub]",
      "Telugu [Sub]",
      "Malayalam [Sub]",
      "Bengali [Sub]",
      "Marathi [Sub]",
      "Punjabi [Sub]",
      "English [CC]"
    ],
    "title": "Shōgun",
    "tmdbId": 126308,
    "type": "series",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
          "name": "Hiroyuki Sanada",
          "role": "Lord Yoshii Toranaga"
        },
        {
          "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
          "name": "Anna Sawai",
          "role": "Toda Mariko"
        }
      ],
      "song": {
        "artist": "Atticus Ross & Leopold Ross",
        "title": "The Shōgun Suite"
      },
      "trivia": "Over 800 hand-crafted samurai armor suits were constructed using historical museum blueprints from the Sengoku era."
    },
    "year": "2024",
    "youtubeId": "yAN5uspO_hk"
  },
  {
    "audio": [
      "English Atmos",
      "Hindi 5.1",
      "Tamil",
      "Telugu"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/kVd3a9YeLGkoeR50jGEXM6EqseS.jpg",
    "dubs": [
      "English (Original)",
      "Kannada Dubbed",
      "Hindi Dubbed",
      "Tamil Dubbed",
      "Telugu Dubbed",
      "Malayalam Dubbed",
      "Bengali Dubbed",
      "Marathi Dubbed",
      "Punjabi Dubbed",
      "Spanish",
      "French"
    ],
    "genres": [
      "Animation",
      "Action",
      "Sci-Fi"
    ],
    "id": "spider-verse",
    "match": "98% Match",
    "overview": "Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence, but clashes with Miguel O'Hara.",
    "poster": "https://image.tmdb.org/t/p/w780/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
    "providers": [
      {
        "badge": "4K HDR",
        "name": "Netflix"
      },
      {
        "badge": "Rental",
        "name": "Prime Video"
      }
    ],
    "rating": "U/A 13+",
    "runtime": "2h 20m",
    "studio": "Paramount",
    "subs": [
      "Kannada [Sub]",
      "Hindi [Sub]",
      "Tamil [Sub]",
      "Telugu [Sub]",
      "Malayalam [Sub]",
      "Bengali [Sub]",
      "Marathi [Sub]",
      "Punjabi [Sub]",
      "English [CC]"
    ],
    "title": "Spider-Man: Across the Spider-Verse",
    "tmdbId": 569094,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
          "name": "Shameik Moore",
          "role": "Miles Morales"
        },
        {
          "image": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80",
          "name": "Hailee Steinfeld",
          "role": "Gwen Stacy"
        }
      ],
      "song": {
        "artist": "Metro Boomin & A$AP Rocky",
        "title": "Am I Dreaming"
      },
      "trivia": "More than 1,000 animators worked on the film to render six completely distinct visual and dimensional animation art styles."
    },
    "year": "2023",
    "youtubeId": "cqGjhVJWtEg"
  },
  {
    "audio": [
      "Japanese 5.1",
      "Hindi Dubbed",
      "English 5.1"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/rBOnrVlck7BIlGeWVlzYiZeg4l2.jpg",
    "dubs": [
      "Japanese (Original)",
      "Kannada Dubbed",
      "Hindi Dubbed",
      "Tamil Dubbed",
      "Telugu Dubbed",
      "Malayalam Dubbed",
      "Bengali Dubbed",
      "English Dubbed"
    ],
    "genres": [
      "Adventure",
      "Drama",
      "Fantasy"
    ],
    "id": "frieren",
    "match": "99% Match",
    "overview": "Elf mage Frieren, having defeated the Demon King alongside heroes who now grow old and pass away, begins a new reflective journey across the continent to understand human hearts.",
    "poster": "https://image.tmdb.org/t/p/w780/dqZENchTd7lp5zht7BdlqM7RBhD.jpg",
    "providers": [
      {
        "badge": "Highest Rated",
        "name": "Crunchyroll"
      },
      {
        "badge": "Streaming",
        "name": "Netflix"
      }
    ],
    "rating": "U/A 13+",
    "runtime": "28 Episodes",
    "studio": "Crunchyroll",
    "subs": [
      "Japanese [Sub]",
      "Kannada [Sub]",
      "Hindi [Sub]",
      "Tamil [Sub]",
      "Telugu [Sub]",
      "Malayalam [Sub]",
      "Bengali [Sub]",
      "Marathi [Sub]",
      "Punjabi [Sub]",
      "English [CC]"
    ],
    "title": "Frieren: Beyond Journey's End",
    "tmdbId": 209867,
    "type": "anime",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
          "name": "Atsumi Tanezaki",
          "role": "Frieren"
        }
      ],
      "song": {
        "artist": "YOASOBI",
        "title": "The Brave (Yūsha)"
      },
      "trivia": "Produced by Studio Madhouse, the series earned the #1 all-time spot on international anime ranking boards."
    },
    "year": "2024",
    "youtubeId": "Iwr1aLEDpe4"
  },
  {
    "audio": [
      "English Dolby Atmos",
      "Hindi 5.1",
      "Tamil"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/coaPCIqQBPUZsOnJcWZxhaORcDT.jpg",
    "dubs": [
      "English (Original)",
      "Kannada Dubbed",
      "Hindi Dubbed",
      "Tamil Dubbed",
      "Telugu Dubbed",
      "Malayalam Dubbed",
      "Bengali Dubbed",
      "Marathi Dubbed",
      "Punjabi Dubbed",
      "Spanish",
      "French"
    ],
    "genres": [
      "Sci-Fi",
      "Action",
      "Adventure"
    ],
    "id": "fallout",
    "match": "97% Match",
    "overview": "In a future, post-apocalyptic Los Angeles brought about by nuclear decimation, citizens must live in underground bunkers to protect themselves from radiation and irradiated surface mutants.",
    "poster": "https://image.tmdb.org/t/p/w780/c15BtJxCXMrISLVmysdsnZUPQft.jpg",
    "providers": [
      {
        "badge": "Original 4K",
        "name": "Prime Video"
      }
    ],
    "rating": "18+",
    "runtime": "8 Episodes",
    "studio": "Paramount",
    "subs": [
      "Kannada [Sub]",
      "Hindi [Sub]",
      "Tamil [Sub]",
      "Telugu [Sub]",
      "Malayalam [Sub]",
      "Bengali [Sub]",
      "Marathi [Sub]",
      "Punjabi [Sub]",
      "English [CC]"
    ],
    "title": "Fallout: Season 1",
    "tmdbId": 106379,
    "type": "series",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80",
          "name": "Ella Purnell",
          "role": "Lucy MacLean"
        },
        {
          "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
          "name": "Walton Goggins",
          "role": "The Ghoul"
        }
      ],
      "song": {
        "artist": "The Ink Spots",
        "title": "I Don't Want to Set the World on Fire"
      },
      "trivia": "The motorized Brotherhood of Steel T-60 Power Armor was physically fabricated with fiberglass shells weighing over 65 lbs."
    },
    "year": "2024",
    "youtubeId": "0kQ8i2FpRDk"
  },
  {
    "audio": [
      "English Dolby Atmos",
      "Hindi 5.1",
      "French 5.1"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/8sNiAPPYU14PUepFNeSNGUTiHW.jpg",
    "dubs": [
      "English (Original)",
      "Kannada Dubbed",
      "Hindi Dubbed",
      "Tamil Dubbed",
      "Telugu Dubbed",
      "Malayalam Dubbed",
      "Bengali Dubbed",
      "Marathi Dubbed",
      "Punjabi Dubbed",
      "Spanish",
      "French"
    ],
    "genres": [
      "Sci-Fi",
      "Drama",
      "Adventure"
    ],
    "id": "interstellar",
    "match": "99% Match",
    "overview": "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft along with a team of researchers through a mysterious wormhole.",
    "poster": "https://image.tmdb.org/t/p/w780/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg",
    "providers": [
      {
        "badge": "4K UHD",
        "name": "Prime Video"
      },
      {
        "badge": "Dolby Atmos",
        "name": "JioCinema"
      }
    ],
    "rating": "U/A 13+",
    "runtime": "2h 49m",
    "studio": "Paramount",
    "subs": [
      "Kannada [Sub]",
      "Hindi [Sub]",
      "Tamil [Sub]",
      "Telugu [Sub]",
      "Malayalam [Sub]",
      "Bengali [Sub]",
      "Marathi [Sub]",
      "Punjabi [Sub]",
      "English [CC]"
    ],
    "title": "Interstellar",
    "tmdbId": 157336,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
          "name": "Matthew McConaughey",
          "role": "Cooper"
        },
        {
          "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
          "name": "Anne Hathaway",
          "role": "Brand"
        }
      ],
      "song": {
        "artist": "Hans Zimmer",
        "title": "Cornfield Chase"
      },
      "trivia": "Theoretical physicist Kip Thorne provided exact relativistic equations to render the Gargantua black hole accurately on supercomputers."
    },
    "year": "2014",
    "youtubeId": "zSWdZVtXT7E"
  },
  {
    "audio": [
      "Japanese 5.1",
      "English Dub",
      "Hindi Dub"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/rqbCbjB19amtOtFQbb3K2lgm2zv.jpg",
    "dubs": [
      "Japanese (Original)",
      "Kannada Dubbed",
      "Hindi Dubbed",
      "Tamil Dubbed",
      "Telugu Dubbed",
      "Malayalam Dubbed",
      "Bengali Dubbed",
      "English Dubbed"
    ],
    "genres": [
      "Action",
      "Dark Fantasy",
      "Drama"
    ],
    "id": "aot-final",
    "match": "99% Match",
    "overview": "The battle for humanity's freedom reaches its devastating culmination as Eren Yeager commands the Rumbling across the sea to protect Paradis Island.",
    "poster": "https://image.tmdb.org/t/p/w780/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg",
    "providers": [
      {
        "badge": "Simulcast",
        "name": "Crunchyroll"
      },
      {
        "badge": "Streaming",
        "name": "Hotstar"
      }
    ],
    "rating": "18+",
    "runtime": "28 Episodes",
    "studio": "MAPPA",
    "subs": [
      "Japanese [Sub]",
      "Kannada [Sub]",
      "Hindi [Sub]",
      "Tamil [Sub]",
      "Telugu [Sub]",
      "Malayalam [Sub]",
      "Bengali [Sub]",
      "Marathi [Sub]",
      "Punjabi [Sub]",
      "English [CC]"
    ],
    "title": "Attack on Titan: The Final Season",
    "tmdbId": 1429,
    "type": "anime",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
          "name": "Yuki Kaji",
          "role": "Eren Yeager"
        },
        {
          "image": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80",
          "name": "Yui Ishikawa",
          "role": "Mikasa Ackerman"
        }
      ],
      "song": {
        "artist": "SiM",
        "title": "The Rumbling"
      },
      "trivia": "Series creator Hajime Isayama personally oversaw the revised pacing of the Colossal Wall Titan march sequence."
    },
    "year": "2023",
    "youtubeId": "M_OauHnAFc8"
  },
  {
    "audio": [
      "Japanese 5.1",
      "Hindi Dubbed",
      "English 5.1"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/uNTrRKIOyKYISthoeizghtXPEOK.jpg",
    "dubs": [
      "Japanese (Original)",
      "Kannada Dubbed",
      "Hindi Dubbed",
      "Tamil Dubbed",
      "Telugu Dubbed",
      "Malayalam Dubbed",
      "Bengali Dubbed",
      "English Dubbed"
    ],
    "genres": [
      "Action",
      "Supernatural",
      "Comedy"
    ],
    "id": "dandadan",
    "match": "98% Match",
    "overview": "Momo Ayase, who believes in ghosts, and Okarun, who believes in extraterrestrial aliens, make a bet that throws them headfirst into explosive paranormal encounters.",
    "poster": "https://image.tmdb.org/t/p/w780/6qfZAOEUFIrbUH3JvePclx1nXzz.jpg",
    "providers": [
      {
        "badge": "Simulcast",
        "name": "Crunchyroll"
      },
      {
        "badge": "4K HDR",
        "name": "Netflix"
      }
    ],
    "rating": "U/A 16+",
    "runtime": "12 Episodes",
    "studio": "Crunchyroll",
    "subs": [
      "Japanese [Sub]",
      "Kannada [Sub]",
      "Hindi [Sub]",
      "Tamil [Sub]",
      "Telugu [Sub]",
      "Malayalam [Sub]",
      "Bengali [Sub]",
      "Marathi [Sub]",
      "Punjabi [Sub]",
      "English [CC]"
    ],
    "title": "Dandadan",
    "tmdbId": 240411,
    "type": "anime",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
          "name": "Shion Wakayama",
          "role": "Momo Ayase"
        },
        {
          "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
          "name": "Natsuki Hanae",
          "role": "Ken Takakura / Okarun"
        }
      ],
      "song": {
        "artist": "Creepy Nuts",
        "title": "Otonoke"
      },
      "trivia": "Science SARU combined psychedelic pop art colors with hyper-kinetic sakuga animation to match the manga's manic pacing."
    },
    "year": "2024",
    "youtubeId": "6Kj1hc54nu0"
  },
  {
    "audio": [
      "Hindi 5.1 Original",
      "Tamil",
      "Telugu",
      "Bengali"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/iZ8EtGAqKWZdRJPzWfFseNfVxjh.jpg",
    "dubs": [
      "Hindi (Original)",
      "Kannada Dubbed",
      "Tamil Dubbed",
      "Telugu Dubbed",
      "Malayalam Dubbed",
      "Bengali Dubbed",
      "Marathi Dubbed",
      "English Dubbed"
    ],
    "genres": [
      "Comedy",
      "Drama"
    ],
    "id": "panchayat-3",
    "match": "98% Match",
    "overview": "Abhishek Tripathi navigates political crosswinds, local village rivalries, and his ongoing MBA aspirations as election season descends upon the quiet village of Phulera.",
    "poster": "https://image.tmdb.org/t/p/w780/xrfvAhrMdT6Uwg5fyTyQAZBYyiu.jpg",
    "providers": [
      {
        "badge": "Original",
        "name": "Prime Video"
      }
    ],
    "rating": "U/A 13+",
    "runtime": "8 Episodes",
    "studio": "Hotstar",
    "subs": [
      "Kannada [Sub]",
      "Hindi [Sub]",
      "Tamil [Sub]",
      "Telugu [Sub]",
      "Malayalam [Sub]",
      "Bengali [Sub]",
      "Marathi [Sub]",
      "Punjabi [Sub]",
      "English [CC]"
    ],
    "title": "Panchayat: Season 3",
    "tmdbId": 101352,
    "type": "series",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&q=80",
          "name": "Jitendra Kumar",
          "role": "Abhishek Tripathi (Sachiv Ji)"
        },
        {
          "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
          "name": "Neena Gupta",
          "role": "Manju Devi"
        }
      ],
      "song": {
        "artist": "Anurag Saikia",
        "title": "Hiya Ho"
      },
      "trivia": "Filmed continuously in Mahodiya village, Sehore district in Madhya Pradesh through sweltering 45°C summer temperatures."
    },
    "year": "2024",
    "youtubeId": "9N3cFoLFjvw"
  },
  {
    "audio": [
      "English Atmos",
      "Hindi 5.1",
      "Spanish 5.1"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/AaV1YIdWKnjAIAOe8UUKBFm327v.jpg",
    "dubs": [
      "English (Original)",
      "Kannada Dubbed",
      "Hindi Dubbed",
      "Tamil Dubbed",
      "Telugu Dubbed",
      "Malayalam Dubbed",
      "Bengali Dubbed",
      "Marathi Dubbed",
      "Punjabi Dubbed",
      "Spanish",
      "French"
    ],
    "genres": [
      "Action",
      "Drama"
    ],
    "id": "top-gun",
    "match": "97% Match",
    "overview": "After thirty years, Pete 'Maverick' Mitchell is testing the limits of supersonic flight before training a detachment of Top Gun graduates for a specialized, perilous mission.",
    "poster": "https://image.tmdb.org/t/p/w780/n0YuM4f5lvGAP6MAW2kBIzugXnc.jpg",
    "providers": [
      {
        "badge": "4K UHD",
        "name": "Prime Video"
      },
      {
        "badge": "Dolby Atmos",
        "name": "JioCinema"
      }
    ],
    "rating": "U/A 13+",
    "runtime": "2h 10m",
    "studio": "Paramount",
    "subs": [
      "Kannada [Sub]",
      "Hindi [Sub]",
      "Tamil [Sub]",
      "Telugu [Sub]",
      "Malayalam [Sub]",
      "Bengali [Sub]",
      "Marathi [Sub]",
      "Punjabi [Sub]",
      "English [CC]"
    ],
    "title": "Top Gun: Maverick",
    "tmdbId": 361743,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
          "name": "Tom Cruise",
          "role": "Pete 'Maverick' Mitchell"
        },
        {
          "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
          "name": "Miles Teller",
          "role": "Bradley 'Rooster' Bradshaw"
        }
      ],
      "song": {
        "artist": "Lady Gaga",
        "title": "Hold My Hand"
      },
      "trivia": "All cast members completed a 5-month aviation syllabus personally engineered by Tom Cruise to withstand up to 7.5 Gs in real Navy F/A-18 cockpits."
    },
    "year": "2022",
    "youtubeId": "qSqVVswa420"
  },
  {
    "audio": [
      "Telugu Original Atmos",
      "Hindi Dubbed 5.1",
      "Tamil",
      "Malayalam",
      "Kannada"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/i0Y0wP8H6SRgjr6QmuwbtQbS24D.jpg",
    "dubs": [
      "Telugu (Original)",
      "Kannada Dubbed",
      "Hindi Dubbed",
      "Tamil Dubbed",
      "Malayalam Dubbed",
      "Bengali Dubbed",
      "English Dubbed"
    ],
    "genres": [
      "Action",
      "Drama",
      "History"
    ],
    "id": "rrr",
    "match": "98% Match",
    "overview": "A fearless revolutionary and an officer in the British force develop an unbreakable bond in 1920s India, unaware that they stand on opposite sides of a national uprising.",
    "poster": "https://image.tmdb.org/t/p/w780/wE0I6efAW4cDDmZQWtwZMOW44EJ.jpg",
    "providers": [
      {
        "badge": "Hindi 4K HDR",
        "name": "Netflix"
      },
      {
        "badge": "South Languages",
        "name": "Hotstar"
      }
    ],
    "rating": "U/A 16+",
    "runtime": "3h 07m",
    "studio": "Hotstar",
    "subs": [
      "Kannada [Sub]",
      "Hindi [Sub]",
      "Tamil [Sub]",
      "Telugu [Sub]",
      "Malayalam [Sub]",
      "Bengali [Sub]",
      "Marathi [Sub]",
      "Punjabi [Sub]",
      "English [CC]"
    ],
    "title": "RRR",
    "tmdbId": 579974,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
          "name": "N.T. Rama Rao Jr.",
          "role": "Komaram Bheem"
        },
        {
          "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
          "name": "Ram Charan",
          "role": "Alluri Sitarama Raju"
        }
      ],
      "song": {
        "artist": "M.M. Keeravani",
        "title": "Naatu Naatu"
      },
      "trivia": "Won the Academy Award for Best Original Song; the interval compound action sequence took 65 consecutive nights of filming."
    },
    "year": "2022",
    "youtubeId": "GY4BgdUSpbE"
  },
  {
    "audio": [
      "Japanese 5.1",
      "English Dub",
      "Hindi Dub"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/o0NsbcIvsllg6CJX0FBFY8wWbsn.jpg",
    "dubs": [
      "Japanese (Original)",
      "Kannada Dubbed",
      "Hindi Dubbed",
      "Tamil Dubbed",
      "Telugu Dubbed",
      "Malayalam Dubbed",
      "Bengali Dubbed",
      "English Dubbed"
    ],
    "genres": [
      "Action",
      "Supernatural",
      "Fantasy"
    ],
    "id": "bleach-tybw",
    "match": "98% Match",
    "overview": "The peace is abruptly broken when warning sirens blare through Soul Society. The Quincy Emperor Yhwach awakens to reclaim the realm from the Shinigami.",
    "poster": "https://image.tmdb.org/t/p/w780/2EewmxXe72ogD0EaWM8gqa0ccIw.jpg",
    "providers": [
      {
        "badge": "Simulcast 4K",
        "name": "Hotstar"
      },
      {
        "badge": "Exclusive",
        "name": "Hulu"
      }
    ],
    "rating": "U/A 16+",
    "runtime": "26 Episodes",
    "studio": "Ufotable",
    "subs": [
      "Japanese [Sub]",
      "Kannada [Sub]",
      "Hindi [Sub]",
      "Tamil [Sub]",
      "Telugu [Sub]",
      "Malayalam [Sub]",
      "Bengali [Sub]",
      "Marathi [Sub]",
      "Punjabi [Sub]",
      "English [CC]"
    ],
    "title": "Bleach: Thousand-Year Blood War",
    "tmdbId": 30984,
    "type": "anime",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
          "name": "Masakazu Morita",
          "role": "Ichigo Kurosaki"
        }
      ],
      "song": {
        "artist": "Tatsuya Kitani",
        "title": "SCAR"
      },
      "trivia": "Tite Kubo closely collaborated with Pierrot Films to write newly animated battle scenes not originally present in the weekly manga chapters."
    },
    "year": "2024",
    "youtubeId": "qvrag0mvouE"
  },
  {
    "audio": [
      "English Dolby Atmos",
      "Hindi 5.1",
      "Tamil",
      "Telugu"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/577eXC8wFQT0eUrJcgznSiFPRmk.jpg",
    "dubs": [
      "English (Original)",
      "Kannada Dubbed",
      "Hindi Dubbed",
      "Tamil Dubbed",
      "Telugu Dubbed",
      "Malayalam Dubbed",
      "Bengali Dubbed",
      "Marathi Dubbed",
      "Punjabi Dubbed",
      "Spanish",
      "French"
    ],
    "genres": [
      "Fantasy",
      "Action",
      "Drama"
    ],
    "id": "house-of-dragon",
    "match": "97% Match",
    "overview": "Westeros sits on the precipice of a bloody civil war as the Black and Green Councils fight for King Aegon and Queen Rhaenyra's rightful claims to the Iron Throne.",
    "poster": "https://image.tmdb.org/t/p/w780/7V0Ebks0GgpKvQ7QbLAIdX5dos4.jpg",
    "providers": [
      {
        "badge": "HBO Original 4K",
        "name": "JioCinema"
      },
      {
        "badge": "Exclusive",
        "name": "HBO Max"
      }
    ],
    "rating": "18+",
    "runtime": "8 Episodes",
    "studio": "HBO Max",
    "subs": [
      "Kannada [Sub]",
      "Hindi [Sub]",
      "Tamil [Sub]",
      "Telugu [Sub]",
      "Malayalam [Sub]",
      "Bengali [Sub]",
      "Marathi [Sub]",
      "Punjabi [Sub]",
      "English [CC]"
    ],
    "title": "House of the Dragon: Season 2",
    "tmdbId": 94997,
    "type": "series",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
          "name": "Emma D'Arcy",
          "role": "Queen Rhaenyra Targaryen"
        },
        {
          "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
          "name": "Matt Smith",
          "role": "Prince Daemon Targaryen"
        }
      ],
      "song": {
        "artist": "Ramin Djawadi",
        "title": "The Prince That Was Promised"
      },
      "trivia": "Each dragon in Season 2 was engineered with individual skull biomechanics and distinctive flight patterns inspired by eagles and Komodo dragons."
    },
    "year": "2024",
    "youtubeId": "YN2H_sKcmGw"
  },
  {
    "audio": [
      "Hindi Dubbed Original",
      "Japanese 5.1",
      "English 5.1",
      "Tamil",
      "Telugu",
      "Kannada 5.1"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/c2oiRa7V3bQzof4wVGzLXtWJ5QU.jpg",
    "dubs": [
      "Japanese (Original)",
      "Kannada Dubbed",
      "Hindi Dubbed",
      "Tamil Dubbed",
      "Telugu Dubbed",
      "Malayalam Dubbed",
      "Bengali Dubbed",
      "English Dubbed"
    ],
    "genres": [
      "Anime",
      "Comedy",
      "Sci-Fi",
      "Family"
    ],
    "id": "doraemon",
    "match": "99% Match",
    "overview": "Nobita Nobi's daily life is transformed when a futuristic robotic cat named Doraemon arrives from the 22nd century with an extraordinary four-dimensional pocket filled with mind-bending gadgets, time travel machines, and cosmic quests.",
    "poster": "https://image.tmdb.org/t/p/w780/9ZN1P32SHviL3SV51qLivxycvcx.jpg",
    "providers": [
      {
        "badge": "Kids Hub",
        "name": "Disney+ Hotstar"
      },
      {
        "badge": "Simulcast",
        "name": "JioCinema"
      }
    ],
    "rating": "U/A 7+",
    "runtime": "S1 • 26 Episodes",
    "studio": "Shin-Ei Animation",
    "subs": [
      "Japanese [Sub]",
      "Kannada [Sub]",
      "Hindi [Sub]",
      "Tamil [Sub]",
      "Telugu [Sub]",
      "Malayalam [Sub]",
      "Bengali [Sub]",
      "Marathi [Sub]",
      "Punjabi [Sub]",
      "English [CC]"
    ],
    "title": "Doraemon: Nobita's Cosmic Adventures",
    "tmdbId": 65733,
    "type": "anime",
    "xray": {
      "actors": [
        {
          "image": "https://image.tmdb.org/t/p/w185/8sNiAPPYU14PUepFNeSNGUTiHW.jpg",
          "name": "Wasabi Mizuta",
          "role": "Doraemon (Voice)"
        },
        {
          "image": "https://image.tmdb.org/t/p/w185/8sNiAPPYU14PUepFNeSNGUTiHW.jpg",
          "name": "Megumi Ohara",
          "role": "Nobita Nobi (Voice)"
        }
      ],
      "song": {
        "artist": "Mao",
        "title": "Yume wo Kanaete Doraemon"
      },
      "trivia": "Doraemon is recognized by the Japanese Ministry of Foreign Affairs as Japan's first official cultural anime ambassador."
    },
    "year": "2024",
    "youtubeId": "b-nqKIJczVE"
  },
  {
    "audio": [
      "Kannada Original Atmos",
      "Hindi Dubbed 5.1",
      "Tamil 5.1",
      "Telugu 5.1",
      "Malayalam"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/nsV5Mfi9FAV4w8eDsdr7uqVswOk.jpg",
    "dubs": [
      "Kannada (Original)",
      "Hindi Dubbed",
      "Tamil Dubbed",
      "Telugu Dubbed",
      "Malayalam Dubbed",
      "Bengali Dubbed",
      "Marathi Dubbed",
      "Punjabi Dubbed",
      "English Dubbed"
    ],
    "genres": [
      "Action",
      "Crime",
      "Drama"
    ],
    "id": "kgf-2",
    "isClassic": false,
    "isKannada": true,
    "isUpcoming": false,
    "language": "Kannada",
    "match": "99% Match",
    "movieTmdbId": 587412,
    "overview": "In the blood-soaked Kolar Gold Fields, Rocky's name strikes terror into all enemies. While his allies look up to him as their savior, the Indian government sees him as a looming threat to national sovereignty as Adheera prepares for vengeance.",
    "poster": "https://image.tmdb.org/t/p/w780/khNVygolU0TxLIDWff5tQlAhZ23.jpg",
    "providers": [
      {
        "badge": "4K Ultra HD",
        "name": "Prime Video"
      },
      {
        "badge": "Stream Now",
        "name": "MOVAni Pass"
      }
    ],
    "rating": "U/A 16+",
    "runtime": "2h 48m",
    "studio": "Hombale Films",
    "subs": [
      "Kannada [Sub]",
      "Hindi [Sub]",
      "Tamil [Sub]",
      "Telugu [Sub]",
      "Malayalam [Sub]",
      "Bengali [Sub]",
      "Marathi [Sub]",
      "Punjabi [Sub]",
      "English [CC]"
    ],
    "title": "K.G.F: Chapter 2",
    "tmdbId": 587412,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://image.tmdb.org/t/p/w185/8sNiAPPYU14PUepFNeSNGUTiHW.jpg",
          "name": "Yash",
          "role": "Raja Krishnappa Bairya / Rocky Bhai"
        },
        {
          "image": "https://image.tmdb.org/t/p/w185/8sNiAPPYU14PUepFNeSNGUTiHW.jpg",
          "name": "Sanjay Dutt",
          "role": "Adheera"
        }
      ],
      "song": {
        "artist": "Ravi Basrur",
        "title": "Toofan"
      },
      "trivia": "K.G.F: Chapter 2 broke all-time box office records as the highest-grossing Kannada film in cinematic history, surpassing ₹1,250 crores worldwide."
    },
    "year": "2022",
    "youtubeId": "Qah9sSIXJqk"
  },
  {
    "audio": [
      "Kannada Original Atmos",
      "Hindi Dubbed 5.1",
      "Tamil 5.1",
      "Telugu 5.1",
      "English"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/kXElm7wt2kAXEVwJqW4cFhP43nW.jpg",
    "dubs": [
      "Kannada (Original)",
      "Hindi Dubbed",
      "Tamil Dubbed",
      "Telugu Dubbed",
      "Malayalam Dubbed",
      "Bengali Dubbed",
      "Marathi Dubbed",
      "English Dubbed"
    ],
    "genres": [
      "Action",
      "Drama",
      "Thriller"
    ],
    "id": "kantara",
    "isClassic": false,
    "isKannada": true,
    "isUpcoming": false,
    "language": "Kannada",
    "match": "98% Match",
    "movieTmdbId": 858485,
    "overview": "Set in the mystical forests of coastal Karnataka, a fierce Kambala buffalo racer named Shiva clashes with a strict forest officer over ancestral tribal land, igniting a war of pride, divine spirits, and the sacred Bhoota Kola ritual.",
    "poster": "https://image.tmdb.org/t/p/w780/jIsKmkxMzdCZ0Ux1GVSnu8m6Na6.jpg",
    "providers": [
      {
        "badge": "Dolby Vision",
        "name": "Netflix"
      },
      {
        "badge": "4K UHD",
        "name": "Prime Video"
      }
    ],
    "rating": "U/A 16+",
    "runtime": "2h 28m",
    "studio": "Hombale Films",
    "subs": [
      "Kannada [Sub]",
      "Hindi [Sub]",
      "Tamil [Sub]",
      "Telugu [Sub]",
      "Malayalam [Sub]",
      "Bengali [Sub]",
      "Marathi [Sub]",
      "Punjabi [Sub]",
      "English [CC]"
    ],
    "title": "Kantara: A Legend",
    "tmdbId": 858485,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://image.tmdb.org/t/p/w185/8sNiAPPYU14PUepFNeSNGUTiHW.jpg",
          "name": "Rishab Shetty",
          "role": "Kaadubettu Shiva"
        },
        {
          "image": "https://image.tmdb.org/t/p/w185/8sNiAPPYU14PUepFNeSNGUTiHW.jpg",
          "name": "Sapthami Gowda",
          "role": "Leela"
        }
      ],
      "song": {
        "artist": "B. Ajaneesh Loknath",
        "title": "Varaha Roopam"
      },
      "trivia": "Rishab Shetty trained rigorously for months in traditional coastal Karnataka Kambala racing to perform all buffalo-racing stunts without body doubles."
    },
    "year": "2022",
    "youtubeId": "8mrVmf239GU"
  },
  {
    "audio": [
      "Kannada Original Atmos",
      "Hindi Dubbed 5.1",
      "Tamil",
      "Telugu",
      "Malayalam"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/3Sdi32wfIIOtDz1hYik6bGe1iWC.jpg",
    "dubs": [
      "Kannada (Original)",
      "Hindi Dubbed",
      "Tamil Dubbed",
      "Telugu Dubbed",
      "Malayalam Dubbed",
      "Bengali Dubbed",
      "Marathi Dubbed",
      "English Dubbed"
    ],
    "genres": [
      "Adventure",
      "Comedy",
      "Drama"
    ],
    "id": "777-charlie",
    "isClassic": false,
    "isKannada": true,
    "isUpcoming": false,
    "language": "Kannada",
    "match": "97% Match",
    "movieTmdbId": 634120,
    "overview": "Dharma lives an isolated, cynical life working in a manufacturing plant until an abandoned, spirited Labrador pup wanders into his home, initiating a life-affirming cross-country Himalayan road journey.",
    "poster": "https://image.tmdb.org/t/p/w780/qArPmXH0aWsT3SEtYl8XrU2Oz48.jpg",
    "providers": [
      {
        "badge": "4K UHD",
        "name": "JioCinema"
      },
      {
        "badge": "Popular",
        "name": "Prime Video"
      }
    ],
    "rating": "U/A 7+",
    "runtime": "2h 44m",
    "studio": "Paramvah Studios",
    "subs": [
      "Kannada [Sub]",
      "Hindi [Sub]",
      "Tamil [Sub]",
      "Telugu [Sub]",
      "Malayalam [Sub]",
      "Bengali [Sub]",
      "Marathi [Sub]",
      "Punjabi [Sub]",
      "English [CC]"
    ],
    "title": "777 Charlie",
    "tmdbId": 634120,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://image.tmdb.org/t/p/w185/8sNiAPPYU14PUepFNeSNGUTiHW.jpg",
          "name": "Rakshit Shetty",
          "role": "Dharma"
        },
        {
          "image": "https://image.tmdb.org/t/p/w185/8sNiAPPYU14PUepFNeSNGUTiHW.jpg",
          "name": "Charlie",
          "role": "Charlie (The Labrador)"
        }
      ],
      "song": {
        "artist": "Nobin Paul",
        "title": "The Journey Song"
      },
      "trivia": "The film took over three years to shoot as the production team worked closely with canine trainers to ensure Charlie's expressions were completely genuine and cruelty-free."
    },
    "year": "2022",
    "youtubeId": "REqFOV2A7sI"
  },
  {
    "audio": [
      "Kannada Original Atmos",
      "Hindi Dubbed 5.1",
      "Telugu Dubbed",
      "Tamil Dubbed",
      "Malayalam",
      "English 5.1"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/mDeUmPe4MF35himOmcuAhNVVoTe.jpg",
    "dubs": [
      "Kannada (Original)",
      "Hindi Dubbed",
      "Tamil Dubbed",
      "Telugu Dubbed",
      "Malayalam Dubbed",
      "Bengali Dubbed",
      "Marathi Dubbed",
      "Punjabi Dubbed",
      "English Dubbed"
    ],
    "genres": [
      "Action",
      "Crime",
      "Period Drama"
    ],
    "id": "toxic",
    "isClassic": false,
    "isKannada": true,
    "isUpcoming": true,
    "language": "Kannada",
    "match": "99% Match",
    "movieTmdbId": 1214484,
    "overview": "Rocking Star Yash stars in an explosive international underworld cartel epic directed by Geetu Mohandas. Filmed across London, Sri Lanka, and coastal India, this high-octane period thriller reimagines cinematic vengeance.",
    "poster": "https://image.tmdb.org/t/p/w780/d5iHeIlagN179F01Pj5qV0xKx7u.jpg",
    "providers": [
      {
        "badge": "Official 4K",
        "name": "KVN Productions"
      },
      {
        "badge": "Post-Theatrical 4K",
        "name": "Prime Video"
      }
    ],
    "rating": "U/A 16+",
    "runtime": "Theatrical 4K Stream",
    "studio": "KVN Productions",
    "subs": [
      "Kannada [Sub]",
      "Hindi [Sub]",
      "Tamil [Sub]",
      "Telugu [Sub]",
      "Malayalam [Sub]",
      "Bengali [Sub]",
      "Marathi [Sub]",
      "Punjabi [Sub]",
      "English [CC]"
    ],
    "theatricalStream": true,
    "title": "Toxic: A Fairy Tale for Grown-ups",
    "tmdbId": 1214484,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://image.tmdb.org/t/p/w185/8sNiAPPYU14PUepFNeSNGUTiHW.jpg",
          "name": "Yash",
          "role": "Raya / Lead Protagonist"
        },
        {
          "image": "https://image.tmdb.org/t/p/w185/8sNiAPPYU14PUepFNeSNGUTiHW.jpg",
          "name": "Kiara Advani",
          "role": "Lead Female"
        },
        {
          "image": "https://image.tmdb.org/t/p/w185/8sNiAPPYU14PUepFNeSNGUTiHW.jpg",
          "name": "Nayanthara",
          "role": "Key Character"
        }
      ],
      "song": {
        "artist": "Jeremy Stack",
        "title": "Toxic Title Theme"
      },
      "trivia": "Toxic marks Rocking Star Yash's monumental return to global cinema following the historic success of KGF: Chapter 2."
    },
    "year": "2025",
    "youtubeId": "0PfErHA3zzQ"
  },
  {
    "audio": [
      "Kannada Original Atmos",
      "Hindi Dubbed 5.1",
      "Tamil 5.1",
      "Telugu 5.1",
      "Malayalam"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/uLtVba9o7jWp8Z2bkh1kHq3J8H7.jpg",
    "dubs": [
      "Kannada (Original)",
      "Hindi Dubbed",
      "Tamil Dubbed",
      "Telugu Dubbed",
      "Malayalam Dubbed",
      "Bengali Dubbed",
      "Marathi Dubbed",
      "Punjabi Dubbed",
      "English Dubbed"
    ],
    "genres": [
      "Action",
      "Drama",
      "Crime"
    ],
    "id": "kgf-1",
    "isClassic": false,
    "isKannada": true,
    "isUpcoming": false,
    "language": "Kannada",
    "match": "99% Match",
    "movieTmdbId": 564147,
    "overview": "In the 1970s, a fierce young man named Rocky journeys from the slums of Bombay to the tyrannical gold mines of Kolar Gold Fields disguised as a slave to assassinate the ruthless oppressor Garuda.",
    "poster": "https://image.tmdb.org/t/p/w780/6x8fK5s6M9dF0m3vN16bC2b2D5v.jpg",
    "providers": [
      {
        "badge": "4K UHD",
        "name": "Prime Video"
      },
      {
        "badge": "Dubbed Hub",
        "name": "Hotstar"
      }
    ],
    "rating": "U/A 16+",
    "runtime": "2h 36m",
    "studio": "Hombale Films",
    "subs": [
      "Kannada [Sub]",
      "Hindi [Sub]",
      "Tamil [Sub]",
      "Telugu [Sub]",
      "Malayalam [Sub]",
      "Bengali [Sub]",
      "Marathi [Sub]",
      "Punjabi [Sub]",
      "English [CC]"
    ],
    "title": "K.G.F: Chapter 1",
    "tmdbId": 564147,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://image.tmdb.org/t/p/w185/8sNiAPPYU14PUepFNeSNGUTiHW.jpg",
          "name": "Yash",
          "role": "Rocky Bhai"
        },
        {
          "image": "https://image.tmdb.org/t/p/w185/8sNiAPPYU14PUepFNeSNGUTiHW.jpg",
          "name": "Srinidhi Shetty",
          "role": "Reena Desai"
        }
      ],
      "song": {
        "artist": "Ravi Basrur",
        "title": "Salaam Rocky Bhai"
      },
      "trivia": "KGF: Chapter 1 was the highest-budget Kannada film ever produced at the time of its release and won two National Film Awards."
    },
    "year": "2018",
    "youtubeId": "qXgF-iJ_ezE"
  },
  {
    "audio": [
      "Kannada Original Atmos",
      "Hindi Dubbed 5.1",
      "Telugu 5.1",
      "Tamil 5.1",
      "Malayalam"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/e9h8Y5t1aK8eK9mY2dF8c7nL4jB.jpg",
    "dubs": [
      "Kannada (Original)",
      "Hindi Dubbed",
      "Tamil Dubbed",
      "Telugu Dubbed",
      "Malayalam Dubbed",
      "Bengali Dubbed",
      "Marathi Dubbed",
      "English Dubbed"
    ],
    "genres": [
      "Action",
      "Thriller",
      "Vigilante"
    ],
    "id": "bagheera",
    "isClassic": false,
    "isKannada": true,
    "isUpcoming": false,
    "language": "Kannada",
    "match": "96% Match",
    "movieTmdbId": 939243,
    "overview": "An upright police officer disillusioned with corruption dons a masked vigilante avatar named Bagheera to hunt down vicious underworld syndicates terrorizing the city.",
    "poster": "https://image.tmdb.org/t/p/w780/a9e8X5k2aL9mK8nZ1eF7c6dL3jB.jpg",
    "providers": [
      {
        "badge": "4K UHD",
        "name": "Netflix"
      },
      {
        "badge": "Official",
        "name": "Hombale Films"
      }
    ],
    "rating": "U/A 16+",
    "runtime": "2h 38m",
    "studio": "Hombale Films",
    "subs": [
      "Kannada [Sub]",
      "Hindi [Sub]",
      "Tamil [Sub]",
      "Telugu [Sub]",
      "Malayalam [Sub]",
      "Bengali [Sub]",
      "Marathi [Sub]",
      "Punjabi [Sub]",
      "English [CC]"
    ],
    "title": "Bagheera",
    "tmdbId": 939243,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://image.tmdb.org/t/p/w185/8sNiAPPYU14PUepFNeSNGUTiHW.jpg",
          "name": "Srii Murali",
          "role": "Vedanth Prabhakar / Bagheera"
        },
        {
          "image": "https://image.tmdb.org/t/p/w185/8sNiAPPYU14PUepFNeSNGUTiHW.jpg",
          "name": "Rukmini Vasanth",
          "role": "Dr. Sneha"
        }
      ],
      "song": {
        "artist": "B. Ajaneesh Loknath",
        "title": "Rudhira Dhaara"
      },
      "trivia": "Story conceived by Prashanth Neel (KGF creator) and produced as a high-octane vigilante spectacle."
    },
    "year": "2024",
    "youtubeId": "CEfYokG1SF8"
  },
  {
    "audio": [
      "Kannada Original Atmos",
      "Hindi Dubbed 5.1",
      "Telugu 5.1",
      "Tamil 5.1"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/f8c7nL4jBe9h8Y5t1aK8eK9mY2d.jpg",
    "dubs": [
      "Kannada (Original)",
      "Hindi Dubbed",
      "Tamil Dubbed",
      "Telugu Dubbed",
      "Malayalam Dubbed",
      "Bengali Dubbed",
      "Marathi Dubbed",
      "English Dubbed"
    ],
    "genres": [
      "Sci-Fi",
      "Surrealist",
      "Satire"
    ],
    "id": "ui-the-movie",
    "isClassic": false,
    "isKannada": true,
    "isUpcoming": true,
    "language": "Kannada",
    "match": "97% Match",
    "movieTmdbId": 1030138,
    "overview": "Real Star Upendra crafts a mind-bending dystopian universe satirizing modern technology, political hypocrisy, and human subconscious desires.",
    "poster": "https://image.tmdb.org/t/p/w780/b9e8X5k2aL9mK8nZ1eF7c6dL3jB.jpg",
    "providers": [
      {
        "badge": "Exclusive 4K",
        "name": "Zee5"
      },
      {
        "badge": "Official",
        "name": "Lahari Films"
      }
    ],
    "rating": "U/A 16+",
    "runtime": "Theatrical 4K Stream",
    "studio": "Lahari Films",
    "subs": [
      "Kannada [Sub]",
      "Hindi [Sub]",
      "Tamil [Sub]",
      "Telugu [Sub]",
      "Malayalam [Sub]",
      "Bengali [Sub]",
      "Marathi [Sub]",
      "Punjabi [Sub]",
      "English [CC]"
    ],
    "theatricalStream": true,
    "title": "UI The Movie",
    "tmdbId": 1030138,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://image.tmdb.org/t/p/w185/8sNiAPPYU14PUepFNeSNGUTiHW.jpg",
          "name": "Upendra",
          "role": "The Creator"
        }
      ],
      "song": {
        "artist": "B. Ajaneesh Loknath",
        "title": "Cheap Song"
      },
      "trivia": "Upendra returned to feature film directing after a 9-year hiatus to bring this groundbreaking conceptual spectacle to life."
    },
    "year": "2024",
    "youtubeId": "_66vljLCmmk"
  },
  {
    "audio": [
      "Kannada Original Atmos",
      "Hindi Dubbed 5.1",
      "Tamil 5.1",
      "Telugu 5.1",
      "Malayalam"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/f4zJ9UPZYrL9mMIzJEhJneP4bM1.jpg",
    "dubs": [
      "Kannada (Original)",
      "Hindi Dubbed",
      "Tamil Dubbed",
      "Telugu Dubbed",
      "Malayalam Dubbed",
      "Bengali Dubbed",
      "Marathi Dubbed",
      "Punjabi Dubbed",
      "English Dubbed"
    ],
    "fullMovieYoutubeId": "vWUl6ZqdrHk",
    "genres": [
      "Action",
      "Drama",
      "Period"
    ],
    "id": "kaatera",
    "isClassic": true,
    "isKannada": true,
    "isUpcoming": false,
    "language": "Kannada",
    "match": "98% Match",
    "movieTmdbId": 1212788,
    "overview": "Set in 1970s rural Karnataka, a valiant blacksmith named Kaatera stands against oppressive feudal landlords to protect landless agrarian farmers under the revolutionary Land Reforms Act.",
    "poster": "https://image.tmdb.org/t/p/w500/iP7pN1Y9OBE2D9unv2Bfwv8c3R1.jpg",
    "providers": [
      {
        "badge": "4K UHD",
        "name": "Zee5"
      },
      {
        "badge": "Stream Now",
        "name": "MOVAni Pass"
      }
    ],
    "rating": "U/A 16+",
    "runtime": "3h 2m",
    "streamUrl": null,
    "studio": "Rockline Entertainments",
    "subs": [
      "Kannada [Sub]",
      "Hindi [Sub]",
      "Tamil [Sub]",
      "Telugu [Sub]",
      "Malayalam [Sub]",
      "Bengali [Sub]",
      "Marathi [Sub]",
      "Punjabi [Sub]",
      "English [CC]"
    ],
    "title": "Kaatera",
    "tmdbId": 1212788,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://image.tmdb.org/t/p/w185/8sNiAPPYU14PUepFNeSNGUTiHW.jpg",
          "name": "Challenging Star Darshan",
          "role": "Kaatera"
        },
        {
          "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
          "name": "Aradhana Ram",
          "role": "Prabhavathi"
        },
        {
          "image": "https://image.tmdb.org/t/p/w185/8sNiAPPYU14PUepFNeSNGUTiHW.jpg",
          "name": "Jagapathi Babu",
          "role": "Devaraya"
        }
      ],
      "song": {
        "artist": "V. Harikrishna",
        "title": "Pasandaagavne"
      },
      "trivia": "Kaatera emerged as one of the highest-grossing Kannada films of 2023, celebrated for authentic 1970s production design and hard-hitting social commentary."
    },
    "year": "2023",
    "youtubeId": "vWUl6ZqdrHk"
  },
  {
    "audio": [
      "Kannada Original 5.1",
      "Kannada Stereo"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/q4H2pfCBdfa8eE256NyEMVQKVtW.jpg",
    "dubs": [
      "Kannada (Original)",
      "Telugu Dubbed"
    ],
    "fullMovieYoutubeId": "r5QWJvWyW7E",
    "genres": [
      "Action",
      "Crime",
      "Drama",
      "Cult Classic"
    ],
    "id": "om-1995",
    "isClassic": true,
    "isKannada": true,
    "isUpcoming": false,
    "language": "Kannada",
    "match": "99% Match",
    "movieTmdbId": 357856,
    "overview": "Satya, the upright son of a revered Hindu priest, is drawn into the brutal underworld of Bangalore after being framed. Upendra's historic cult classic starring Shiva Rajkumar featuring real underworld dons.",
    "poster": "https://image.tmdb.org/t/p/w780/28yfNSdZ7iDgz1x7BMEuw4mXAnf.jpg",
    "providers": [
      {
        "badge": "Official HD",
        "name": "SRS Media Vision"
      },
      {
        "badge": "Golden Classic",
        "name": "MOVAni Pass"
      }
    ],
    "rating": "U/A 16+",
    "runtime": "2h 30m",
    "studio": "Sri Vajreshwari Combines",
    "subs": [
      "Kannada [Sub]",
      "English [CC]"
    ],
    "title": "Om",
    "tmdbId": 357856,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
          "name": "Shiva Rajkumar",
          "role": "Satya"
        },
        {
          "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
          "name": "Prema",
          "role": "Madhuri"
        },
        {
          "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
          "name": "Upendra",
          "role": "Director / Screenplay"
        }
      ],
      "song": {
        "artist": "Dr. Rajkumar",
        "title": "Hey Dinakara"
      },
      "trivia": "Om re-released in Karnataka theaters more than 550 times across 20 years, setting an all-time record in Indian cinema history."
    },
    "year": "1995",
    "youtubeId": "r5QWJvWyW7E"
  },
  {
    "audio": [
      "Kannada Original 5.1",
      "Kannada Stereo"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/55UhYaffRxnLhMOZ1aKTHpMCIcZ.jpg",
    "dubs": [
      "Kannada (Original)"
    ],
    "fullMovieYoutubeId": "bKj3dejY9M8",
    "genres": [
      "Romance",
      "Drama",
      "Musical"
    ],
    "id": "mungaru-male",
    "isClassic": true,
    "isKannada": true,
    "isUpcoming": false,
    "language": "Kannada",
    "match": "99% Match",
    "movieTmdbId": 39095,
    "overview": "Preetham falls deeply in love with Nandini during the torrential monsoon in the scenic hills of Sakleshpur. A landmark romantic blockbuster in Kannada cinema directed by Yogaraj Bhat and scored by Mano Murthy.",
    "poster": "https://image.tmdb.org/t/p/w780/gFXxeSL3fSmb3G2jmhx4kTFRpYd.jpg",
    "providers": [
      {
        "badge": "Official 1080p",
        "name": "Anand Audio"
      },
      {
        "badge": "Evergreen Hit",
        "name": "MOVAni Pass"
      }
    ],
    "rating": "U/A",
    "runtime": "2h 25m",
    "studio": "E. K. Entertainers",
    "subs": [
      "Kannada [Sub]",
      "English [CC]"
    ],
    "title": "Mungaru Male",
    "tmdbId": 39095,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
          "name": "Ganesh",
          "role": "Preetham"
        },
        {
          "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
          "name": "Pooja Gandhi",
          "role": "Nandini"
        },
        {
          "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
          "name": "Anant Nag",
          "role": "Col. Subbayya"
        }
      ],
      "song": {
        "artist": "Sonu Nigam",
        "title": "Anisuthide Yaako Indu"
      },
      "trivia": "Mungaru Male was the first film in South Indian history to run for one continuous year in a multiplex, transforming modern Kannada cinema."
    },
    "year": "2006",
    "youtubeId": "bKj3dejY9M8"
  },
  {
    "audio": [
      "Kannada Original 5.1",
      "Hindi Dubbed"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/dIyyXVDBSNQAqz9UEaio1DFaJEW.jpg",
    "dubs": [
      "Kannada (Original)",
      "Hindi Dubbed"
    ],
    "genres": [
      "Psychological Thriller",
      "Sci-Fi",
      "Drama"
    ],
    "id": "lucia",
    "isClassic": false,
    "isKannada": true,
    "isUpcoming": false,
    "language": "Kannada",
    "match": "98% Match",
    "movieTmdbId": 219343,
    "overview": "An usher suffering from insomnia is given a mysterious pill called Lucia that allows him to experience a parallel life of fame in his dreams, blurring reality and illusion. Directed by Pawan Kumar.",
    "poster": "https://image.tmdb.org/t/p/w780/1b0pkG5fKRXbgxQrk3AVwXSNo7e.jpg",
    "providers": [
      {
        "badge": "Crowdfunded Hit",
        "name": "Home Talkies"
      },
      {
        "badge": "Masterpiece",
        "name": "MOVAni Pass"
      }
    ],
    "rating": "U/A 16+",
    "runtime": "2h 15m",
    "studio": "Audience Films",
    "subs": [
      "Kannada [Sub]",
      "English [CC]"
    ],
    "title": "Lucia",
    "tmdbId": 219343,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
          "name": "Sathish Ninasam",
          "role": "Nikki / Nikhil"
        },
        {
          "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
          "name": "Sruthi Hariharan",
          "role": "Shwetha"
        }
      ],
      "song": {
        "artist": "Poornachandra Tejaswi",
        "title": "Thinbedakammi"
      },
      "trivia": "Lucia won the Audience Award at the London Indian Film Festival and was India's first successful crowd-funded feature film."
    },
    "year": "2013",
    "youtubeId": "pgIL2H-OdcA"
  },
  {
    "audio": [
      "Kannada (Original)"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/f9no50dL0bP3vPEjY3ZFoKoGp4p.jpg",
    "dubs": [
      "Kannada (Original)"
    ],
    "fullMovieYoutubeId": "d9Uob8YsvmE",
    "genres": [
      "Drama",
      "Classic",
      "Tragedy"
    ],
    "id": "kasturi-nivasa",
    "isClassic": true,
    "isKannada": true,
    "isUpcoming": false,
    "language": "Kannada",
    "match": "99% Match",
    "movieTmdbId": 609343,
    "overview": "Ravi, a benevolent and wealthy owner of a match factory, loses everything due to his boundless generosity and selfless principles. An all-time emotional masterpiece and tour de force by Dr. Rajkumar.",
    "poster": "https://image.tmdb.org/t/p/w780/qB4eCTyKwVVsXBmWEvEbELSfarj.jpg",
    "providers": [
      {
        "badge": "Restored HD",
        "name": "SRS Media Vision"
      },
      {
        "badge": "Immortal Classic",
        "name": "MOVAni Pass"
      }
    ],
    "rating": "U",
    "runtime": "2h 35m",
    "studio": "Anupam Movies",
    "subs": [
      "Kannada [Sub]",
      "English [CC]"
    ],
    "title": "Kasturi Nivasa",
    "tmdbId": 609343,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
          "name": "Dr. Rajkumar",
          "role": "Ravi Varma"
        },
        {
          "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
          "name": "Jayanthi",
          "role": "Meena"
        },
        {
          "image": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80",
          "name": "Aarathi",
          "role": "Neela"
        }
      ],
      "song": {
        "artist": "P. B. Sreenivas",
        "title": "Aadisi Nodi Beelisi Nodi"
      },
      "trivia": "Kasturi Nivasa was digitally restored and colorized in 2014, playing to packed theaters 43 years after its initial premiere."
    },
    "year": "1971",
    "youtubeId": "d9Uob8YsvmE"
  },
  {
    "audio": [
      "Kannada (Original)"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/4DatYe44BrXulwsJ8FV54JYt9iN.jpg",
    "dubs": [
      "Kannada (Original)"
    ],
    "fullMovieYoutubeId": "SWinaasgRdc",
    "genres": [
      "Mythology",
      "Action",
      "Epic",
      "Classic"
    ],
    "id": "babruvahana",
    "isClassic": true,
    "isKannada": true,
    "isUpcoming": false,
    "language": "Kannada",
    "match": "99% Match",
    "movieTmdbId": 235430,
    "overview": "Babruvahana, the valorous son of warrior Arjuna and Princess Chitrangada, challenges his own father when the sacrificial horse enters his kingdom. Celebrated for legendary dialogues and Dr. Rajkumar's dual role.",
    "poster": "https://image.tmdb.org/t/p/w780/eCzpIbZEfM9N7e9mY4nfIWU8LFV.jpg",
    "providers": [
      {
        "badge": "Official 1080p",
        "name": "SRS Media Vision"
      },
      {
        "badge": "Golden Classic",
        "name": "MOVAni Pass"
      }
    ],
    "rating": "U",
    "runtime": "2h 40m",
    "studio": "Rajkumar Productions",
    "subs": [
      "Kannada [Sub]",
      "English [CC]"
    ],
    "title": "Babruvahana",
    "tmdbId": 235430,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
          "name": "Dr. Rajkumar",
          "role": "Babruvahana & Arjuna (Dual Role)"
        },
        {
          "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
          "name": "B. Saroja Devi",
          "role": "Chitrangada"
        },
        {
          "image": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80",
          "name": "Kanchana",
          "role": "Uloopi"
        }
      ],
      "song": {
        "artist": "Dr. Rajkumar",
        "title": "Yaru Thiliyaru Ninna Bhujabala Mahime"
      },
      "trivia": "Dr. Rajkumar's thunderous Sanskritized dialogue delivery in the climactic confrontation scene remains an unmatched acting benchmark."
    },
    "year": "1977",
    "youtubeId": "SWinaasgRdc"
  },
  {
    "audio": [
      "Kannada (Original 5.1)",
      "Telugu Dubbed"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/gUVzhg2QgOhWHiaFbkxVHfgco7g.jpg",
    "dubs": [
      "Kannada (Original)",
      "Telugu Dubbed"
    ],
    "fullMovieYoutubeId": "gPrCnoLQiPQ",
    "genres": [
      "Psychological",
      "Drama",
      "Satire",
      "Cult Classic"
    ],
    "id": "upendra-1999",
    "isClassic": true,
    "isKannada": true,
    "isUpcoming": false,
    "language": "Kannada",
    "match": "98% Match",
    "movieTmdbId": 286110,
    "overview": "Naanu, an egotistical man driven by extreme philosophical self-obsession, navigates three unconventional relationships representing intellect, tradition, and carnal desire. Upendra's psychological magnum opus.",
    "poster": "https://image.tmdb.org/t/p/w780/1ZINEcYPJp8XOlsw2emyFuKgEOb.jpg",
    "providers": [
      {
        "badge": "Official HD",
        "name": "SRS Media Vision"
      },
      {
        "badge": "Cult Hit",
        "name": "MOVAni Pass"
      }
    ],
    "rating": "A",
    "runtime": "2h 30m",
    "studio": "Silver Screen Pictures",
    "subs": [
      "Kannada [Sub]",
      "English [CC]"
    ],
    "title": "Upendra",
    "tmdbId": 286110,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
          "name": "Upendra",
          "role": "Naanu / Director"
        },
        {
          "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
          "name": "Raveena Tandon",
          "role": "Keerthi"
        },
        {
          "image": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80",
          "name": "Prema",
          "role": "Swathi"
        }
      ],
      "song": {
        "artist": "Gurukiran",
        "title": "Uppiginta Ruchi Bere Illa"
      },
      "trivia": "Upendra won the Filmfare Award for Best Film and Best Director; its non-linear editing redefined South Indian avant-garde storytelling."
    },
    "year": "1999",
    "youtubeId": "gPrCnoLQiPQ"
  },
  {
    "audio": [
      "Kannada Original 5.1",
      "Telugu Dubbed"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/mXdxoXvtoOxQ3mnzbzuvpGuJ8cW.jpg",
    "dubs": [
      "Kannada (Original)",
      "Telugu Dubbed"
    ],
    "genres": [
      "Comedy",
      "Drama",
      "Campus Romance"
    ],
    "id": "kirik-party",
    "isClassic": false,
    "isKannada": true,
    "isUpcoming": false,
    "language": "Kannada",
    "match": "99% Match",
    "movieTmdbId": 433327,
    "overview": "Karna and his gang of mischievous mechanical engineering students navigate campus rivalries, heartfelt first love, and emotional maturity. Directed by Rishab Shetty and starring Rakshit Shetty.",
    "poster": "https://image.tmdb.org/t/p/w780/16gpI8K51r2FzZ9wE0VXmrG5v9c.jpg",
    "providers": [
      {
        "badge": "4K UHD",
        "name": "Paramvah Studios"
      },
      {
        "badge": "Modern Classic",
        "name": "MOVAni Pass"
      }
    ],
    "rating": "U/A",
    "runtime": "2h 45m",
    "studio": "Paramvah Studios",
    "subs": [
      "Kannada [Sub]",
      "English [CC]"
    ],
    "title": "Kirik Party",
    "tmdbId": 433327,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
          "name": "Rakshit Shetty",
          "role": "Karna"
        },
        {
          "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
          "name": "Rashmika Mandanna",
          "role": "Saanvi Joseph"
        },
        {
          "image": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80",
          "name": "Samyuktha Hegde",
          "role": "Aarya"
        }
      ],
      "song": {
        "artist": "Vijay Prakash",
        "title": "Belageddu"
      },
      "trivia": "Kirik Party was one of the highest grossing Kannada films of all time and marked Rashmika Mandanna's sensational silver-screen debut."
    },
    "year": "2016",
    "youtubeId": "IfvnbER_6sQ"
  },
  {
    "audio": [
      "Kannada (Original 5.1)"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/gEdMkJTxYJNhV7OBO65FHyI9KgO.jpg",
    "dubs": [
      "Kannada (Original)"
    ],
    "genres": [
      "Neo-Noir",
      "Crime",
      "Anthology",
      "Cult Classic"
    ],
    "id": "ulidavaru-kandanthe",
    "isClassic": false,
    "isKannada": true,
    "isUpcoming": false,
    "language": "Kannada",
    "match": "98% Match",
    "movieTmdbId": 262476,
    "overview": "A journalist investigates an incident during Krishna Janmashtami in coastal Malpe, recounting the mystery through five distinct perspectives. Cult neo-noir directed by Rakshit Shetty.",
    "poster": "https://image.tmdb.org/t/p/w780/b7Ee4DKKhNVYNV84rovdqcWXjgt.jpg",
    "providers": [
      {
        "badge": "Official HD",
        "name": "SRS Media Vision"
      },
      {
        "badge": "Cult Noir",
        "name": "MOVAni Pass"
      }
    ],
    "rating": "U/A",
    "runtime": "2h 34m",
    "studio": "Suvin Cinema",
    "subs": [
      "Kannada [Sub]",
      "English [CC]"
    ],
    "title": "Ulidavaru Kandanthe",
    "tmdbId": 262476,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
          "name": "Rakshit Shetty",
          "role": "Richie"
        },
        {
          "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
          "name": "Kishore",
          "role": "Munna"
        },
        {
          "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
          "name": "Tara",
          "role": "Ratnakka"
        }
      ],
      "song": {
        "artist": "Vijay Prakash",
        "title": "Gatiya Ilidu"
      },
      "trivia": "Rakshit Shetty's character 'Richie' became an iconic cultural archetype across Karnataka cinema and inspired the hit Tamil remake Richie."
    },
    "year": "2014",
    "youtubeId": "POJ_6EtGeMw"
  },
  {
    "audio": [
      "Kannada (Original 5.1)",
      "Hindi Dubbed"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/2RHKfO5oDU9PXOj2amTeAuu1vdE.jpg",
    "dubs": [
      "Kannada (Original)",
      "Hindi Dubbed"
    ],
    "genres": [
      "Action",
      "Thriller",
      "Crime",
      "Blockbuster"
    ],
    "id": "ugramm",
    "isClassic": false,
    "isKannada": true,
    "isUpcoming": false,
    "language": "Kannada",
    "match": "99% Match",
    "movieTmdbId": 385152,
    "overview": "Agastya, a lethal mechanic living in seclusion, protects an innocent NRI woman named Nithya from deadly underworld syndicates. Directed by Prashanth Neel and starring Sriimurali.",
    "poster": "https://image.tmdb.org/t/p/w780/6AdrI68ggKpSBRE2EbnvajeD53q.jpg",
    "providers": [
      {
        "badge": "Official 1080p",
        "name": "Anand Audio"
      },
      {
        "badge": "Action Milestone",
        "name": "MOVAni Pass"
      }
    ],
    "rating": "U/A 16+",
    "runtime": "2h 30m",
    "studio": "Inkfinite Pictures",
    "subs": [
      "Kannada [Sub]",
      "English [CC]"
    ],
    "title": "Ugramm",
    "tmdbId": 385152,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
          "name": "Sriimurali",
          "role": "Agastya"
        },
        {
          "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
          "name": "Hariprriya",
          "role": "Nithya"
        }
      ],
      "song": {
        "artist": "Ravi Basrur",
        "title": "Chitte Gudu"
      },
      "trivia": "Ugramm marked Prashanth Neel's directorial debut and established his signature high-contrast dark visual aesthetic that later powered KGF."
    },
    "year": "2014",
    "youtubeId": "f7XQSsZLjmo"
  },
  {
    "audio": [
      "Kannada (Original)"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/puWIBNZt7ZyXPWSbUvoDxL5m3D9.jpg",
    "dubs": [
      "Kannada (Original)"
    ],
    "fullMovieYoutubeId": "ppTSIGU-xAI",
    "genres": [
      "Historical Epic",
      "Action",
      "Drama",
      "Classic"
    ],
    "id": "mayura-1975",
    "isClassic": true,
    "isKannada": true,
    "isUpcoming": false,
    "language": "Kannada",
    "match": "99% Match",
    "movieTmdbId": 235434,
    "overview": "A courageous young scholar discovers his royal lineage and leads the battle for Kannadiga sovereignty against the Pallavas, founding the ancient Kadamba Empire. Dr. Rajkumar's historic magnum opus.",
    "poster": "https://image.tmdb.org/t/p/w780/wHO73V1C2h3HmEGjqTG1Pqvi2AK.jpg",
    "providers": [
      {
        "badge": "Restored HD",
        "name": "SRS Media Vision"
      },
      {
        "badge": "Historical Jewel",
        "name": "MOVAni Pass"
      }
    ],
    "rating": "U",
    "runtime": "2h 40m",
    "studio": "Sri Raghavendra Productions",
    "subs": [
      "Kannada [Sub]",
      "English [CC]"
    ],
    "title": "Mayura",
    "tmdbId": 235434,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
          "name": "Dr. Rajkumar",
          "role": "Mayurasharma / Mayuravarma"
        },
        {
          "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
          "name": "Srinath",
          "role": "Vishnugopa"
        },
        {
          "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
          "name": "Manjula",
          "role": "Premavathi"
        }
      ],
      "song": {
        "artist": "Dr. Rajkumar",
        "title": "Naniruvude Nimagagi"
      },
      "trivia": "Filmed in the historic monuments of Mysore Palace and Talkad, Mayura remains one of the greatest historical action dramas ever produced in India."
    },
    "year": "1975",
    "youtubeId": "ppTSIGU-xAI"
  },
  {
    "audio": [
      "Kannada (Original 5.1)"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/eJnLlH11bFzTILVHZPCpRQmL6Nr.jpg",
    "dubs": [
      "Kannada (Original)"
    ],
    "fullMovieYoutubeId": "s1LqXWHpCb0",
    "genres": [
      "Romance",
      "Drama",
      "Family"
    ],
    "id": "milana-2007",
    "isClassic": true,
    "isKannada": true,
    "isUpcoming": false,
    "language": "Kannada",
    "match": "98% Match",
    "movieTmdbId": 521400,
    "overview": "A warm-hearted young man agrees to a formal divorce with his wife who loves another man, only for their journey in Bangalore to reveal profound understanding and unconditional affection. Starring Puneeth Rajkumar.",
    "poster": "https://image.tmdb.org/t/p/w780/gw6sfKGRG6vy9OcZDu5HgBUP81o.jpg",
    "providers": [
      {
        "badge": "Official 1080p",
        "name": "Anand Audio"
      },
      {
        "badge": "Golden Hit",
        "name": "MOVAni Pass"
      }
    ],
    "rating": "U",
    "runtime": "2h 30m",
    "studio": "Nam Cinema",
    "subs": [
      "Kannada [Sub]",
      "English [CC]"
    ],
    "title": "Milana",
    "tmdbId": 521400,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
          "name": "Puneeth Rajkumar",
          "role": "Aakash"
        },
        {
          "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
          "name": "Parvathy Thiruvothu",
          "role": "Anjali"
        },
        {
          "image": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80",
          "name": "Pooja Gandhi",
          "role": "Priya"
        }
      ],
      "song": {
        "artist": "Sonu Nigam",
        "title": "Ninnindale Ninnindale"
      },
      "trivia": "Milana ran for over 500 days in multiple cities and earned Puneeth Rajkumar the Karnataka State Film Award for Best Actor."
    },
    "year": "2007",
    "youtubeId": "s1LqXWHpCb0"
  },
  {
    "audio": [
      "Kannada (Original 5.1)"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/oYvkY8TGkhOuGfZMVlaTtcyB2gp.jpg",
    "dubs": [
      "Kannada (Original)"
    ],
    "fullMovieYoutubeId": "ktZYko6qZOY",
    "genres": [
      "Action",
      "Drama",
      "Sentiment"
    ],
    "id": "jogi-2005",
    "isClassic": true,
    "isKannada": true,
    "isUpcoming": false,
    "language": "Kannada",
    "match": "99% Match",
    "movieTmdbId": 673257,
    "overview": "Madesha travels from his village to Bangalore to earn money for his ailing parents, but circumstances drag him into becoming the city's fiercest underworld kingpin while his mother searches for him.",
    "poster": "https://image.tmdb.org/t/p/w780/kpCO9LMHYQ0aOb0B3yVS1B364Xg.jpg",
    "providers": [
      {
        "badge": "Official HD",
        "name": "SRS Media Vision"
      },
      {
        "badge": "Blockbuster",
        "name": "MOVAni Pass"
      }
    ],
    "rating": "U/A 16+",
    "runtime": "2h 35m",
    "studio": "Ashwini Recording",
    "subs": [
      "Kannada [Sub]",
      "English [CC]"
    ],
    "title": "Jogi",
    "tmdbId": 673257,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
          "name": "Shiva Rajkumar",
          "role": "Madesha / Jogi"
        },
        {
          "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
          "name": "Arundhati Nag",
          "role": "Bhagyakka (Mother)"
        },
        {
          "image": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80",
          "name": "Jennifer Kotwal",
          "role": "Niveditha"
        }
      ],
      "song": {
        "artist": "Gurukiran",
        "title": "Bedodu Billa Kodo Kaila"
      },
      "trivia": "Jogi created all-time box-office frenzy across Karnataka with continuous 24-hour screenings and iconic mother-son emotional depth."
    },
    "year": "2005",
    "youtubeId": "ktZYko6qZOY"
  },
  {
    "audio": [
      "Kannada (Original 5.1)"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/d5ZZnunnHl10eGS429SycZ8B88G.jpg",
    "dubs": [
      "Kannada (Original)"
    ],
    "genres": [
      "Mystery",
      "Thriller",
      "Folklore"
    ],
    "id": "rangitaranga-2015",
    "isClassic": false,
    "isKannada": true,
    "isUpcoming": false,
    "language": "Kannada",
    "match": "98% Match",
    "movieTmdbId": 354667,
    "overview": "Goutham, an enigmatic novelist, and his wife travel to an isolated village in coastal Karnataka to perform an ancestral ritual, uncovering a labyrinth of supernatural folklore and mysterious disappearances.",
    "poster": "https://image.tmdb.org/t/p/w780/bcuEuE3k0cIYD1t7HAgNLypfagx.jpg",
    "providers": [
      {
        "badge": "Official HD",
        "name": "SRS Media Vision"
      },
      {
        "badge": "Coastal Mystery",
        "name": "MOVAni Pass"
      }
    ],
    "rating": "U/A",
    "runtime": "2h 29m",
    "studio": "Shree Devi Entertainers",
    "subs": [
      "Kannada [Sub]",
      "English [CC]"
    ],
    "title": "RangiTaranga",
    "tmdbId": 354667,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
          "name": "Nirup Bhandari",
          "role": "Goutham / Anashku"
        },
        {
          "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
          "name": "Radhika Narayan",
          "role": "Indu"
        },
        {
          "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
          "name": "Sai Kumar",
          "role": "Kalinga"
        }
      ],
      "song": {
        "artist": "Anup Bhandari",
        "title": "Akka Pakka"
      },
      "trivia": "RangiTaranga was shortlisted for the 88th Academy Awards in the Best Picture contention category and became an international indie sensation."
    },
    "year": "2015",
    "youtubeId": "L8wWqg2oYiQ"
  },
  {
    "audio": [
      "Hindi Original (Dolby Audio)",
      "Kannada Dubbed",
      "Tamil",
      "Telugu"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/mUAvhPWY4r7O32txXa7VvzKMrhJ.jpg",
    "dubs": [
      "Hindi (Original)",
      "Kannada Dubbed",
      "Tamil Dubbed",
      "Telugu Dubbed",
      "English Dubbed"
    ],
    "fullMovieYoutubeId": "RDY97iu1_q8",
    "genres": [
      "Action",
      "Adventure",
      "Western",
      "All-Time Classic"
    ],
    "id": "sholay-1975",
    "isClassic": true,
    "language": "Hindi",
    "match": "100% Match",
    "overview": "Former police officer Thakur Baldev Singh hires two charismatic ex-convicts, Veeru and Jai, to capture the sadistic dacoit Gabbar Singh who slaughtered his entire family. Widely considered India's greatest cinematic epic.",
    "poster": "https://image.tmdb.org/t/p/w780/ya9bwgqA4eNl5bQ9QqS0jcmRoBS.jpg",
    "providers": [
      {
        "badge": "Restored 4K",
        "name": "Shemaroo Movies"
      },
      {
        "badge": "All-Time #1",
        "name": "MOVAni Pass"
      }
    ],
    "rating": "U/A",
    "runtime": "3h 24m",
    "studio": "Sippy Films",
    "subs": [
      "Hindi [Sub]",
      "Kannada [Sub]",
      "English [CC]"
    ],
    "title": "Sholay",
    "tmdbId": 12259,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
          "name": "Amitabh Bachchan",
          "role": "Jai"
        },
        {
          "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
          "name": "Dharmendra",
          "role": "Veeru"
        },
        {
          "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
          "name": "Amjad Khan",
          "role": "Gabbar Singh"
        },
        {
          "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
          "name": "Hema Malini",
          "role": "Basanti"
        }
      ],
      "song": {
        "artist": "Kishore Kumar & Manna Dey",
        "title": "Yeh Dosti Hum Nahi Todenge"
      },
      "trivia": "Sholay ran continuously for over five years at Mumbai's Minerva theatre and was named the 'Film of the Millennium' by BBC India."
    },
    "year": "1975",
    "youtubeId": "RDY97iu1_q8"
  },
  {
    "audio": [
      "Hindi 5.1 Original",
      "Kannada Dubbed",
      "Tamil",
      "Telugu"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/u7kuUaySqXBVAtqEl9vkTkAzHV9.jpg",
    "dubs": [
      "Hindi (Original)",
      "Kannada Dubbed",
      "Tamil Dubbed",
      "Telugu Dubbed",
      "English Dubbed"
    ],
    "fullMovieYoutubeId": "22zjP29xZGM",
    "genres": [
      "Comedy",
      "Drama",
      "Inspirational"
    ],
    "id": "3-idiots",
    "isClassic": true,
    "language": "Hindi",
    "match": "100% Match",
    "overview": "Two friends search for their long-lost companion Rancho while recounting their exhilarating college days at an elite engineering institution and his rebellious philosophy of pursuing excellence over success.",
    "poster": "https://image.tmdb.org/t/p/w780/66A9MqXOyVFCssoloscw79z8Tew.jpg",
    "providers": [
      {
        "badge": "Official 4K",
        "name": "Vinod Chopra Films"
      },
      {
        "badge": "Masterpiece",
        "name": "MOVAni Pass"
      }
    ],
    "rating": "U/A",
    "runtime": "2h 51m",
    "studio": "Vinod Chopra Films",
    "subs": [
      "Hindi [Sub]",
      "Kannada [Sub]",
      "English [CC]"
    ],
    "title": "3 Idiots",
    "tmdbId": 20453,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
          "name": "Aamir Khan",
          "role": "Ranchhoddas Chanchad (Rancho)"
        },
        {
          "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
          "name": "R. Madhavan",
          "role": "Farhan Qureshi"
        },
        {
          "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
          "name": "Sharman Joshi",
          "role": "Raju Rastogi"
        },
        {
          "image": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&q=80",
          "name": "Boman Irani",
          "role": "Dr. Viru Sahastrabuddhe (Virus)"
        }
      ],
      "song": {
        "artist": "Sonu Nigam & Swanand Kirkire",
        "title": "All Izz Well"
      },
      "trivia": "3 Idiots became an unprecedented cultural phenomenon across Asia, grossing over $90 million worldwide and winning the Japan Academy Film Prize."
    },
    "year": "2009",
    "youtubeId": "22zjP29xZGM"
  },
  {
    "audio": [
      "Hindi Original 5.1",
      "Kannada Dubbed"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/7VDLEHli74eLsYLNcq9djn1Gw76.jpg",
    "dubs": [
      "Hindi (Original)",
      "Kannada Dubbed"
    ],
    "fullMovieYoutubeId": "oIZ4U21DRlM",
    "genres": [
      "Romance",
      "Drama",
      "Musical",
      "Evergreen"
    ],
    "id": "ddlj-1995",
    "isClassic": true,
    "language": "Hindi",
    "match": "99% Match",
    "overview": "Raj and Simran meet and fall in love on a Eurail train journey through Europe. Back in India, Raj must overcome family tradition and win the respect of her strict father to claim her hand.",
    "poster": "https://image.tmdb.org/t/p/w780/lfRkUr7DYdHldAqi3PwdQGBRBPM.jpg",
    "providers": [
      {
        "badge": "Official 4K",
        "name": "Yash Raj Films"
      },
      {
        "badge": "Evergreen Romance",
        "name": "MOVAni Pass"
      }
    ],
    "rating": "U",
    "runtime": "3h 09m",
    "studio": "Yash Raj Films",
    "subs": [
      "Hindi [Sub]",
      "English [CC]"
    ],
    "title": "Dilwale Dulhania Le Jayenge",
    "tmdbId": 19404,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
          "name": "Shah Rukh Khan",
          "role": "Raj Malhotra"
        },
        {
          "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
          "name": "Kajol",
          "role": "Simran Singh"
        },
        {
          "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
          "name": "Amrish Puri",
          "role": "Chaudhary Baldev Singh"
        }
      ],
      "song": {
        "artist": "Kumar Sanu & Lata Mangeshkar",
        "title": "Tujhe Dekha Toh Yeh Jaana Sanam"
      },
      "trivia": "DDLJ is the longest-running film in Indian cinema history, screened continuously at the Maratha Mandir theatre in Mumbai for over 28 years."
    },
    "year": "1995",
    "youtubeId": "oIZ4U21DRlM"
  },
  {
    "audio": [
      "Hindi 5.1 Original",
      "Kannada Dubbed"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/AkfqKaD1KqfIqytxLvWlyKJRlEi.jpg",
    "dubs": [
      "Hindi (Original)",
      "Kannada Dubbed"
    ],
    "fullMovieYoutubeId": "TIQ5hrfermg",
    "genres": [
      "Comedy",
      "Crime",
      "Cult Classic"
    ],
    "id": "hera-pheri-2000",
    "isClassic": true,
    "language": "Hindi",
    "match": "100% Match",
    "overview": "Baburao Ganpatrao Apte and his two desperate tenants Raju and Shyam receive a ransom telephone call meant for a wealthy industrialist, hatching an uproarious kidnapping scheme.",
    "poster": "https://image.tmdb.org/t/p/w780/23MKGUPT5laTStim4TaGhfgSltu.jpg",
    "providers": [
      {
        "badge": "Official HD",
        "name": "Goldmines Bollywood"
      },
      {
        "badge": "Comedy Gold",
        "name": "MOVAni Pass"
      }
    ],
    "rating": "U",
    "runtime": "2h 36m",
    "studio": "A.G. Films",
    "subs": [
      "Hindi [Sub]",
      "English [CC]"
    ],
    "title": "Hera Pheri",
    "tmdbId": 21614,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
          "name": "Paresh Rawal",
          "role": "Baburao Ganpatrao Apte (Babu Bhaiya)"
        },
        {
          "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
          "name": "Akshay Kumar",
          "role": "Raju"
        },
        {
          "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
          "name": "Suniel Shetty",
          "role": "Ghanshyam (Shyam)"
        }
      ],
      "song": {
        "artist": "Abhijeet",
        "title": "Den Den Na"
      },
      "trivia": "Paresh Rawal's performance as Babu Bhaiya won every major Indian comedy award and birthed the most celebrated meme culture in modern internet history."
    },
    "year": "2000",
    "youtubeId": "TIQ5hrfermg"
  },
  {
    "audio": [
      "Hindi 5.1 Original"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/8YboYnoujBeWv4Galqnb7I0h9jf.jpg",
    "dubs": [
      "Hindi (Original)"
    ],
    "fullMovieYoutubeId": "PAh2HWNFSR4",
    "genres": [
      "Comedy",
      "Action",
      "Cult Classic"
    ],
    "id": "andaz-apna-apna",
    "isClassic": true,
    "language": "Hindi",
    "match": "99% Match",
    "overview": "Two daydreamers, Amar and Prem, compete to woo the daughter of a wealthy millionaire, only to become entangled with the comedic extortionist Crime Master Gogo and criminal twin Teja.",
    "poster": "https://image.tmdb.org/t/p/w780/a0GV2V3yif2DbsMCSBrivvSHUWQ.jpg",
    "providers": [
      {
        "badge": "Official 1080p",
        "name": "Shemaroo Movies"
      },
      {
        "badge": "Cult Comedy",
        "name": "MOVAni Pass"
      }
    ],
    "rating": "U",
    "runtime": "2h 40m",
    "studio": "Vinay Pictures",
    "subs": [
      "Hindi [Sub]",
      "English [CC]"
    ],
    "title": "Andaz Apna Apna",
    "tmdbId": 58128,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
          "name": "Aamir Khan",
          "role": "Amar Manohar"
        },
        {
          "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
          "name": "Salman Khan",
          "role": "Prem Bhopali"
        },
        {
          "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
          "name": "Shakti Kapoor",
          "role": "Crime Master Gogo"
        },
        {
          "image": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&q=80",
          "name": "Paresh Rawal",
          "role": "Ram Gopal Bajaj / Teja"
        }
      ],
      "song": {
        "artist": "S. P. Balasubrahmanyam & Debashish Dasgupta",
        "title": "Do Mastane Chale"
      },
      "trivia": "Despite being an underdog upon release, the film achieved monumental cult status on television and home video as one of Hindi cinema's funniest scripts."
    },
    "year": "1994",
    "youtubeId": "PAh2HWNFSR4"
  },
  {
    "audio": [
      "Hindi Original 5.1",
      "Kannada Dubbed"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/76VwduxQMkVXOUktps85dE0lLeP.jpg",
    "dubs": [
      "Hindi (Original)",
      "Kannada Dubbed",
      "English Dubbed"
    ],
    "fullMovieYoutubeId": "DdvCM9e1vkg",
    "genres": [
      "Period Drama",
      "Sports",
      "Epic",
      "Academy Award Nominee"
    ],
    "id": "lagaan-2001",
    "isClassic": true,
    "language": "Hindi",
    "match": "99% Match",
    "overview": "In Victorian India, the residents of a drought-stricken village wager their future on an impossible game of cricket against their British rulers to cancel an oppressive agricultural tax.",
    "poster": "https://image.tmdb.org/t/p/w780/yNX9lFRAFeNLNRIXdqZK9gYrYKa.jpg",
    "providers": [
      {
        "badge": "Official 4K",
        "name": "Aamir Khan Productions"
      },
      {
        "badge": "Oscar Nominee",
        "name": "MOVAni Pass"
      }
    ],
    "rating": "U",
    "runtime": "3h 44m",
    "studio": "Aamir Khan Productions",
    "subs": [
      "Hindi [Sub]",
      "English [CC]"
    ],
    "title": "Lagaan: Once Upon a Time in India",
    "tmdbId": 19666,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
          "name": "Aamir Khan",
          "role": "Bhuvan"
        },
        {
          "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
          "name": "Gracy Singh",
          "role": "Gauri"
        },
        {
          "image": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80",
          "name": "Rachel Shelley",
          "role": "Elizabeth Russell"
        }
      ],
      "song": {
        "artist": "Udit Narayan, Alka Yagnik & Sukhwinder Singh",
        "title": "Mitwa"
      },
      "trivia": "Lagaan was the third Indian film nominated for the Academy Award for Best Foreign Language Film after Mother India and Salaam Bombay!."
    },
    "year": "2001",
    "youtubeId": "DdvCM9e1vkg"
  },
  {
    "audio": [
      "Hindi 5.1 Original",
      "Kannada Dubbed"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/bPwdy3zaNnMdZ22u0WCcYu0xxgt.jpg",
    "dubs": [
      "Hindi (Original)",
      "Kannada Dubbed"
    ],
    "fullMovieYoutubeId": "p2JChobU4Ek",
    "genres": [
      "Drama",
      "Family",
      "Inspirational"
    ],
    "id": "taare-zameen-par",
    "isClassic": true,
    "language": "Hindi",
    "match": "99% Match",
    "overview": "An eight-year-old imaginative boy named Ishaan who struggles with dyslexia is sent to boarding school by his frustrated parents, until a compassionate art teacher helps him discover his true gift.",
    "poster": "https://image.tmdb.org/t/p/w780/puHRt6Raovm5ujGCdwLWvRv4NHU.jpg",
    "providers": [
      {
        "badge": "Official 1080p",
        "name": "Aamir Khan Productions"
      },
      {
        "badge": "Heartwarming",
        "name": "MOVAni Pass"
      }
    ],
    "rating": "U",
    "runtime": "2h 45m",
    "studio": "Aamir Khan Productions",
    "subs": [
      "Hindi [Sub]",
      "English [CC]"
    ],
    "title": "Taare Zameen Par",
    "tmdbId": 7508,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
          "name": "Darsheel Safary",
          "role": "Ishaan Nandkishore Awasthi"
        },
        {
          "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
          "name": "Aamir Khan",
          "role": "Ram Shankar Nikumbh"
        }
      ],
      "song": {
        "artist": "Shankar Mahadevan",
        "title": "Maa"
      },
      "trivia": "The film catalyzed national dialogue in India regarding inclusive education for children with learning differences and dyslexia."
    },
    "year": "2007",
    "youtubeId": "p2JChobU4Ek"
  },
  {
    "audio": [
      "Hindi 5.1 Original"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/riwwiv2BMD9D6L3NM4sJjHCMVsm.jpg",
    "dubs": [
      "Hindi (Original)"
    ],
    "fullMovieYoutubeId": "cSfNfckoXPc",
    "genres": [
      "Crime",
      "Action",
      "Drama",
      "Cult Epic"
    ],
    "id": "gangs-of-wasseypur",
    "isClassic": true,
    "language": "Hindi",
    "match": "98% Match",
    "overview": "A generational feud between Sardar Khan's bloodline and coal mafia kingpin Ramadhir Singh consumes three generations of vengeance, blood, and politics in the dusty town of Wasseypur.",
    "poster": "https://image.tmdb.org/t/p/w780/xAy208Znkingmfnb5ZbULwLyIwW.jpg",
    "providers": [
      {
        "badge": "Uncut 4K",
        "name": "Viacom18 Studios"
      },
      {
        "badge": "Cult Classic",
        "name": "MOVAni Pass"
      }
    ],
    "rating": "18+",
    "runtime": "5h 21m",
    "studio": "AKFPL / Viacom18",
    "subs": [
      "Hindi [Sub]",
      "English [CC]"
    ],
    "title": "Gangs of Wasseypur",
    "tmdbId": 117691,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
          "name": "Manoj Bajpayee",
          "role": "Sardar Khan"
        },
        {
          "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
          "name": "Nawazuddin Siddiqui",
          "role": "Faizal Khan"
        },
        {
          "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
          "name": "Tigmanshu Dhulia",
          "role": "Ramadhir Singh"
        }
      ],
      "song": {
        "artist": "Sneha Khanwalkar & Amit Trivedi",
        "title": "Teri Keh Ke Lunga"
      },
      "trivia": "Screened in its entirety at the 2012 Cannes Directors' Fortnight, Gangs of Wasseypur is hailed as one of the defining masterpieces of 21st century world cinema."
    },
    "year": "2012",
    "youtubeId": "cSfNfckoXPc"
  },
  {
    "audio": [
      "Hindi Original"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/lx94BR9gILXSGptjaUSUPveBjJu.jpg",
    "dubs": [
      "Hindi (Original)"
    ],
    "fullMovieYoutubeId": "DuJ_7UVyGIc",
    "genres": [
      "Action",
      "Crime",
      "Drama",
      "Angry Young Man Classic"
    ],
    "id": "deewaar-1975",
    "isClassic": true,
    "language": "Hindi",
    "match": "99% Match",
    "overview": "Haunted by the past, Vijay turns to crime and underworld power, while Ravi, his younger brother, becomes an honest police officer. A clash of conscience, duty, and maternal love.",
    "poster": "https://image.tmdb.org/t/p/w780/pwzfljCp52jieXTBE0lynz7bu2g.jpg",
    "providers": [
      {
        "badge": "Official 1080p",
        "name": "Shemaroo Movies"
      },
      {
        "badge": "Historic Milestone",
        "name": "MOVAni Pass"
      }
    ],
    "rating": "U/A",
    "runtime": "2h 54m",
    "studio": "Trimurti Films",
    "subs": [
      "Hindi [Sub]",
      "English [CC]"
    ],
    "title": "Deewaar",
    "tmdbId": 22460,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
          "name": "Amitabh Bachchan",
          "role": "Vijay Verma"
        },
        {
          "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
          "name": "Shashi Kapoor",
          "role": "Ravi Verma"
        },
        {
          "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
          "name": "Nirupa Roy",
          "role": "Sumitra Devi (Maa)"
        }
      ],
      "song": {
        "artist": "Kishore Kumar & Asha Bhosle",
        "title": "Keh Doon Tumhe"
      },
      "trivia": "The iconic dialogue 'Mere paas maa hai' written by Salim-Javed cemented Deewaar into world film history."
    },
    "year": "1975",
    "youtubeId": "DuJ_7UVyGIc"
  },
  {
    "audio": [
      "Hindi Original"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/1jMZUfDCLY3ytKlziU88jqe9KLK.jpg",
    "dubs": [
      "Hindi (Original)"
    ],
    "fullMovieYoutubeId": "znzNyRVXl2I",
    "genres": [
      "Action",
      "Thriller",
      "Crime",
      "Classic"
    ],
    "id": "don-1978",
    "isClassic": true,
    "language": "Hindi",
    "match": "99% Match",
    "overview": "When the ruthless kingpin of an international cartel named Don is mortally wounded, an honest street-singer named Vijay is recruited to infiltrate the gang, sparking a deadly high-stakes manhunt.",
    "poster": "https://image.tmdb.org/t/p/w780/cLxX1pmZitRXGdxtmbLuPBq53Y9.jpg",
    "providers": [
      {
        "badge": "Official 1080p",
        "name": "Shemaroo Movies"
      },
      {
        "badge": "Action Legend",
        "name": "MOVAni Pass"
      }
    ],
    "rating": "U/A",
    "runtime": "2h 45m",
    "studio": "Nariman Films",
    "subs": [
      "Hindi [Sub]",
      "English [CC]"
    ],
    "title": "Don",
    "tmdbId": 33104,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
          "name": "Amitabh Bachchan",
          "role": "Don / Vijay (Dual Role)"
        },
        {
          "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
          "name": "Zeenat Aman",
          "role": "Roma"
        },
        {
          "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
          "name": "Pran",
          "role": "Jasjit (Michael)"
        }
      ],
      "song": {
        "artist": "Kishore Kumar",
        "title": "Khaike Paan Banaraswala"
      },
      "trivia": "Amitabh Bachchan chewed real betel leaves and lime paste to deliver authentic red-stained lips and singing energy for the hit song."
    },
    "year": "1978",
    "youtubeId": "znzNyRVXl2I"
  },
  {
    "audio": [
      "Hindi Original"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/pfXRHq26dBOJxUs0OlApCFpat1y.jpg",
    "dubs": [
      "Hindi (Original)"
    ],
    "fullMovieYoutubeId": "jxPYbYeA-VQ",
    "genres": [
      "Comedy",
      "Romance",
      "Classic"
    ],
    "id": "gol-maal-1979",
    "isClassic": true,
    "language": "Hindi",
    "match": "99% Match",
    "overview": "A chartered accountant named Ramprasad invents a fictional twin brother to keep his job under an orthodox, mustache-obsessed boss Bhavani Shankar, triggering a comedic spiral of deceptions.",
    "poster": "https://image.tmdb.org/t/p/w780/uPW269Qx8VxfiQI2PFHcSJkGOI2.jpg",
    "providers": [
      {
        "badge": "Official 1080p",
        "name": "Shemaroo Movies"
      },
      {
        "badge": "Comedy Masterpiece",
        "name": "MOVAni Pass"
      }
    ],
    "rating": "U",
    "runtime": "2h 24m",
    "studio": "Rupam Chitra",
    "subs": [
      "Hindi [Sub]",
      "English [CC]"
    ],
    "title": "Gol Maal",
    "tmdbId": 30066,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
          "name": "Amol Palekar",
          "role": "Ramprasad / Lakshmanprasad Sharma"
        },
        {
          "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
          "name": "Utpal Dutt",
          "role": "Bhavani Shankar"
        },
        {
          "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
          "name": "Bindiya Goswami",
          "role": "Urmila"
        }
      ],
      "song": {
        "artist": "Kishore Kumar",
        "title": "Aanewala Pal Jaanewala Hai"
      },
      "trivia": "Directed by Hrishikesh Mukherjee, Gol Maal won three Filmfare Awards and remains one of the highest-rated Indian comedies of all time."
    },
    "year": "1979",
    "youtubeId": "jxPYbYeA-VQ"
  },
  {
    "audio": [
      "Hindi 5.1 Original"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/AmRfsOyEXpVhnaYXZMoDlZd9Siq.jpg",
    "dubs": [
      "Hindi (Original)"
    ],
    "fullMovieYoutubeId": "7v07PLlIPgo",
    "genres": [
      "Drama",
      "Patriotic",
      "Inspiring"
    ],
    "id": "swades-2004",
    "isClassic": true,
    "language": "Hindi",
    "match": "99% Match",
    "overview": "Mohan Bhargava, a successful NASA scientist, returns to a remote Indian village to find his childhood nanny, finding a newfound sense of purpose in building a hydroelectric generator to illuminate rural lives.",
    "poster": "https://image.tmdb.org/t/p/w780/yUSL24kpHc9Nls4Pohia4shgcIM.jpg",
    "providers": [
      {
        "badge": "Official 4K",
        "name": "Netflix / UTV"
      },
      {
        "badge": "Heartfelt Classic",
        "name": "MOVAni Pass"
      }
    ],
    "rating": "U",
    "runtime": "3h 15m",
    "studio": "Ashutosh Gowariker Productions",
    "subs": [
      "Hindi [Sub]",
      "English [CC]"
    ],
    "title": "Swades",
    "tmdbId": 15774,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
          "name": "Shah Rukh Khan",
          "role": "Mohan Bhargava"
        },
        {
          "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
          "name": "Gayatri Joshi",
          "role": "Gita"
        },
        {
          "image": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80",
          "name": "Kishori Ballal",
          "role": "Kaveri Amma"
        }
      ],
      "song": {
        "artist": "A. R. Rahman",
        "title": "Yeh Jo Des Hai Tera"
      },
      "trivia": "Swades was the first Indian film filmed inside NASA's Goddard Space Flight Center in Maryland."
    },
    "year": "2004",
    "youtubeId": "7v07PLlIPgo"
  },
  {
    "audio": [
      "Hindi 5.1 Original"
    ],
    "backdrop": "https://image.tmdb.org/t/p/original/smaFFzbd1flJKUqDI2ylljQ8Pki.jpg",
    "dubs": [
      "Hindi (Original)"
    ],
    "fullMovieYoutubeId": "6lCGvu-hwX4",
    "genres": [
      "Comedy",
      "Drama",
      "Feel-Good"
    ],
    "id": "munna-bhai-mbbs",
    "isClassic": true,
    "language": "Hindi",
    "match": "99% Match",
    "overview": "A good-natured underworld don masquerades as a certified doctor to fulfill his parents' wish, enrolling in a premier medical college where he heals patients through compassion, humor, and 'jaadu ki jhappi'.",
    "poster": "https://image.tmdb.org/t/p/w780/OjJ2eZFMr0InHxjYCQXwxDoo4v.jpg",
    "providers": [
      {
        "badge": "Official HD",
        "name": "Vinod Chopra Films"
      },
      {
        "badge": "Beloved Comedy",
        "name": "MOVAni Pass"
      }
    ],
    "rating": "U/A",
    "runtime": "2h 36m",
    "studio": "Vinod Chopra Films",
    "subs": [
      "Hindi [Sub]",
      "English [CC]"
    ],
    "title": "Munna Bhai M.B.B.S.",
    "tmdbId": 19625,
    "type": "movies",
    "xray": {
      "actors": [
        {
          "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
          "name": "Sanjay Dutt",
          "role": "Murli Prasad Sharma (Munna Bhai)"
        },
        {
          "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
          "name": "Arshad Warsi",
          "role": "Sarkeshwar (Circuit)"
        },
        {
          "image": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&q=80",
          "name": "Boman Irani",
          "role": "Dr. J. C. Asthana"
        }
      ],
      "song": {
        "artist": "Vinod Rathod & Sanjay Dutt",
        "title": "M Bole Toh"
      },
      "trivia": "Munna Bhai M.B.B.S. popularized the catchphrase 'Jaadu Ki Jhappi' (magical hug) and won the National Film Award for Best Popular Film."
    },
    "year": "2003",
    "youtubeId": "6lCGvu-hwX4"
  }
];

const STUDIOS_LIST = [
  {
    "color": "text-orange-400",
    "icon": "ph-sparkle",
    "name": "Crunchyroll",
    "type": "Anime Simulcasts"
  },
  {
    "color": "text-red-500",
    "icon": "ph-sword",
    "name": "MAPPA",
    "type": "Anime Vault"
  },
  {
    "color": "text-amber-400",
    "icon": "ph-crown",
    "name": "Hombale Films",
    "type": "Kannada Blockbusters"
  },
  {
    "color": "text-purple-400",
    "icon": "ph-television",
    "name": "HBO Max",
    "type": "Prestige Series"
  },
  {
    "color": "text-blue-400",
    "icon": "ph-mountains",
    "name": "Paramount",
    "type": "Blockbuster Hub"
  },
  {
    "color": "text-emerald-400",
    "icon": "ph-fire",
    "name": "Ufotable",
    "type": "Cinematic Sakuga"
  },
  {
    "color": "text-yellow-400",
    "icon": "ph-star-four",
    "name": "Hotstar",
    "type": "Regional Thrillers"
  }
];

function filterCatalog(options = {}) {
  const { category, studio, q, dub, sub, limit } = options;
  const lang = options.lang || options.language;
  let results = [...CATALOG_DATA];

  if (category && category !== 'all') {
    results = results.filter(i => (i.type || '').toLowerCase() === category.toLowerCase());
  }
  if (studio) {
    results = results.filter(i => (i.studio || '').toLowerCase().includes(studio.toLowerCase()));
  }
  if (dub) {
    results = results.filter(i =>
      (i.dubs || []).some(d => d.toLowerCase().includes(dub.toLowerCase())) ||
      (i.audio || []).some(a => a.toLowerCase().includes(dub.toLowerCase()))
    );
  }
  if (sub) {
    results = results.filter(i =>
      (i.subs || []).some(s => s.toLowerCase().includes(sub.toLowerCase()))
    );
  }
  if (lang && lang !== 'all') {
    const langMap = {
      kn: 'kannada', hi: 'hindi', en: 'english', ja: 'japanese',
      ta: 'tamil', te: 'telugu', ko: 'korean', es: 'spanish', fr: 'french', de: 'german'
    };
    const target = langMap[lang] || lang.toLowerCase();
    results = results.filter(i =>
      (i.language && i.language.toLowerCase() === target) ||
      (i.isKannada && target === 'kannada') ||
      (i.dubs || []).some(d => d.toLowerCase().includes(target)) ||
      (i.audio || []).some(a => a.toLowerCase().includes(target)) ||
      (i.subs || []).some(s => s.toLowerCase().includes(target))
    );
    if (target === 'kannada') {
      results.sort((a, b) => {
        const aIsKn = (a.language === 'Kannada' || a.isKannada) ? 1 : 0;
        const bIsKn = (b.language === 'Kannada' || b.isKannada) ? 1 : 0;
        return bIsKn - aIsKn;
      });
    } else if (target === 'hindi') {
      results.sort((a, b) => {
        const aIsHi = (a.language === 'Hindi') ? 1 : 0;
        const bIsHi = (b.language === 'Hindi') ? 1 : 0;
        return bIsHi - aIsHi;
      });
    }
  }
  if (q) {
    const query = q.toLowerCase();
    results = results.filter(i =>
      (i.title || '').toLowerCase().includes(query) ||
      (i.overview || '').toLowerCase().includes(query) ||
      (i.studio || '').toLowerCase().includes(query) ||
      (i.language && i.language.toLowerCase().includes(query)) ||
      (i.genres || []).some(g => g.toLowerCase().includes(query)) ||
      (i.dubs || []).some(d => d.toLowerCase().includes(query)) ||
      (i.xray?.actors || []).some(a => (a.name || '').toLowerCase().includes(query))
    );
    if (query.includes('kannada') || query === 'kn' || query.includes('ಕನ್ನಡ')) {
      results.sort((a, b) => {
        const aIsKn = (a.language === 'Kannada' || a.isKannada) ? 1 : 0;
        const bIsKn = (b.language === 'Kannada' || b.isKannada) ? 1 : 0;
        return bIsKn - aIsKn;
      });
    }
  }
  if (limit && Number(limit) > 0) {
    results = results.slice(0, Number(limit));
  }
  return results;
}

function getTitleById(id) {
  if (!id) return null;
  const strId = String(id).toLowerCase();
  return CATALOG_DATA.find(i =>
    String(i.id).toLowerCase() === strId ||
    String(i.tmdbId) === strId
  ) || null;
}

function getTop10() {
  return CATALOG_DATA.slice(0, 10);
}

function getStudios() {
  return STUDIOS_LIST;
}

function handler(req, res) {
  if (res && res.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req && req.method === 'OPTIONS') {
    if (res && res.status) return res.status(204).end();
    return;
  }

  const query = (req && req.query) || {};
  const url = (req && req.url) || '';
  const route = query.route || query.endpoint || (url.includes('/top10') ? 'top10' : url.includes('/studios') ? 'studios' : url.includes('/health') ? 'health' : 'catalog');

  let data;
  switch (route) {
    case 'top10':
      data = getTop10();
      break;
    case 'studios':
      data = getStudios();
      break;
    case 'health':
      data = {
        status: 'healthy',
        app: 'MOVAni',
        version: '4.0.0-JS',
        titles_count: CATALOG_DATA.length,
        timestamp: new Date().toISOString()
      };
      break;
    case 'title':
      data = getTitleById(query.id) || { error: 'Title not found' };
      break;
    case 'catalog':
    default:
      if (query.id) {
        data = getTitleById(query.id) || { error: 'Title not found' };
      } else {
        data = filterCatalog(query);
      }
      break;
  }

  if (res && res.json) {
    return res.json(data);
  } else if (res && res.setHeader && res.end) {
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(data));
  }
  return data;
}

const NEXSTREAM_API_KEY = "nx_f388cf270eb1c40dc4f1d5c9d79e9c12";

function getEmbedUrl(tmdbId, isEpisodic = false, season = 1, episode = 1, server = 'nexstream') {
  if (!tmdbId) return null;
  const s = season || 1;
  const e = episode || 1;
  const key = NEXSTREAM_API_KEY;

  switch (server) {
    case 'nexstream':
      return isEpisodic
        ? `https://api.codespecters.com/embed/tv/${tmdbId}/${s}/${e}?apikey=${key}`
        : `https://api.codespecters.com/embed/movie/${tmdbId}?apikey=${key}`;
    case 'autoembed':
      return isEpisodic
        ? `https://autoembed.co/tv/tmdb/${tmdbId}-${s}-${e}`
        : `https://autoembed.co/movie/tmdb/${tmdbId}`;
    case 'vidlink':
      return isEpisodic
        ? `https://vidlink.pro/tv/${tmdbId}/${s}/${e}?apikey=${key}`
        : `https://vidlink.pro/movie/${tmdbId}?apikey=${key}`;
    case 'embedsu':
      return isEpisodic
        ? `https://embed.su/embed/tv/${tmdbId}/${s}/${e}`
        : `https://embed.su/embed/movie/${tmdbId}`;
    case '2embed':
      return isEpisodic
        ? `https://www.2embed.cc/embedtv/${tmdbId}&s=${s}&e=${e}`
        : `https://www.2embed.cc/embed/${tmdbId}`;
    case 'vidsrc':
      return isEpisodic
        ? `https://vidsrc.pm/embed/tv?tmdb=${tmdbId}&season=${s}&episode=${e}`
        : `https://vidsrc.pm/embed/movie?tmdb=${tmdbId}`;
    case 'multiembed':
      return isEpisodic
        ? `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${s}&e=${e}`
        : `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`;
    case 'fullmovie':
      return isEpisodic
        ? `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${s}&e=${e}`
        : `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`;
    default:
      return isEpisodic
        ? `https://api.codespecters.com/embed/tv/${tmdbId}/${s}/${e}?apikey=${key}`
        : `https://api.codespecters.com/embed/movie/${tmdbId}?apikey=${key}`;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = handler;
  module.exports.handler = handler;
  module.exports.CATALOG_DATA = CATALOG_DATA;
  module.exports.STUDIOS_LIST = STUDIOS_LIST;
  module.exports.NEXSTREAM_API_KEY = NEXSTREAM_API_KEY;
  module.exports.EMBED_API_KEY = NEXSTREAM_API_KEY;
  module.exports.getEmbedUrl = getEmbedUrl;
  module.exports.filterCatalog = filterCatalog;
  module.exports.getTitleById = getTitleById;
  module.exports.getTop10 = getTop10;
  module.exports.getStudios = getStudios;
}

if (typeof window !== 'undefined') {
  window.MOVAniAPI = {
    CATALOG_DATA,
    STUDIOS_LIST,
    NEXSTREAM_API_KEY,
    EMBED_API_KEY: NEXSTREAM_API_KEY,
    getEmbedUrl,
    filterCatalog,
    getTitleById,
    getTop10,
    getStudios
  };
}
