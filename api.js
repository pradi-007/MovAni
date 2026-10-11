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
    "match": "99% Match",
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
    "youtubeId": "JKa05nyUmuQ"
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
    "match": "98% Match",
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
    "match": "97% Match",
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
    "isUpcoming": true,
    "match": "99% Match",
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
    "match": "99% Match",
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
    "match": "96% Match",
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
    "isUpcoming": true,
    "match": "97% Match",
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
    "genres": [
      "Action",
      "Drama",
      "Period"
    ],
    "id": "kaatera",
    "match": "98% Match",
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
    "youtubeId": "lVuuwNQg74M"
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
  const { category, studio, q, dub, sub, lang, limit } = options;
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
      (i.dubs || []).some(d => d.toLowerCase().includes(target)) ||
      (i.audio || []).some(a => a.toLowerCase().includes(target)) ||
      (i.subs || []).some(s => s.toLowerCase().includes(target))
    );
  }
  if (q) {
    const query = q.toLowerCase();
    results = results.filter(i =>
      (i.title || '').toLowerCase().includes(query) ||
      (i.overview || '').toLowerCase().includes(query) ||
      (i.studio || '').toLowerCase().includes(query) ||
      (i.genres || []).some(g => g.toLowerCase().includes(query)) ||
      (i.xray?.actors || []).some(a => (a.name || '').toLowerCase().includes(query))
    );
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
